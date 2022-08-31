const express = require("express");
const router = express.Router();
const util = require('../util')
const getConnecion = require("../database");

router.post("/", (req, res) => {
  getConnecion(con => {
    const required_keys = ["paramName"]
    for (const key of required_keys){
      if (req.body[key] == null){
        
        return res.json(util.successFalse("KeyNotExist", key + " is not exist"))
      }
    }

    const sql = `SELECT * FROM params WHERE paramName=?`
    const query_param = [req.body["paramName"]]
    con.query(sql, query_param, (err, result) => {
      
      if (err) res.json(util.successFalse(err, "err with get params"))
      else res.json(util.successTrue(result[0].paramValue))
    })
  })

})

router.put('/', (req, res) => {
  getConnecion(con => {
    const required_keys = ["paramName", "paramValue"]
    for (const key of required_keys){
      if (req.body[key] == null){
        
        return res.json(util.successFalse("KeyNotExist", key + " is not exist"))
      }
    }

    const sql = `UPDATE params SET paramValue=? WHERE paramName=?`
    const query_param = [ req.body["paramValue"], req.body["paramName"] ]
    con.query(sql, query_param, (err, result) => {
      
      if (err) res.json(util.successFalse(err, "err with post params"))
      else res.json(util.successTrue())
    })
  })

})


module.exports = router