const express = require('express')
const app = express()
const path = require('path')
const bodyParser = require( 'body-parser')
const cors = require('cors')
const util = require("./util");
const port = process.env.PORT || 8080

app.use(cors())
/*app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "*");
    next()
});*/

app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.use("/api/training", require("./api/training"));
app.use("/api/mission", require("./api/mission"));
app.use("/api/team", require("./api/team"));
app.use("/api/scoreboard", require("./api/scoreboard"));
app.use("/api/map", require("./api/map"));


app.listen(port, function (){
    console.log(`Server is working on port ${port}`);
})