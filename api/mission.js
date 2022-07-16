const express = require("express");
const router = express.Router();
const con = require('../database')
const util = require("../util");
const uploads = require('../uploads')
const {successTrue} = require("../util");
const fs = require("fs");



router.get('/:id', (req, res) => {
    const sql = 'SELECT * FROM mission WHERE _id = ?'
    const query_param = [req.params.id]

    con.query(sql, query_param, function (err, result) {
        if (err || !result) res.json(util.successFalse(err));
        else res.json(util.successTrue(result[0]))
    })
})
router.get('/by-training/:training_id', (req, res) => {
    const sql = 'SELECT * FROM mission WHERE training_id = ?'
    const query_param = [req.params.training_id]

    con.query(sql, query_param, function (err, result, fields) {
        if (err || !result) res.json(util.successFalse(err));
        else {
            res.json(util.successTrue(result))
        }
    })
})
router.post('/:id', (req, res) => {
    const required_keys = ["mission_name", "is_manned", "answer_type", "prerequisites"]
    const allowed_keys = ["problem", ]
    const query_param = {}
    for (const key of required_keys){
        if (req.body[key] == null)
            return res.json(util.successFalse("KeyNotExist", key + " is not exist"))
        else
            query_param[key] = req.body[key]
    }
    for (const key of allowed_keys){
        query_param[key] = req.body[key]
    }
    query_param["training_id"] = req.params.id
    const sql = "INSERT INTO mission SET position=(SELECT IFNULL(MAX(position) + 1, 1) FROM mission b), ?"
    con.query(sql, query_param, (err, result, field) => {
        if (err) res.json(util.successFalse(err, "err with post mission"))
        else res.json(util.successTrue({_id: result.insertId}))
    })
})
router.put('/:id', (req, res) => {
    const allowed_keys = ["mission_name", "is_manned", "problem", "answer_type", "prerequisites", "position"]
    const errs = []
    for (const key in req.body){
        if (allowed_keys.includes(key)){
            const sql = `UPDATE mission SET ${key}=? WHERE _id=?`
            const query_param = [req.body[key], req.params.id]
            con.query(sql, query_param, function (err, result, fields){
                if (err || !result) {
                    console.log(err)
                    errs.push(err)
                }
            })
        }
    }
    if (errs.length !== 0)
        return res.json(util.successFalse(errs))
    else
        return res.json(util.successTrue({}))
})
router.delete('/:id', (req, res) => {
    const sql = `DELETE FROM mission WHERE _id = ${req.params.id}`
    const query_param = []
    console.log('DELETE training')
    con.query(sql, query_param, function (err, result, fields){
        if (err || !result) res.json(util.successFalse(err));
        else res.json(util.successTrue(result))
    })
})


router.get('/text-answer/:id', (req, res) => {
    const sql = "SELECT * FROM mission_text_answer WHERE mission_id=?"
    const query_param = [req.params.id]

    con.query(sql, query_param, (err, result) => {
        if (err) res.json(util.successFalse(err));
        else res.json(util.successTrue(result[0]))
    })
})
router.post("/text-answer/:id", (req, res) => {
    const required_keys = ["answer", "base_score", "decr_score", "min_score"]
    const query_param = {}
    for (const key of required_keys){
        if (req.body[key] == null)
            return res.json(util.successFalse("KeyNotExist", key + " is not exist"))
        else
            query_param[key] = req.body[key]
    }
    query_param["mission_id"] = req.params.id
    const sql = "INSERT INTO mission_text_answer SET ?"
    console.log(query_param)
    con.query(sql, query_param, (err, result) => {
        if (err) res.json(util.successFalse(err, "err with post mission_text_answer"))
        else res.json(util.successTrue(result[0]))
    })
})
router.put('/text-answer/:id', (req, res) => {
    const allowed_keys = ["answer", "base_score", "decr_score", "min_score"]
    const errs = []
    for (const key in req.body){
        if (allowed_keys.includes(key)){
            const sql = `UPDATE mission_text_answer SET ${key}=? WHERE mission_id=?`
            const query_param = [req.body[key], req.params.id]
            con.query(sql, query_param, function (err, result, fields){
                if (err || !result) {
                    console.log(err)
                    errs.push(err)
                }
            })
        }
    }
    if (errs.length !== 0)
        return res.json(util.successFalse(errs))
    else
        res.json(util.successTrue({}))
})


router.get('/gps-answer/:id', (req, res) => {
    const sql = "SELECT * FROM mission_gps_answer WHERE mission_id=?"
    const query_param = [req.params.id]

    con.query(sql, query_param, (err, result) => {
        if (err) res.json(util.successFalse(err));
        else res.json(util.successTrue(result[0]))
    })
})
router.post("/gps-answer/:id", (req, res) => {
    const required_keys = ["lat", "lng", "base_score"]
    const query_param = {}
    for (const key of required_keys){
        if (req.body[key] == null)
            return res.json(util.successFalse("KeyNotExist", key + " is not exist"))
        else
            query_param[key] = req.body[key]
    }
    query_param["mission_id"] = req.params.id
    const sql = "INSERT INTO mission_gps_answer SET ?"
    console.log(query_param)
    con.query(sql, query_param, (err, result) => {
        if (err) res.json(util.successFalse(err, "err with post mission_gps_answer"))
        else res.json(util.successTrue(result[0]))
    })
})
router.put('/gps-answer/:id', (req, res) => {
    const allowed_keys = ["lat", "lng", "base_score"]
    const errs = []
    for (const key in req.body){
        if (allowed_keys.includes(key)){
            const sql = `UPDATE mission_gps_answer SET ${key}=? WHERE mission_id=?`
            const query_param = [req.body[key], req.params.id]
            con.query(sql, query_param, function (err, result, fields){
                if (err || !result) {
                    console.log(err)
                    errs.push(err)
                }
            })
        }
    }
    if (errs.length !== 0)
        return res.json(util.successFalse(errs))
    else
        res.json(util.successTrue({}))
})



router.get('/problem-image/:id', (req, res) => {
    const sql = `SELECT image FROM mission_problem_image WHERE mission_id=?`
    const query_param = [req.params.id]
    con.query(sql, query_param, (err, result) =>  {
        console.log(err)
        console.log(result)
        if (!result[0]){
            res.json(util.successFalse("no file"))
        }
        else {
            res.json(util.successTrue(result[0]))
        }
    })
})
router.post("/problem-image/:id", uploads.upload_blob.single("problem_image"), (req, res) => {
    if (req.file == null)
        return res.json(util.successFalse("No problem image provided", "No problem image provided"))
    const sql = "INSERT INTO mission_problem_image SET ? ON DUPLICATE KEY UPDATE ?"
    const query_param = [ { mission_id: req.params.id, image: req.file.url.split("?")[0] },  { image: req.file.url.split("?")[0] } ]
    con.query(sql, query_param, (err, result) => {
        if (err) {
            console.log(err)
            res.json(util.successFalse(err, "err with upload problem image"))
        }
        else res.json(util.successTrue(result[0]))
    })
})

router.get("/location/:id", (req, res) => {
    const sql = "SELECT * FROM mission_location WHERE mission_id=?"
    const query_param = [req.params.id]
    con.query(sql, query_param, (err, result) => {
        if (err) {
            console.log(err)
            res.json(util.successFalse(err, "err with getting location"))
        }
        else res.json(util.successTrue(result[0]))
    })
})
router.post("/location/:id", (req, res) => {
    const required_keys = ["lat", "lng"]
    const query_param = {}
    for (const key of required_keys){
        if (req.body[key] == null)
            return res.json(util.successFalse("KeyNotExist", key + " is not exist"))
        else
            query_param[key] = req.body[key]
    }
    query_param["mission_id"] = req.params.id
    const sql = "INSERT INTO mission_location SET ?"
    console.log(query_param)
    con.query(sql, query_param, (err, result) => {
        if (err) res.json(util.successFalse(err, "err with post mission_location"))
        else res.json(util.successTrue(result[0]))
    })
})
router.put('/location/:id', (req, res) => {
    const allowed_keys = ["lat", "lng"]
    const errs = []
    for (const key in req.body){
        if (allowed_keys.includes(key)){
            const sql = `UPDATE mission_location SET ${key}=? WHERE mission_id=?`
            const query_param = [req.body[key], req.params.id]
            con.query(sql, query_param, function (err, result, fields){
                if (err || !result) {
                    console.log(err)
                    errs.push(err)
                }
            })
        }
    }
    if (errs.length !== 0)
        return res.json(util.successFalse(errs))
    else
        res.json(util.successTrue({}))
})

module.exports = router