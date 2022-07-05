const express = require("express");
const router = express.Router();
const con = require('../database')
const util = require("../util");
const uploads = require("../uploads")
const fs = require("fs");

router.get('/', (req, res) => {
    const sql = 'SELECT * FROM training'
    con.query(sql, function (err, result, fields) {
        if (err || !result) return res.json(util.successFalse(err));
        res.json(util.successTrue(result))
    })
})

router.get('/by-code/:code', (req, res) => {
    const sql = "SELECT * FROM training WHERE company_code=?"
    const query_param = [req.params.code]
    con.query(sql, query_param, (err, result) => {
        if (err || result.length === 0) return res.json(util.successFalse(err))
        else return res.json(util.successTrue(result[0]))
    })
})

router.get('/:id', (req, res) => {
    const sql = `SELECT * FROM training WHERE _id = ${req.params.id}`
    const query_param = []
    con.query(sql, query_param, function(err, result, fields){
        if (err || !result) return res.json(util.successFalse(err));
        res.json(util.successTrue(result[0]))
    })
})

router.post('/', (req, res) => {
    const sql = 'INSERT INTO training (order_code, company_code, company_name, training_name, summary, tips) VALUES ( ?, ?, ?, ?, ?, ? )'
    const query_param = [req.body.order_code, req.body.company_code, req.body.company_name, req.body.training_name, req.body.summary, req.body.tips]
    console.log(query_param)
    con.query(sql, query_param, function (err, result, fields) {
        if (err || !result) return res.json(util.successFalse(err));
        res.json(util.successTrue(result))
    })
})
router.put('/:id', (req, res) => {
    const allowed_keys = ["order_code", "company_code", "company_name", "training_name", "summary", "tips", "start_time", "end_time", "theme"]
    const time_keys = ["start_time", "end_time"]
    const errs = []
    for (let key in req.body){
        if (time_keys.includes(key) && req.body[key]){
            const time = new Date(req.body[key])
            const year = pad(time.getFullYear(), 4)
            const month = pad(time.getMonth()+1, 2)
            const day = pad(time.getDate(), 2)
            const hours = pad(time.getHours(), 2)
            const minutes = pad(time.getMinutes(), 2)
            const seconds = pad(time.getSeconds(), 2)
            req.body[key] = year+month+day+hours+minutes+seconds
        }
    }
    for (let key in req.body){
        if (allowed_keys.includes(key)){
            const sql = `UPDATE training SET ${key}=? WHERE _id=?`
            const query_param = [req.body[key], req.params.id]
            con.query(sql, query_param, function (err, result){
                if (err){
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
    const sql = `DELETE FROM training WHERE _id = ${req.params.id}`
    const query_param = []
    console.log('DELETE training')
    con.query(sql, query_param, function (err, result, fields){
        if (err || !result)
            res.json(util.successFalse(err));
        else res.json(util.successTrue(result))
    })
})
/*

 */
router.get("/manual-map/:id", (req, res) => {
    const sql = "SELECT * FROM manual_map WHERE training_id=?"
    const query_param = [req.params.id]
    con.query(sql, query_param, (err, result) => {
        if (err) { console.log(err); res.json(util.successFalse(err)); }
        else { res.json(util.successTrue(result)) }
    })
})
router.post("/manual-map/:id", uploads.upload_blob.single("manual_map_image"), (req, res) => {
    if (req.file == null)
        return res.json(util.successFalse("No problem image provided", "No problem image provided"))
    const sql = "INSERT INTO manual_map SET ?"
    const query_param = {
        training_id: req.params.id,
        map_image: req.file.url.split("?")[0]
    }
    console.log(req.file.url)
    con.query(sql, query_param, (err, result) => {
        if (err) { console.log(err); res.json(util.successFalse(err, "err with upload problem image")) }
        else res.json(util.successTrue(result[0]))
    })
})
router.delete("/manual-map/:id", (req, res) => {
    const sql = "DELETE FROM manual_map WHERE _id=?"
    const query_param = [req.params.id]
    con.query(sql, query_param, (err, result) => {
        if (err) { console.log(err); res.json(util.successFalse(err, "err with delete problem image")) }
        else res.json(util.successTrue(result))
    })
})

const pad = function (num, size) {
    const s = "000000000" + num;
    return s.substr(s.length-size);
}

module.exports = router