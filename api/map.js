const express = require("express");
const router = express.Router();
const con = require('../database')
const util = require('../util')


router.get("/marker/:training_id", (req, res) => {
  const sql = "SELECT * FROM marker WHERE training_id=?"
  const query_param = [req.params.training_id]
  con.query(sql, query_param, (err, result) => {
    if (err) { console.log(err); return res.json(util.successFalse(err)) }
    else if (result.length === 0) return res.json(util.successTrue({training_id: req.params.training_id, markers: JSON.stringify([])}))
    else return res.json(util.successTrue(result[0]))
  })
})
router.post("/marker/:training_id", (req, res) => {
  const allowed_keys = ["markers"]
  const update_data = {}
  for (const key of allowed_keys){
    if (req.body[key] == null)
      return res.json(util.successFalse("KeyNotExist", key + " is not exist"))
    else
      update_data[key] = req.body[key]
  }
  const new_data = {training_id: req.params.training_id}
  Object.assign(new_data, update_data)

  const sql = "INSERT INTO marker SET ? ON DUPLICATE KEY UPDATE ?"
  const query_param = [ new_data,  update_data ]
  con.query(sql, query_param, (err, result) => {
    if (err) { console.log(err); return res.json(util.successFalse(err)) }
    else return res.json(util.successTrue())
  })
})

module.exports = router