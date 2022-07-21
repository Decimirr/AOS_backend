const express = require("express");
const router = express.Router();
const util = require('../util')
const con = require("../database");

router.post('/:training_id', (req, res) => {
  const required_keys = ["sender", "team_id", "content"]
  const query_param = {}
  for (const key of required_keys){
    if (req.body[key] == null)
      return res.json(util.successFalse("KeyNotExist", key + " is not exist"))
    else
      query_param[key] = req.body[key]
  }
  query_param["training_id"] = req.params.training_id
  const sql = "INSERT INTO chat SET ?"
  console.log(query_param)
  con.query(sql, query_param, (err, result) => {
    if (err) res.json(util.successFalse(err, "err with get chat"))
    else res.json(util.successTrue(result[0]))
  })
})
router.get('/:training_id', (req, res) => {
  const sql = "SELECT * FROM chat WHERE training_id=?"
  const query_param = [req.params.training_id]
  con.query(sql, query_param, (err, result) => {
    if (err) res.json(util.successFalse(err, "err with get chat"))
    else res.json(util.successTrue(result))
  })
})
router.delete('/:id', (req, res) => {
  const sql = "DELETE FROM chat WHERE id=?"
  const query_param = [req.params.id]
  con.query(sql, query_param, (err, result) => {
    if (err) res.json(util.successFalse(err, "err with getting chat"))
    else res.json(util.successTrue())
  })
})

module.exports = router