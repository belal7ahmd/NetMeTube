const express = require("express");
const bcrypt = require("bcrypt");
const mysql = require("mysql2");

const PORT = 4012

let app = express();

app.post("/signup", (req, res) => {

    res.send("pewp")
})

app.listen(PORT, () => {
    console.log(`Server Listening on port ${PORT}`)
})