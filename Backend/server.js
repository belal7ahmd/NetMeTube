const express = require("express");
const { compare, hash } = require("bcrypt");
const { createPool } = require("mysql2");
const { verify, sign } = require("jsonwebtoken");
const { randomUUID, randomBytes } = require("crypto");
const multer = require("multer");
const { diskStorage } = multer;
const { mkdirSync, existsSync } = require("fs");
const { resolve, join } = require("path");
const { exec, spawn } = require("child_process");
const { promisify } = require("util");
const Queue = require("queue");
const { processVideo } = require("./videoProcessing");
const { time } = require("console");

const execPromise = promisify(exec)

const MAX_SIZE = 100 * 1024 * 1024; // 100 * 1024 * 1024 bytes = 100 MB

const PORT = process.env.BACKEND_PORT || 4012;
const saltRounds = 12;

// Resolutions to generate
const RESOLUTIONS = [144, 360, 420, 780, 1080, 1440]

let storage = diskStorage({
    destination: (req, file, cb) => {
        let path

        let date = new Date()
        let year = date.getFullYear()
        let month = date.getMonth() + 1

        path = `./uploads/videos/${year}/${month}/`
        if (!existsSync(path)) {
            mkdirSync(path, { recursive: true })
        }

        req.videoPath = `${year}/${month}`

        cb(null, path)
        return path
    },

    filename: (req, file, cb) => {
        let filename
        let uuid

        if ('videoUUID' in req) {
            uuid = req.videoUUID
        } else {
            uuid = randomUUID()
            req.videoUUID = uuid
        }


        if (file.fieldname == "videoFile") {
            filename = `${uuid}.mp4`

        } else if (file.fieldname == "thumbFile") {
            filename = `${uuid}.png`
        }

        cb(null, filename)
    }
})


let upload = multer({
    storage: storage,
    limits: {
        fileSize: MAX_SIZE
    }
})

const videoProccessQueue = new Queue.default({ 
    autostart: true,
    concurrency: 3, // run 3 FFmpeg processes at once
});

let app = express();

let db_connection = createPool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST, // Replace the localhost with the db ip
    port: parseInt(process.env.DB_PORT),
    password: process.env.MYSQL_ROOT_PASSWORD,
    database: process.env.MYSQL_DATABASE
})

app.use(express.json());

app.use((req, res, next) => {
    if (!req.headers.authorization) {
        req.userId = "unauthorized"
        next()
        return;
    }

    try {
        let user = verify(
            req.headers.authorization.split(" ")[1],
            process.env.JWT_TOKEN
        )
        req.userId = user.userId
    } catch (e) {
        req.userId = "unauthorized"
    }

    next()
})

app.get("/video/:id", async (req, res) => {
    const videoID = req.params.id

    const resolution = req.query.res || 1080

    try {
        let metadataQuery = "SELECT video_title, video_description FROM videos WHERE video_id=UUID_TO_BIN(?)"
        let resolutionsQuery = "SELECT resolution FROM video_paths WHERE video_id=UUID_TO_BIN(?)"

        let metadataResult = await db_connection.promise().execute(metadataQuery, [videoID])
        let resolutionResult = await db_connection.promise().execute(resolutionsQuery, [videoID])

        if (metadataResult[0].length == 0) {
            res.status(404).json({ status: "err", message: "Video not found" })
            return;
        }
        
        // Get the the rows then get the first result
        let [metadataRows] = metadataResult
        let [resolutionRows] = resolutionResult

        let { video_title, video_description } = metadataRows[0]
        let availableResolutions = resolutionRows.map(({ resolution }) => resolution)


        res.status(200).json({ status: "success", title: video_title, description: video_description, resolutions:availableResolutions })

    } catch (e) {
        console.log(`Error querying database watch: ${e}`)

        res.status(500).json({ status: "err", message: "Internal server error" })
    }
})

app.get("/thumb/:id", async (req, res) => {
    const thumbID = req.params.id
    try {
        let query = "SELECT thumbnail_path FROM videos WHERE video_id=UUID_TO_BIN(?)"

        let result = await db_connection.promise().execute(query, [thumbID])

        if (result[0].length == 0) {
            res.status(404).json({ status: "err", message: "Video not found" })
            return;
        }
        // Get the the rows then get the first result
        let [rows] = result

        let { thumb_path } = rows[0]

        thumb_path = resolve(`./uploads/videos/${thumb_path}/${thumbID}.png`)

        res.sendFile(thumb_path)

    } catch (e) {
        console.log(`Error querying database watch: ${e}`)

        res.status(500).json({ status: "err", message: "Internal server error" })
    }
})


app.get("/stream/:id", async (req, res) => {
    const videoID = req.params.id;
    const resolution  = req.query.resolution || 1080;
    try {
        let query = "SELECT video_path FROM video_paths WHERE video_id=UUID_TO_BIN(?)";

        let result = await db_connection.promise().execute(query, [videoID]);

        if (result[0].length == 0) {
            res.status(404).json({ status: "err", message: "Video not found" });
            return;
        };
        // Get the the rows then get the first result
        let [rows] = result;

        let timestamp = rows[0].video_path;

        let videoPath = `./uploads/videos/${timestamp}/${videoID}/${resolution}.mp4`;

        if (!existsSync(videoPath)) {
            console.log("Resolution not found");
            res.status(500).json({ status: "err", message: "Resolution not found" });
            return;
        }

        videoPath = resolve(videoPath);

        res.sendFile(videoPath);

    } catch (e) {
        console.log(`Error querying database watch: ${e}`);

        res.status(500).json({ status: "err", message: "Internal server error" });
    };
})

app.post("/upload", [
    async (req, res, next) => {
        if (req.userId == "unauthorized") {
            res.status(401).json({ status: "err", message: "Unauthorized" })
            return;
        }

        let query = "SELECT BIN_TO_UUID(channel_id) AS channel_id FROM channels WHERE user_id=UUID_TO_BIN(?)"

        let channel = await db_connection.promise().execute(query, [req.userId])

        if (channel[0].length <= 0) {
            res.status(403).json({ status: "err", message: "Channel not found" })
            return;
        }

        req.channelID = channel[0][0].channel_id

        console.log(req.channelID)

        next()
    },

    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbFile", maxCount: 1 }
    ])
], async (req, res) => {
    const body = req.body

    // the video is the metadata and the paths are the actual video
    let videoQuery = "INSERT INTO videos (video_id, small_thumbnail_path, medium_thumbnail_path, large_thumbnail_path, video_title, video_description, channel_id) VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, ?, UUID_TO_BIN(?))"
    let pathsQuery = "INSERT INTO video_paths (path_id, video_id, video_path, resolution) VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?)"

    const baseFilePath = join(__dirname, 'uploads', 'videos', req.videoPath);
    const outputFilePath = join(baseFilePath, req.videoUUID);
    const inputFilePath = join(baseFilePath, `${req.videoUUID}.mp4`);

    mkdirSync(outputFilePath)

    res.status(202).json({
        status:"success",
        message:"executing"
    })

    try {
        let { stdout } = await execPromise(`ffprobe -v quiet -print_format json -show_format -show_streams ${inputFilePath}`)

        let metadata = JSON.parse(stdout)

        let stream = metadata.streams[0]

        let videoResolution = { width: stream.width, height: stream.height }

        // Resolutions to generate
        for (let resolution of RESOLUTIONS) {
            // If the video quality is low scaling it up wouldn't be worth it
            if (resolution > videoResolution.height) {
                continue
            }
            
            videoProccessQueue.push(async () => {
                await processVideo(resolution, inputFilePath, outputFilePath)
                let pathResult = await db_connection.promise().execute(pathsQuery, [
                    randomUUID(),
                    req.videoUUID,
                    req.videoPath,
                    resolution
                ])
            })
        }

        let videoResult = await db_connection.promise().execute(videoQuery, [
            req.videoUUID,
            req.videoPath,
            req.videoPath,
            req.videoPath,
            body.title,
            body.description,
            req.channelID
        ])
    } catch (e) {
        console.log(`Error querying database in upload: ${e}`)
        return;
    }


})

app.post("/login", async (req, res) => {
    const body = req.body

    try {
        let query = "SELECT user_password, BIN_TO_UUID(user_id) AS user_id FROM users WHERE user_email=?"

        let result = await db_connection.promise().execute(query, [req.body.email])

        if (result[0].length <= 0) {
            res.status(401).json({ status: "err", message: "Password or email are not correct" })
            return;
        }

        let match = await compare(req.body.password, result[0][0].user_password)

        if (!match) {
            res.status(401).json({ status: "err", message: "Password or email are not correct" })
            return;
        }

        res.status(200).json({
            token: sign(
                {
                    userId: result[0][0].user_id,
                    iac: Math.floor(Date.now() / 1000),
                    jti: randomBytes(16).toString('hex')
                },
                process.env.JWT_TOKEN
            ),
            status: "success"
        })

    } catch (e) {
        console.log("Error in login (maybe querying db): " + e)
        res.status(500).json({ status: "err", message: "Internal server error" });
    }
})

app.post("/signup", async (req, res) => {
    const body = req.body

    try {
        let query = "SELECT * FROM users WHERE user_email=?"

        let result = await db_connection.promise().execute(query, [body.email])

        if (result[0].length > 0) {
            res.json({
                status: "err",
                message: "Email used in another account"
            })
            return;
        }

        let hashed_password = await hash(body.password, saltRounds)

        query = "INSERT INTO users (user_id, user_email, username, user_password) VALUES (UUID_TO_BIN(?), ?, ?, ?)"

        result = await db_connection.promise().execute(query, [randomUUID(), body.email, body.username, hashed_password])

        res.json({
            status: "success",
            message: "Account signed in"
        })
        return;
    } catch (e) {
        console.log(`Error querying database: ${e}`)
        res.status(500).json({ status: "err", message: "Internal server error" });
    }
})

app.listen(PORT, () => {
    console.log(`Server Listening on port ${PORT}`)

})