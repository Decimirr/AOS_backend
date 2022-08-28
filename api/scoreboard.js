const express = require("express");
const router = express.Router();
const multer = require('multer');
const upload = multer({
    dest: 'uploads/'
});
const uploads = require('../uploads')
const getConnection = require('../database')
const util = require('../util')
const {successFalse} = require("../util");
const {query} = require("express");
const fs = require("fs");


router.get('/by-training/:training_id', (req, res) => {
    getConnection(con => {
        const sql = "SELECT scoreboard.*, A.is_manned FROM (SELECT * FROM mission WHERE training_id=?) A INNER JOIN scoreboard ON A._id=mission_id;"
        const query_param = [req.params.training_id]
        con.query(sql, query_param, (err, result) => {
            if (err) res.json(util.successFalse(err))
            else res.json(util.successTrue(result))
            con.release()
        })
    })

})
router.get('/by-mission/:mission_id', (req, res) => {
    getConnection(con => {
        const sql = "SELECT scoreboard.* FROM (SELECT * FROM mission WHERE _id=?) A INNER JOIN scoreboard ON A._id=mission_id;"
        const query_param = [req.params.mission_id]
        con.query(sql, query_param, (err, result) => {
            if (err) {console.log(err); res.json(util.successFalse(err)) }
            else res.json(util.successTrue(result))
            con.release()
        })
    })

})
router.get('/by-team/:team_id', (req, res) => {
    getConnection(con => {
        const sql = 'SELECT B.*, A.is_manned FROM (SELECT * FROM mission) A INNER JOIN (SELECT * FROM scoreboard WHERE team_id=?) B ON A._id=mission_id;'
        const query_param = [req.params.team_id]
        con.query(sql, query_param, (err, result) => {
            if (err) res.json(util.successFalse(err))
            else res.json(util.successTrue(result))
            con.release()
        })
    })

})
router.get('/one/:mission_id/:team_id', (req, res) => {
    getConnection(con => {
        const sql = "SELECT * FROM scoreboard WhERE mission_id=? and team_id=?"
        const query_param = [req.params.mission_id, req.params.team_id]
        con.query(sql, query_param, (err, result) => {
            if (err) res.json(util.successFalse(err))
            else res.json(util.successTrue(result[0]))
            con.release()
        })
    })

})

router.get('/total-score/:training_id', (req, res) => {
    console.log("GET totalscore")
    getConnection(con => {
        const sql = "SELECT B.team_id, SUM(B.score) as total_score FROM (SELECT * FROM mission WHERE training_id=?) A INNER JOIN (SELECT * FROM scoreboard WHERE status='correct') B ON A._id=B.mission_id GROUP BY team_id;"
        const query_param = [req.params.training_id]
        con.query(sql, query_param, (err, result) => {
            if (err) res.json(util.successFalse(err))
            else res.json(util.successTrue(result))
            con.release()
        })
    })

})
// for special purpose
router.get('/teams-cleared/:training_id', (req, res) => {
    console.log("GET scoreboard")
    getConnection(con => {
        const sql = "SELECT mission_id, COUNT(*) AS num, (SELECT COUNT(*) FROM team WHERE training_id=?) AS total FROM (scoreboard JOIN (SELECT * FROM mission WHERE training_id=?) t1 ON (scoreboard.mission_id = t1._id)) WHERE status='correct' GROUP BY mission_id;"
        const query_param = [req.params.training_id, req.params.training_id]
        con.query(sql, query_param, (err, result)=>{
            console.log(result)
            if (err) res.json(util.successFalse(err))
            else res.json(util.successTrue(result))
            con.release()
        })
    })

})

router.post('/submit', (req, res) => {
    getConnection(con => {
        const required_keys = ["mission_id", "team_id", "answer"]
        for (const key of required_keys){
            if (req.body[key] == null) {
                con.release()
                return res.json(util.successFalse("KeyNotExist", key + " is not exist"))
            }
        }

        const sql1 = "SELECT * FROM scoreboard WHERE mission_id=? and team_id=?"
        const param1 = [req.body.mission_id, req.body.team_id]
        con.query(sql1, param1, (err, result) => {
            if (err) { con.release(); console.log(err); return res.json(util.successFalse(err, "problem with fetching scoreboard")) }
            if (result[0]?.status === 'correct') { con.release(); return res.json(util.successTrue(err, "이미 정답처리된 미션입니다.")) }

            const scoreboard = result[0]

            if (scoreboard == null) {
                const sql2 = "INSERT INTO scoreboard SET ?"
                const param2 = {
                    mission_id: req.body.mission_id,
                    team_id: req.body.team_id,
                    score: 0,
                    status: "pending",
                    answer: req.body.answer,
                }
                con.query(sql2, param2, (err, result) => {
                    con.release()
                    if (err) { console.log(err); return res.json(util.successFalse(err, "problem with creating scoreboard"));}
                    return res.json(util.successTrue(param2))
                })
            }
            else{
                const sql3 = "UPDATE scoreboard SET ? WHERE mission_id=? and team_id=?"
                const param3 = [
                    { status: "pending", answer: req.body.answer },
                    req.body.mission_id,
                    req.body.team_id,
                ]
                con.query(sql3, param3, (err, result) => {
                    con.release()
                    if (err) return res.json(util.successFalse(err, "problem with updating scoreboard"))
                    return res.json(util.successTrue(null))
                })
            }

        })
    })
})

router.post('/submit/text', (req, res) => {
    getConnection(con => {
        const required_keys = ["mission_id", "team_id", "answer"]
        for (const key of required_keys){
            if (req.body[key] == null) {
                con.release()
                return res.json(util.successFalse("KeyNotExist", key + " is not exist"))
            }
        }

        const sql_mission = "SELECT * FROM mission WHERE _id=?"
        const mission_param = [req.body.mission_id]
        con.query(sql_mission, mission_param, (err, result) => {
            if (err || result.length === 0) {
                con.release()
                res.json(util.successFalse(err, "Mission not fount (FATAL!)"))
                return
            }
            const mission = result[0]
            const sql_scoreboard = "SELECT * FROM scoreboard WHERE mission_id=?, team_id=?"
            const scoreboard_param = [req.body.mission_id, req.body.team_id]
            con.query(sql_scoreboard, scoreboard_param, (err, result) => {
                if (result && result.length !== 0 && result[0].status === "correct") { // 이미 풀림
                    con.release()
                    return res.json(util.successFalse("Already solved", "problem is already solved"))
                }
                else{ // 안풀림
                    con.query("SELECT * FROM mission_text_answer WHERE mission_id=?", [mission._id], (err, result)=>{
                        if (err) return res.json(util.successFalse(orr, "MissionTextAnswer not fount (!FATAL)"))
                        const mission_text_answer = result[0]

                        if (mission_text_answer.answer !== req.body.answer){ // 오답
                            const sql_submit = "INSERT INTO scoreboard SET ? ON DUPLICATE KEY UPDATE submit_count=submit_count+1"
                            const submit_param = [{mission_id: mission._id, team_id: req.body.team_id, score: 0, status: "wrong"}]
                            con.query(sql_submit, submit_param, (err, result) => {
                                con.release()
                                if (err) {console.log(err); res.json(util.successFalse(err, "err while marking wrong in unmanned mission")); return; }
                                else { res.json(util.successTrue(result)); return; }
                            })
                        }
                        else { // 정답
                            const sql_submit = "INSERT INTO scoreboard SET ? ON DUPLICATE KEY UPDATE score=IF(? > ?-submit_count*?, ?, ?-submit_count*?), status='correct'"
                            const new_data = { mission_id: mission._id, team_id: req.body.team_id, score: mission_text_answer.base_score, status: "correct" }
                            const submit_param = [new_data, mission_text_answer.min_score, mission_text_answer.base_score, mission_text_answer.decr_score, mission_text_answer.min_score, mission_text_answer.base_score, mission_text_answer.decr_score]
                            con.query(sql_submit, submit_param, (err, result) => {
                                con.release()
                                if (err) { console.log(err); res.json(util.successFalse(err, "err while marking correct in unmanned mission")); return; }
                                else { res.json(util.successTrue(result)); return; }
                            })
                        }
                    })
                }
            })
        })
    })

})
/*
router.post("/submit/image", uploads.upload_blob.single("answer_image"), (req, res) => {
    getConnection(con => {
        if (req.file == null){
            con.release()
            return res.json(util.successFalse("No answer image provided", "No answer image provided"))
        }
        const required_keys = ["mission_id", "team_id"]
        for (const key of required_keys){
            if (req.body[key] == null) {
                con.release()
                return res.json(util.successFalse("KeyNotExist", key + " is not exist"))
            }
        }

        const sql1 = "INSERT INTO answer_pending SET ? ON DUPLICATE KEY UPDATE ?;"
        const sql2 = "INSERT INTO scoreboard SET ? ON DUPLICATE KEY UPDATE ?;"

        console.log(req.file.url.split("?")[0])
        const query_param = [
            {
                mission_id: req.body.mission_id,
                team_id: req.body.team_id,
                answer: req.file.url.split("?")[0],
            },
            { answer: req.file.url.split("?")[0] },
            {
                mission_id: req.body.mission_id,
                team_id: req.body.team_id,
                status: "pending",
            },
            { status: "pending" }
        ]
        con.query(sql1 + sql2, query_param, (err, result) => {
            con.release()
            if (err) {
                console.log(err)
                res.json(util.successFalse(err, "error while submitting image for answer"))
            }
            else res.json(util.successTrue(result))
        })
    })

})
*/

router.post('/check', (req, res) => {
    getConnection(con => {
        const sql_check = "INSERT INTO scoreboard SET ? ON DUPLICATE KEY UPDATE ?"
        const new_data = {
            mission_id: req.body.mission_id,
            team_id: req.body.team_id,
            score: req.body.score,
            status: req.body.status,
        }
        const update_data = {
            score: req.body.score,
            status: req.body.status,
        }
        const query_param = [ new_data, update_data ]
        con.query(sql_check, query_param, (err, result) => {
            con.release()
            if (err) { console.log(err); res.json(util.successFalse(err, "err while checking")); return; }
            else { res.json(util.successTrue(result)); return; }
        })
    })

})
/*
router.get("/answer-pending/:mission_id/:team_id", (req, res) => {
    getConnection(con => {
        const sql = "SELECT * FROM answer_pending WHERE mission_id=? and team_id=?"
        const query_param = [req.params.mission_id, req.params.team_id]
        con.query(sql, query_param, (err, result) => {
            con.release()
            if (err || result.length===0){
                console.log(err)
                res.json(util.successFalse(err, "error getting answer-pending"))
            }
            else{
                res.json(util.successTrue(result[0]))
            }
        })
    })

})
*/
router.delete("/:mission_id/:team_id", (req, res) => {
    getConnection(con => {
        const sql = "DELETE FROM scoreboard WHERE mission_id=? and team_id=?"
        const query_param = [req.params.mission_id, req.params.team_id]
        con.query(sql, query_param, (err, result) => {
            con.release()
            if (err) { console.log(err); res.json(util.successFalse(err)); }
            else res.json(util.successTrue(result))
        })
    })

})




module.exports = router