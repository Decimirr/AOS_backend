const con = require('./database')
const util = require("util");


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

module.exports = { successTrue, successFalse, toCharHelper }