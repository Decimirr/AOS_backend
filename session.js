const util = require('./util')


let next_id = 1
const MAX_CONN = 2

const session = {} // team_id  => session_id list

const createSession = (team_id) => {
  const new_id = next_id++
  if (session[team_id] != null){
    session[team_id].unshift({ id: new_id, lat: null, lng: null, lastUpdate: Date.now() })
    if (session[team_id].length > MAX_CONN)
      session[team_id] = session[team_id].slice(0, MAX_CONN)
  }
  else{
    session[team_id] = [{ id: new_id, lat: null, lng: null, lastUpdate: Date.now() }]
  }
  console.log("created")
  console.log(session)
  return new_id
}

const isValidSession = (session_id) => {
  let curr_team = -1
  for (const team_id in session)
    if (session[team_id].some(s => s.id == session_id)){
      curr_team = team_id
    }
  if (curr_team === -1)
    throw "한 팀에서 셋 이상의 접속이 감지되어 로그인이 오래된 순으로 연결이 해제되었습니다."

  let seen = 0
  session[curr_team].forEach(s => {
    if (Date.now - s.lastUpdate < 5000 && s.lat && s.lng)
      seen++
  })
  if (seen < 2) return true
  else{
    const s1 = session[curr_team][0]
    const s2 = session[curr_team][1]
    if (util.calcCrow(s1.lat, s1.lng, s2.lat, s2.lng) < 30) return true
    else if (Math.min(s1.id, s2.id) == session_id) return true
    else throw "다른 팀원과 너무 멀리 떨어져 연결이 해제되었습니다."
  }
}

const setLocation = (session_id, lat, lng) => {
  if (session[session_id] == null) return
  session[session_id].lat = lat
  session[session_id].lng = lng
  session[session_id].lastUpdate = Date.now()
}

module.exports = { createSession, isValidSession, setLocation }