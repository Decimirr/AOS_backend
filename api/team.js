const express = require("express");
const router = express.Router();
const getConnection = require('../database')
const util = require('../util')
const {successFalse} = require("../util");
const session = require("../session");


router.get('/:id', (req, res) => {
    getConnection(con => {
        const sql = `SELECT * FROM team WHERE _id = ${req.params.id}`
        const query_param = []
        console.log(`GET team data ${ req.params.id }`)
        con.query(sql, query_param, function(err, result, fields){
            con.release()
            if (err || !result) return res.json(util.successFalse(err));
            res.json(util.successTrue(result))
        })
    })

})

router.get('/by-passcode/:passcode', (req, res) => {
    getConnection(con => {
        const sql = 'SELECT * FROM team WHERE passcode=?'
        const query_param = [req.params.passcode]
        con.query(sql, query_param, (err, result) => {
            con.release()
            if (err) return res.json(util.successFalse(err))
            else if (!result[0]) return res.json(util.successFalse("TeamNotExist", "팀이 존재하지 않습니다"))
            else {
                result[0].session_id = session.createSession(result[0]._id)
                res.json(util.successTrue(result[0]))
            }
        })
    })

})

router.get('/by-training/:id', (req, res) => {
    getConnection(con => {
        const sql = `SELECT * FROM team WHERE training_id = ${req.params.id}`
        const query_param = []
        console.log(`GET team data ${ req.params.id }`)
        con.query(sql, query_param, function(err, result, fields){
            con.release()
            if (err || !result) return res.json(util.successFalse(err));
            res.json(util.successTrue(result))
        })
    })

})

router.post('/', (req, res) => {
    getConnection(con => {
        const sql = 'SELECT passcode FROM team'
        con.query(sql, (err, passcodes) => {
            if (err){
                console.log(err)
                successFalse(err)
            }
            else{
                let new_passcode = ''
                while (true) {
                    const min = 0;
                    const max = 35 * 35 * 35 * 35 * 35;
                    let num = Math.floor(Math.random() * (max - min)) + min;
                    new_passcode = ''
                    for (let i = 0; i < 5; i++) {
                        new_passcode += util.toCharHelper(num % 35)
                        num = Math.floor(num / 35)
                    }
                    if (!(new_passcode in passcodes))
                        break
                }
                const sql = `INSERT INTO team SET ?`
                const query_param = {
                    training_id: req.body.training_id,
                    team_name: req.body.team_name,
                    passcode: new_passcode,
                }
                con.query(sql, query_param, function (err, result) {
                    con.release()
                    if (err || !result) return res.json(util.successFalse(err));
                    return res.json(util.successTrue(result))
                })
            }
        })
    })

})
router.put('/:id', (req, res) => {
    getConnection(con => {
        for (let key in req.body){
            const sql = `UPDATE team SET ${key}=? WHERE _id=?`
            const query_param = [req.body[key], req.params.id]
            con.query(sql, query_param, function (err, result, fields){
                if (err || !result) return res.json(util.successFalse(err));
                else res.json(util.successTrue(result))
            })
        }
        con.release()
    })

})
router.delete('/:id', (req, res) => {
    getConnection(con => {
        const sql = `DELETE FROM team WHERE _id = ${req.params.id}`
        const query_param = []
        console.log('DELETE team')
        con.query(sql, query_param, function (err, result, fields){
            con.release()
            if (err || !result) return res.json(util.successFalse(err));
            res.json(util.successTrue(result))
        })
    })

})


router.get('/session/:session_id', (req, res) => {
    try{
        session.isValidSession(req.params.session_id)
        res.json(util.successTrue(null))
    } catch (err){
        res.json(util.successFalse("SessionErr", err))
    }
})

module.exports = router