const multer = require('multer');
const fs = require('fs');
const path = require("path");

const problem_upload = multer({
    storage: multer.diskStorage({
        destination(req, file, done) {
            done(null, './uploads/problem/')
        },
    }),
    limits: {fileSize: 10 * 1024 * 1024}
});

const manual_map_upload = multer({
    storage: multer.diskStorage({
        destination(req, file, done) {
            done(null, './uploads/manual_map/')
        },
    }),
    limits: {fileSize: 50 * 1024 * 1024}
});

const answer_image_upload = multer({
    storage: multer.diskStorage({
        destination(req, file, done) {
            done(null, './uploads/answer_image/')
        },
    }),
    limits: {fileSize: 50 * 1024 * 1024}
});

module.exports = { problem_upload, manual_map_upload, answer_image_upload }