const express = require("express");
const router = express.Router();
const multer = require('multer');
const upload = multer({
    dest: 'uploads/'
});
const uploads = require('../uploads')
const con = require('../database')
const util = require('../util')
const {successFalse} = require("../util");
const {query} = require("express");
const fs = require("fs");


router.get('/by-training/:training_id', (req, res) => {
    const sql = "SELECT scoreboard.*, A.is_manned FROM (SELECT * FROM mission WHERE training_id=?) A INNER JOIN scoreboard ON A._id=mission_id;"
    const query_param = [req.params.training_id]
    con.query(sql, query_param, (err, result) => {
        if (err) res.json(util.successFalse(err))
        else res.json(util.successTrue(result))
    })
})
router.get('/by-mission/:mission_id', (req, res) => {
    const sql = "SELECT scoreboard.* FROM (SELECT * FROM mission WHERE _id=?) A INNER JOIN scoreboard ON A._id=mission_id;"
    const query_param = [req.params.mission_id]
    con.query(sql, query_param, (err, result) => {
        if (err) {console.log(err); res.json(util.successFalse(err)) }
        else res.json(util.successTrue(result))
    })
})
router.get('/by-team/:team_id', (req, res) => {
    const sql = 'SELECT B.*, A.is_manned FROM (SELECT * FROM mission) A INNER JOIN (SELECT * FROM scoreboard WHERE team_id=?) B ON A._id=mission_id;'
    const query_param = [req.params.team_id]
    con.query(sql, query_param, (err, result) => {
        if (err) res.json(util.successFalse(err))
        else res.json(util.successTrue(result))
    })
})
router.get('/total-score/:training_id', (req, res) => {
    const sql = "SELECT B.team_id, SUM(B.score) as total_score FROM (SELECT * FROM mission WHERE training_id=?) A INNER JOIN (SELECT * FROM scoreboard WHERE status='correct') B ON A._id=B.mission_id GROUP BY team_id;"
    const query_param = [req.params.training_id]
    con.query(sql, query_param, (err, result) => {
        if (err) res.json(util.successFalse(err))
        else res.json(util.successTrue(result))
    })
})

router.post('/submit/text', (req, res) => {
    const required_keys = ["mission_id", "team_id", "answer"]
    for (const key of required_keys){
        if (req.body[key] == null)
            return res.json(util.successFalse("KeyNotExist", key + " is not exist"))
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
            if (result && result.length !== 0 && result[0].status === "correct")
                return res.json(util.successFalse("Already solved", "problem is already solved"))
            else{
                con.query("SELECT * FROM mission_text_answer WHERE mission_id=?", [mission._id], (err, result)=>{
                    if (err) return res.json(util.successFalse(orr, "MissionTextAnswer not fount (!FATAL)"))
                    const mission_text_answer = result[0]

                    if (mission_text_answer.answer !== req.body.answer){
                        const sql_submit = "INSERT INTO scoreboard SET ? ON DUPLICATE KEY UPDATE submit_count=submit_count+1"
                        const submit_param = [{mission_id: mission._id, team_id: req.body.team_id, score: 0, status: "wrong"}]
                        con.query(sql_submit, submit_param, (err, result) => {
                            if (err) {console.log(err); res.json(util.successFalse(err, "err while marking wrong in unmanned mission")); return; }
                            else { res.json(util.successTrue(result)); return; }
                        })
                    }
                    else { // 무인미션 정답
                        const sql_submit = "INSERT INTO scoreboard SET ? ON DUPLICATE KEY UPDATE score=(SELECT GREATEST(?, ?-submit_count*?)), status='correct'"
                        const new_data = {mission_id: mission._id, team_id: req.body.team_id, score: mission_text_answer.base_score, status: "correct"}
                        const submit_param = [new_data, mission_text_answer.min_score, mission_text_answer.base_score, mission_text_answer.decr_score]
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
router.post("/submit/image", uploads.answer_image_upload.single("answer_image"), (req, res) => {
    if (req.file == null)
        return res.json(util.successFalse("No answer image provided", "No answer image provided"))
    const required_keys = ["mission_id", "team_id"]
    for (const key of required_keys){
        if (req.body[key] == null)
            return res.json(util.successFalse("KeyNotExist", key + " is not exist"))
    }

    const sql1 = "INSERT INTO answer_pending SET ? ON DUPLICATE KEY UPDATE ?;"
    const sql2 = "INSERT INTO scoreboard SET ? ON DUPLICATE KEY UPDATE ?;"
    const query_param = [
        {
            mission_id: req.body.mission_id,
            team_id: req.body.team_id,
            answer: req.file.path,
        },
        { answer: req.file.path },
        {
            mission_id: req.body.mission_id,
            team_id: req.body.team_id,
            status: "pending",
        },
        { status: "pending" }
    ]
    con.query(sql1 + sql2, query_param, (err, result) => {
        if (err) {
            console.log(err)
            res.json(util.successFalse(err, "error while submitting image for answer"))
        }
        else res.json(util.successTrue(result))
    })
})


router.post('/check', (req, res) => {
    //TODO: 유인 미션인지 검증
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
router.get("/answer-pending/:mission_id/:team_id", (req, res) => {
    const sql = "SELECT * FROM answer_pending WHERE mission_id=? and team_id=?"
    const query_param = [req.params.mission_id, req.params.team_id]
    con.query(sql, query_param, (err, result) => {
        if (err || result.length===0){
            console.log(err)
            res.json(util.successFalse(err, "error getting answer-pending"))
        }
        else{
            console.log(result)
            con.query("SELECT * FROM mission WHERE _id=?", [req.params.mission_id], (err, missions) => {
                if (err) { console.log(err); res.json(util.successFalse(err, "err while getting answer-pending")); return; }
                if (missions[0].answer_type === 'image'){
                    const bitmap = fs.readFileSync(process.cwd() + '\\' + result[0].answer)
                    result[0].base64 = new Buffer.from(bitmap).toString("base64")
                }
                res.json(util.successTrue(result[0]))
            })
        }
    })
})

router.delete("/:mission_id/:team_id", (req, res) => {
    const sql = "DELETE FROM scoreboard WHERE mission_id=? and team_id=?"
    const query_param = [req.params.mission_id, req.params.team_id]
    con.query(sql, query_param, (err, result) => {
        if (err) { console.log(err); res.json(util.successFalse(err)); }
        else res.json(util.successTrue(result))
    })

})

module.exports = router