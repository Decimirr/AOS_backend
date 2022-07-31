const express = require("express");
const router = express.Router();
const util = require('../util')
const getConnection = require("../database");

router.post('/:training_id', (req, res) => {
  getConnection(con => {
    const required_keys = ["sender", "team_id", "content"]
    const query_param = {}
    for (const key of required_keys){
      if (req.body[key] == null) {
        con.release()
        return res.json(util.successFalse("KeyNotExist", key + " is not exist"))
      }
      else
        query_param[key] = req.body[key]
    }
    query_param["training_id"] = req.params.training_id
    const sql = "INSERT INTO chat SET ?"
    console.log(query_param)
    con.query(sql, query_param, (err, result) => {
      if (err) {
        console.log(err)
        res.json(util.successFalse(err, "err with posting chat"))
      }
      else res.json(util.successTrue(result[0]))
    })
    con.release()
  })

})
router.get('/:training_id', (req, res) => {
  getConnection(con => {
    const sql = "SELECT * FROM chat WHERE training_id=?"
    const query_param = [req.params.training_id]
    con.query(sql, query_param, (err, result) => {
      if (err) res.json(util.successFalse(err, "err with getting chat"))
      else res.json(util.successTrue(result))
    })
    con.release()
  })

})
router.delete('/:id', (req, res) => {
  getConnection(con => {
    const sql = "DELETE FROM chat WHERE id=?"
    const query_param = [req.params.id]
    con.query(sql, query_param, (err, result) => {
      if (err) res.json(util.successFalse(err, "err with deleting chat"))
      else res.json(util.successTrue())
    })
    con.release()
  })

})

module.exports = router