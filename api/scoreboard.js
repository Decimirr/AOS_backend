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
            
        })
    })

})
router.get('/one/:mission_id/:team_id', (req, res) => {
    getConnection(con => {
        const sql = "SELECT * FROM scoreboard WhERE mission_id=? and team_id=?"
        const query_param = [req.params.mission_id, req.params.team_id]
        con.query(sql, query_param, (err, result) => {
            if (err) return res.json(util.successFalse(err))
            else if (result[0] == null) return res.json(util.successTrue({
                mission_id: req.params.mission_id,
                team_id: req.params.team_id,
                score: 0,
                answer: {},
                status: "",
            }))
            else res.json(util.successTrue(result[0]))
            
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
            
        })
    })

})

router.post('/submit', (req, res) => {
    getConnection(con => {
        const required_keys = ["mission_id", "team_id", "answer"]
        for (const key of required_keys){
            if (req.body[key] == null) {
                return res.json(util.successFalse("KeyNotExist", key + " is not exist"))
            }
        }

        const sql1 = "SELECT * FROM scoreboard WHERE mission_id=? and team_id=?"
        const param1 = [req.body.mission_id, req.body.team_id]
        con.query(sql1, param1, (err, result) => {
            if (err) { ; console.log(err); return res.json(util.successFalse(err, "problem with fetching scoreboard")) }
            if (result[0]?.status === 'correct') { ; return res.json(util.successTrue(err, "이미 정답처리된 미션입니다.")) }

            const scoreboard = result[0]

            const sql2 = "INSERT INTO scoreboard SET ? ON DUPLICATE KEY UPDATE ?"
            const param2 = [
                {
                    mission_id: req.body.mission_id,
                    team_id: req.body.team_id,
                    score: 0,
                    status: "pending",
                    answer: req.body.answer,
                },
                {
                    score: 0,
                    status: "pending",
                    answer: req.body.answer,
                }
            ]
            con.query(sql2, param2, (err, result) => {

                if (err) { console.log(err); return res.json(util.successFalse(err, "problem with creating scoreboard"));}
                return res.json(util.successTrue(param2))
            })

        })
    })
})

router.post('/submit/auto', (req, res) => {
    const required_keys = ["mission_id", "team_id", "title", "answer"]
    for (const key of required_keys){
        if (req.body[key] == null) {
            return res.json(util.successFalse("KeyNotExist", key + " is not exist"))
        }
    }
    const mission_id = req.body.mission_id
    const team_id = req.body.team_id
    const answer = req.body.answer
    const title = req.body.title
    console.log(mission_id, team_id, answer, title)

    getConnection(con => {
        con.query("SELECT content, prerequisites FROM mission WHERE _id=?", mission_id, (err, result) => {
            if (err || !result) return res.json(util.successFalse(err, "본부에 문의하세요. Err mission not found"))
            console.log(result[0])
            const mission = result[0]
            const content = JSON.parse(mission.content)
            const prerequisites = JSON.parse(mission.prerequisites)
            const submit = content.submit
            const auto_manager = submit.filter(e => e.block_type === 'auto')[0]
            if (auto_manager == null) return res.json(util.successFalse(err, "본부에 문의하세요. Err auto manager block not found"))
            const auto_submits = submit.filter(e => e.auto === true)
            const auto_titles = []
            console.log("content", content)
            console.log("auto_manager", auto_manager)
            console.log("deduction", auto_manager.deduction)

            for(const auto_submit of auto_submits){
                console.log("auto_submit", auto_submit)
                auto_titles.push(auto_submit.title)
            }
            console.log("auto_titles", auto_titles)
            const auto_target = auto_submits.find(e => e.title === title)
            if (auto_target == null) return res.json(util.successFalse(err, "본부에 문의하세요. Err submit block not found"))

            con.query("SELECT * FROM scoreboard WHERE mission_id=? and team_id=?", [mission_id, team_id], (err, result) => {
                console.log(result[0])
                if (err) return res.json(util.successFalse(err, "본부에 문의하세요. Err scoreboard not found"))
                const scoreboard_data = {}
                if (result[0] == null){
                    scoreboard_data.score = 0
                    scoreboard_data.status = ""
                    scoreboard_data.answer = {}
                }
                else{
                    scoreboard_data.score = result[0].score
                    scoreboard_data.status = result[0].status
                    scoreboard_data.answer = JSON.parse(result[0].answer)
                }

                con.query("SELECT * FROM started_time WHERE mission_id=? and team_id=?", [mission_id, team_id], (err, result) => {
                    let bonus = 0
                    if (!err && result[0] != null && result[0].time != null && prerequisites.timer != null && prerequisites.bonus != null && prerequisites.bonus !== 0){
                        console.log("start_time", new Date(result[0].time))
                        console.log("end_time", new Date())
                        const start_time_value = new Date(result[0].time).getTime()
                        const end_time_value = new Date().getTime()
                        const delta_ms = end_time_value - start_time_value - 9 * 3600 * 1000
                        console.log("delta_ms", delta_ms)
                        bonus = prerequisites.bonus * (prerequisites.timer * 1000 - delta_ms) / 60000
                    }


                    const is_correct = auto_target.block_type === 'location' || answer === auto_target.answer

                    let is_mission_success = true
                    if (is_correct){
                        scoreboard_data.answer[title] = true

                        for(const auto_title of auto_titles){
                            if (scoreboard_data.answer[auto_title] == null || scoreboard_data.answer[auto_title] === false){
                                is_mission_success = false
                                break
                            }
                        }

                        if (is_mission_success){
                            scoreboard_data.score += +(auto_manager.base_score)
                            if (scoreboard_data.score < +(auto_manager.min_score)){
                                scoreboard_data.score = +(auto_manager.min_score)
                            }
                            scoreboard_data.status = "correct"
                            scoreboard_data.score += bonus
                            scoreboard_data.time_bonus = bonus
                        }
                    }
                    else{
                        scoreboard_data.answer[title] = false
                        const deduct = auto_manager.deduction.find(e => e.title === title)?.value ?? 0
                        scoreboard_data.score -= deduct
                        scoreboard_data.status = 'wrong'
                    }

                    scoreboard_data.answer = JSON.stringify(scoreboard_data.answer)
                    const insert_data = { mission_id: mission_id, team_id: team_id }
                    Object.assign(insert_data, scoreboard_data)
                    console.log(insert_data)
                    const update_data = scoreboard_data
                    con.query("INSERT INTO scoreboard SET ? ON DUPLICATE KEY UPDATE ?", [insert_data, update_data], (err, result) => {
                        if (err) console.log(err)
                        if (err) return res.json(util.successFalse(err, "본부에 문의하세요. Err cannot edit scoreboard"))
                        res.json(util.successTrue(null))
                    })
                })
            })
        })
    })
})

router.post('/submit/text', (req, res) => {
    getConnection(con => {
        const required_keys = ["mission_id", "team_id", "answer"]
        for (const key of required_keys){
            if (req.body[key] == null) {
                
                return res.json(util.successFalse("KeyNotExist", key + " is not exist"))
            }
        }

        const sql_mission = "SELECT * FROM mission WHERE _id=?"
        const mission_param = [req.body.mission_id]
        con.query(sql_mission, mission_param, (err, result) => {
            if (err || result.length === 0) {
                
                res.json(util.successFalse(err, "Mission not fount (FATAL!)"))
                return
            }
            const mission = result[0]
            const sql_scoreboard = "SELECT * FROM scoreboard WHERE mission_id=?, team_id=?"
            const scoreboard_param = [req.body.mission_id, req.body.team_id]
            con.query(sql_scoreboard, scoreboard_param, (err, result) => {
                if (result && result.length !== 0 && result[0].status === "correct") { // 이미 풀림
                    
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
                                
                                if (err) {console.log(err); res.json(util.successFalse(err, "err while marking wrong in unmanned mission")); return; }
                                else { res.json(util.successTrue(result)); return; }
                            })
                        }
                        else { // 정답
                            const sql_submit = "INSERT INTO scoreboard SET ? ON DUPLICATE KEY UPDATE score=IF(? > ?-submit_count*?, ?, ?-submit_count*?), status='correct'"
                            const new_data = { mission_id: mission._id, team_id: req.body.team_id, score: mission_text_answer.base_score, status: "correct" }
                            const submit_param = [new_data, mission_text_answer.min_score, mission_text_answer.base_score, mission_text_answer.decr_score, mission_text_answer.min_score, mission_text_answer.base_score, mission_text_answer.decr_score]
                            con.query(sql_submit, submit_param, (err, result) => {
                                
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
            
            if (err) { console.log(err); res.json(util.successFalse(err, "err while checking")); return; }
            else { res.json(util.successTrue(result)); return; }
        })
    })

})

router.delete("/:mission_id/:team_id", (req, res) => {
    getConnection(con => {
        const sql = "DELETE FROM scoreboard WHERE mission_id=? and team_id=?; DELETE FROM started_time WHERE mission_id=? and team_id=?;"
        const query_param = [req.params.mission_id, req.params.team_id, req.params.mission_id, req.params.team_id]
        con.query(sql, query_param, (err, result) => {
            
            if (err) { console.log(err); res.json(util.successFalse(err)); }
            else res.json(util.successTrue(result))
        })
    })

})




module.exports = router