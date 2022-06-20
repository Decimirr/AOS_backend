const mysql = require('mysql')
const config = require('./config')

const con = mysql.createConnection(config)


con.connect(function(err) {
    if (err) throw err;
    console.log("Connected")
})


module.exports = con
