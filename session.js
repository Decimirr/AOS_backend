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
    else {
      session[curr_team].splice(1, 1)
      throw "다른 팀원과 너무 멀리 떨어졌습니다. 연결이 해제됩니다."
    }
  }
}

const setLocation = (session_id, lat, lng) => {
  for(const team_id in session){
    session[team_id].forEach(s => {
      if (s.id == session_id){
        s.lat = lat
        s.lng = lng
        s.lastUpdate = Date.now()
      }
    })
  }
}

const getLocation = (teams) => {
  const locations = []
  teams.forEach((team, i) => {
    if (session[team._id] != null){
      if (session[team._id][0] != null){
        const firstSession = session[team._id][0]
        locations.push({team_id: team._id, team_name: team.team_name, index: i, lat: firstSession.lat, lng: firstSession.lng})
      }
    }
  })
  return locations
}

module.exports = { createSession, isValidSession, setLocation, getLocation }