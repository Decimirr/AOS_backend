const express = require("express");
const router = express.Router();
const util = require('../util')

router.post('/login', (req, res) => {
  console.log("LOGIN ATTEMPTED")
  if (req.body.id !== process.env.admin_id)
    return res.json(util.successFalse("invalid id", "존재하지 않는 아이디입니다."))
  if (req.body.pw !== process.env.admin_password)
    return res.json(util.successFalse("invalid pw", "비밀번호가 일치하지 않습니다."))
  else return res.json(util.successTrue({ token: process.env.admin_token }))
})
router.post('/', (req, res) => {
  console.log("AUTH")
  if (req.body.token !== process.env.admin_token)
    return res.json(util.successFalse("invalid token", "로그인이 필요합니다."))
  else return res.json(util.successTrue())
})


module.exports = router