const express = require("express");
const router = express.Router();
const getConnection = require('../database')
const util = require('../util')
const session = require('../session')


router.get("/marker/:training_id", (req, res) => {
  getConnection(con => {
    const sql = "SELECT * FROM marker WHERE training_id=?"
    const query_param = [req.params.training_id]
    con.query(sql, query_param, (err, result) => {
      
      if (err) { console.log(err); return res.json(util.successFalse(err)) }
      else if (result.length === 0) return res.json(util.successTrue({training_id: req.params.training_id, markers: JSON.stringify([])}))
      else return res.json(util.successTrue(result[0]))
    })
  })

})
router.post("/marker/:training_id", (req, res) => {
  getConnection(con => {
    const allowed_keys = ["markers"]
    const update_data = {}
    for (const key of allowed_keys){
      if (req.body[key] == null) {
        
        return res.json(util.successFalse("KeyNotExist", key + " is not exist"))
      }
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

})



router.get("/location-control/:training_id", (req, res)=>{
  getConnection(con => {
    const sql = "SELECT * FROM team WHERE training_id=?;"
    const query_param = [req.params.training_id]
    con.query(sql, query_param, (err, result, field) => {
      if (err) { console.log(err); ; return res.json(util.successFalse(err)) }
      else{
        const locations = session.getLocation(result)
        
        return res.json(util.successTrue(locations))
      }
    })
  })

})
router.post("/location-control/:session_id", (req, res) => {
  const lat = req.body.lat
  const lng = req.body.lng
  if (lat == null || lng == null)
    return res.json(util.successFalse("KeyNotExist", "lat or lng is not provided"))

  session.setLocation(req.params.session_id, lat, lng)
  res.json(util.successTrue(null))

})

module.exports = router