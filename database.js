const mysql = require('mysql')
const fs = require('fs')

const con = mysql.createPool({
  host:"aos-database.mysql.database.azure.com",
  user:"Decimirr",
  password:process.env.database_password,
  database:'aos',
  port:3306,
  ssl:{rejectUnauthorized: false, ca:fs.readFileSync("./secret/BaltimoreCyberTrustRoot.crt.pem")},
  multipleStatements: true,
  connectTimeout  : 60 * 60 * 1000,
  acquireTimeout  : 60 * 60 * 1000,
  timeout         : 60 * 60 * 1000,
  connectionLimit: 30,
});

module.exports = con
