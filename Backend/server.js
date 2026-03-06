const express = require("express");
const bcrypt = require("bcrypt");
const mysql = require("mysql2");


const PORT = process.env.BACKEND_PORT || 4012

let app = express();

let db_connection = mysql.createPool({
    user:process.env.DB_USER,
    host:process.env.DB_HOST, // Replace the localhost with the db ip
    port:parseInt(process.env.DB_PORT),
    password:process.env.MYSQL_ROOT_PASSWORD,
    database:process.env.MYSQL_DATABASE
})

app.use(express.json());

app.post("/signup", async (req, res) => {
    const body = req.body
    console.log(body)

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

        let saltRounds = 12

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