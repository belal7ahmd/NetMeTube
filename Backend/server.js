const express = require("express");
const bcrypt = require("bcrypt");
const mysql = require("mysql2");
const JWT = require("jsonwebtoken");
const crypto = require("crypto");
const multer = require("multer");
const { mkdirSync } = require("fs");


const MAX_SIZE = 100 * 1024 * 1024; // 100 * 1024 * 1024 bytes = 100 MB

const PORT = process.env.BACKEND_PORT || 4012;
const saltRounds = 12;

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let path

        let date = new Date()
        let year = date.getFullYear()
        let month = date.getMonth() + 1

        path = `./uploads/videos/${year}/${month}/`

        mkdirSync(path, { recursive:true })

        req.videoPath = path

        cb(null, path)
        return path
    },

    filename: (req, file, cb) => {
        let filename
        let uuid
        
        if ('videoUUID' in req) {
            uuid = req.videoUUID
        } else {
            uuid = crypto.randomUUID()
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
    storage:storage,
    limits:{
        fileSize: MAX_SIZE
    }
})

let app = express();


let db_connection = mysql.createPool({
    user:process.env.DB_USER,
    host:process.env.DB_HOST, // Replace the localhost with the db ip
    port:parseInt(process.env.DB_PORT),
    password:process.env.MYSQL_ROOT_PASSWORD,
    database:process.env.MYSQL_DATABASE
})

app.use(express.json());

app.use((req, res, next) => {
    if (!req.headers.authorization) {
        req.userId = "unauthorized"
        next()
        return;
    }

    try {
        let user = JWT.verify(
            req.headers.authorization.split(" ")[1],
            process.env.JWT_TOKEN
        )
        req.userId = user.userId
    } catch (e) {
        req.userId = "unauthorized"
    }

    next()
})

app.post("/upload", [
    async (req, res, next) => {
        if (req.userId == "unauthorized") {
            res.status(401).json({status:"err", message:"Unauthorized"})
            return;
        }

        let query = "SELECT BIN_TO_UUID(channel_id) AS channel_id FROM channels WHERE user_id=UUID_TO_BIN(?)"

        let channel = await db_connection.promise().execute(query, [req.userId])

        if (channel[0].length <= 0) {
            res.status(403).json({status:"err", message:"Channel not found"})
            return;
        }

        req.channelID = channel[0][0].channel_id

        next()
    },

    upload.fields([
        {name:"videoFile", maxCount:1},
        {name:"thumbFile", maxCount:1}
    ])
], async (req, res) => {
    const body = req.body

    let query = "INSERT INTO videos (video_id, video_path, thumbnail_path, video_title, video_description, channel_id) VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, UUID_TO_BIN(?))"

    try {
        let result = await db_connection.promise().execute(query, [
            req.videoUUID, 
            req.videoPath + req.videoUUID + ".mp4", 
            req.videoPath + req.videoUUID + ".png",
            body.title,
            body.description,
            req.channelID,

        ])
    } catch (e) {
        console.log(`Error querying database in upload: ${e}`)
        res.status(500).json({status:"err", message:"Internal server error."})
        return;
    }

    res.status(200).json({status:"success", message:"Video Uploaded"})


})

app.post("/login", async (req, res) => {
    const body = req.body

    try {
        let query = "SELECT user_password, BIN_TO_UUID(user_id) AS user_id FROM users WHERE user_email=?"

        let result = await db_connection.promise().execute(query, [req.body.email])

        if (result[0].length <= 0) {
            res.status(401).json({status:"err", message:"Password or email are not correct"})
            return;
        }

        let match = await bcrypt.compare(req.body.password, result[0][0].user_password)

        if (!match) {
            res.status(401).json({status:"err", message:"Password or email are not correct"})
            return;
        }

        res.status(200).json({
            token:JWT.sign(
                {
                    userId:result[0][0].user_id,
                    iac:Math.floor(Date.now() / 1000),
                    jti:crypto.randomBytes(16).toString('hex')
                },
                process.env.JWT_TOKEN
            ),
            status:"success"
        })

    } catch (e) {
        console.log("Error in login (maybe querying db): " +e)
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
                status:"err",
                message:"Email used in another account"
            })
            return;
        }

        let hashed_password = await bcrypt.hash(body.password, saltRounds)

        query = "INSERT INTO users (user_id, user_email, username, user_password) VALUES (UUID_TO_BIN(UUID(), 1), ?, ?, ?)"

        result = await db_connection.promise().execute(query, [body.email, body.username, hashed_password])

        res.json({
            status:"success",
            message:"Account signed in"
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