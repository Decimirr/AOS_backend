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

const current_locations = {}

router.get("/location-control/:training_id", (req, res)=>{
  const sql = "SELECT _id, team_name FROM team WHERE training_id=?;"
  const query_param = [req.params.training_id]
  con.query(sql, query_param, (err, result) => {
    if (err) { console.log(err); return res.json(util.successFalse(err)) }
    else{
      locations = []
      result.forEach((team, i) => {
        if (current_locations[team._id] != null){
          locations.push({team_id: team._id, team_name: team.team_name, index: i, lat: current_locations[team._id].lat, lng: current_locations[team._id].lng})
        }
      })
      return res.json(util.successTrue(locations))
    }
  })
})
router.post("/location-control/:team_id", (req, res) => {
  const lat = req.body.lat
  const lng = req.body.lng
  if (lat == null || lng == null)
    return res.json(util.successFalse("KeyNotExist", "lat or lng is not provided"))

  current_locations[req.params.team_id] = {lat: lat, lng: lng}
  console.log(current_locations)
  res.json(util.successTrue(null))
})

module.exports = router