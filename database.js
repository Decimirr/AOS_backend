const mysql = require('mysql')
const fs = require('fs')

const config = {
  host:"aos-database.mysql.database.azure.com",
  user:"Decimirr",
  password:process.env.database_password,
  database:'aos',
  port:3306,
  ssl:{rejectUnauthorized: false, ca:fs.readFileSync("./secret/BaltimoreCyberTrustRoot.crt.pem")},
  multipleStatements: true,
  connectTimeout  : 30 * 24 * 60 * 60 * 1000,
  acquireTimeout  : 60 * 60 * 1000,
  timeout         : 60 * 60 * 1000,
  connectionLimit: 50,
}

//let con = mysql.createConnection(config)

const pool = mysql.createPool(config)


const getConnection = (callback) => {
  pool.getConnection((err, con) => {
    if (!err){
      callback(con)
      con.release()
    }
  })
}
/*
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
*/
/*
function handleDisconnect() {
  con = mysql.createConnection(config); // Recreate the connection, since
                                                  // the old one cannot be reused.

  con.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  con.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

handleDisconnect();
*/

module.exports = getConnection
