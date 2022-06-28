const mysql = require('mysql')
const config = require('./config')
const fs = require('fs')

//const con = mysql.createConnection(config)
const con = mysql.createPool({host: "5kxizn5smy4sk.mysql.database.azure.com", user: "kim0724@5kxizn5smy4sk", password: process.env.database_password, database: 'aos', port: 3306, ssl:{ca:fs.readFileSync("./secret/BaltimoreCyberTrustRoot.crt.pem")}, multipleStatements: true});
/*
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected")
})
*/

module.exports = con
