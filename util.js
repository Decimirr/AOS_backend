const getConnection = require('./database')


const successTrue = function (data) {
    return {
        success: true,
        message: null,
        errors: null,
        data: data,
    };
};

const successFalse = function (err, message) {
    if (!err && !message) message = "Error data not found";
    return {
        success: false,
        message: message,
        errors: err ? err : null,
        data: null,
    };
};


const toCharHelper = function(num) {
    if (num < 9) return String(num+1)
    else return String.fromCharCode(65 + num - 9)
}


//This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)
function calcCrow(lat1, lon1, lat2, lon2)
{
    const R = 6371000; // m
    const dLat = toRad(lat2-lat1);
    const dLon = toRad(lon2-lon1);
    lat1 = toRad(lat1);
    lat2 = toRad(lat2);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Converts numeric degrees to radians
function toRad(Value)
{
    return Value * Math.PI / 180;
}


function getTeams(training_id){

}

async function getClearedTeamSummary(training_id){
    return new Promise((resolve, reject) => {
        getConnection(con => {
            const sql = "SELECT mission_id, COUNT(*) AS num, (SELECT COUNT(*) FROM team WHERE training_id=?) AS total FROM (scoreboard JOIN (SELECT * FROM mission WHERE training_id=?) t1 ON (scoreboard.mission_id = t1._id)) WHERE status='correct' GROUP BY mission_id;"
            const query_param = [training_id, training_id]
            con.query(sql, query_param, (err, result)=>{
                console.log(result)
                if (err) reject(err)
                else resolve(result)
                
            })
        })
    })

}



const isValidMission = (req, res, next) => {

}


module.exports = { successTrue, successFalse, toCharHelper, calcCrow }