const express = require("express");
const router = express.Router();
const getConnection = require('../database')
const util = require("../util");
const uploads = require('../uploads')


router.get('/:id', (req, res) => {
    getConnection(con => {
        const sql = 'SELECT * FROM mission WHERE _id = ?'
        const query_param = [req.params.id]

        con.query(sql, query_param, function (err, result) {
            con.release()
            if (err || !result) res.json(util.successFalse(err));
            else res.json(util.successTrue(result[0]))
        })
    })

})
router.get('/by-training/:training_id', (req, res) => {
    getConnection(con => {
        const sql = 'SELECT * FROM mission WHERE training_id = ?'
        const query_param = [req.params.training_id]

        con.query(sql, query_param, function (err, result, fields) {
            con.release()
            if (err || !result) res.json(util.successFalse(err));
            else {
                res.json(util.successTrue(result))
            }
        })
    })

})
router.post('/:id', (req, res) => {
    getConnection(con => {
        const required_keys = ["mission_name", "is_manned", "content", "prerequisites"]
        const query_param = {}
        for (const key of required_keys){
            if (req.body[key] == null){
                con.release()
                return res.json(util.successFalse("KeyNotExist", key + " is not exist"))
            }
            else
                query_param[key] = req.body[key]
        }
        query_param["training_id"] = req.params.id

        const sql = "INSERT INTO mission SET position=(SELECT IFNULL(MAX(position) + 1, 1) FROM mission b), ?"
        con.query(sql, query_param, (err, result, field) => {
            con.release()
            if (err) {
                console.log(err)
                res.json(util.successFalse(err, "err with post mission"))
            }
            else res.json(util.successTrue({_id: result.insertId}))
        })
    })

})
router.put('/:id', (req, res) => {
    getConnection(con => {
        const allowed_keys = ["mission_name", "is_manned", "prerequisites", "position", "content"]
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
            res.json(util.successFalse(errs))
        else
            res.json(util.successTrue({}))
        con.release()
    })

})
router.delete('/:id', (req, res) => {
    getConnection(con => {
        const sql = `DELETE FROM mission WHERE _id = ${req.params.id}`
        const query_param = []
        console.log('DELETE training')
        con.query(sql, query_param, function (err, result, fields){
            if (err || !result) res.json(util.successFalse(err));
            else res.json(util.successTrue(result))
            con.release()
        })
    })

})


router.get('/prerequisites/:team_id', (req, res) => {
    const team_id = req.params.team_id
    const pre_status = {}

    getConnection(con => {
        con.query("SELECT training_id FROM team WHERE _id=?", [team_id], (err, result) => {
            if (err || !result[0]) {con.release(); return res.json(util.successFalse(err)) }
            const training_id = result[0].training_id

            con.query("SELECT A._id, mission_name, status FROM (SELECT * FROM mission WHERE training_id=?) A LEFT OUTER JOIN (SELECT * FROM scoreboard WHERE team_id=? and status='correct') B ON A._id=B.mission_id;", [training_id, team_id], (err, result) => {
                if (err) {con.release(); return res.json(util.successFalse(err)) }

                const mission_personal = {}
                for (const item of result){
                    mission_personal[item._id] = { mission_name: item.mission_name, is_correct: item.status==='correct' }
                }

                con.query("SELECT _id AS mission_id, prerequisites FROM mission WHERE training_id=?;", [training_id], (err, result) => {
                    if (err) {con.release(); return res.json(util.successFalse(err)) }

                    const pre = {}
                    for (const item of result){
                        pre[item.mission_id] = JSON.parse(item.prerequisites)
                        console.log(pre)
                        pre_status[item.mission_id] = pre[item.mission_id].mission.every((id) => mission_personal[id] == null || mission_personal[id].is_correct )
                        pre_status[item.mission_id] &&= ( pre[item.mission_id].start_time == null || new Date(pre[item.mission_id].start_time) < new Date() )
                        pre_status[item.mission_id] &&= ( pre[item.mission_id].end_time == null || new Date(pre[item.mission_id].end_time) > new Date() )
                    }
                    console.log('pre_status', pre_status)
                    con.release();
                    return res.json(util.successTrue(pre_status))
                })
            })
        })
    })
})
router.get("/timer/:team_id", (req, res) => {
    const team_id = req.params.team_id

    getConnection(con => {
        con.query("SELECT training_id FROM team WHERE _id=?", [team_id], (err, result) => {
            if (err || !result[0]) {
                con.release();
                return res.json(util.successFalse(err))
            }
            const training_id = result[0].training_id

            con.query("SELECT _id, prerequisites FROM mission WHERE training_id=?", [training_id], (err, result) => {
                if (err) { con.release(); return res.json(util.successFalse(err)) }
                const pre_timer = {}
                for (const item of result){
                    pre_timer[item._id] = JSON.parse(item.prerequisites).timer
                }

                con.query("SELECT * FROM started_time WHERE team_id=?", [team_id], (err, result) => {
                    const started_time = {}
                    for (const item of result) {
                        started_time[item.mission_id] = new Date(item.time).setHours(item.time.getHours()+9)
                    }

                    const result_data = {}
                    console.log(pre_timer)
                    for (const mission_id in pre_timer){
                        if (pre_timer[mission_id] == null || pre_timer[mission_id] === 0)
                            result_data[mission_id] = null
                        else if (started_time[mission_id] == null)
                            result_data[mission_id] = { started: false }
                        else{
                            console.log(new Date())
                            console.log(new Date(started_time[mission_id]))
                            console.log(new Date().getTime() - new Date(started_time[mission_id]).getTime())

                            result_data[mission_id] = { started: true, remaining: (started_time[mission_id] + pre_timer[mission_id] * 1000 - new Date().getTime()) / 1000 }
                        }

                    }

                    return res.json(util.successTrue(result_data))
                })
            })
        })
    })
})
router.post('/start-timer/:mission_id/:team_id', (req, res) => {
    const team_id = req.params.team_id
    const mission_id = req.params.mission_id
    getConnection(con => {
        con.query("INSERT INTO started_time SET ?", { team_id: team_id, mission_id: mission_id }, (err, result) => {
            console.log('start-timer', err)
            if (err) { console.log(err); return res.json(util.successFalse(err))}
            return res.json(util.successTrue(null))
        })
    })
})

module.exports = router