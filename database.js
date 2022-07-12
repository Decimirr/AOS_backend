const mysql = require('mysql')
const config = require('./config')
const fs = require('fs')

//const con = mysql.createConnection(config)
const con = mysql.createPool({host:"aos-database.mysql.database.azure.com", user:"Decimirr", password:process.env.database_password, database:'aos', port:3306, ssl:{ca:fs.readFileSync("./secret/BaltimoreCyberTrustRoot.crt.pem")}, multipleStatements: true});
/*
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected")
})
*/

module.exports = con
