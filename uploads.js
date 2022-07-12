const multer = require('multer');
const {MulterAzureStorage} = require("multer-azure-blob-storage");
const connect_string = process.env.storage_connect_string
const access_key = process.env.storage_key
const account_name = "storecuwvv4ix3vtva"

const azureStorage = new MulterAzureStorage({
    connectionString : connect_string,
    accessKey : access_key,
    accountName : account_name,
    containerName: "aosfile",
    //blobName: resolveBlobName,
    containerAccessLevel: 'blob',
});
const upload_blob = multer({
    storage: azureStorage
});

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

module.exports = { upload_blob, problem_upload, manual_map_upload, answer_image_upload }