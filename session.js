const util = require('./util')


let next_id = 1
const MAX_CONN = 2

const session = {} // team_id  => session_id list

const createSession = (team_id) => {
  const new_id = next_id++
  if (session[team_id] != null){
    session[team_id].unshift({ id: new_id, lat: null, lng: null })
    if (session[team_id].length > MAX_CONN)
      session[team_id] = session[team_id].slice(0, MAX_CONN)
  }
  else{
    session[team_id] = [{ id: new_id, lat: null, lng: null }]
  }
  console.log("created")
  console.log(session)
  return new_id
}

const isValidSession = (session_id) => {
  console.log(session)
  console.log(session_id)
  for (const team_id in session)
    if (session[team_id].some(s => s.id == session_id))
      return true
  return false
}

const setLocation = (session_id, lat, lng) => {
  if (session[session_id] == null) return
  session[session_id].lat = lat
  session[session_id].lat = lng
}

module.exports = { createSession, isValidSession,  }