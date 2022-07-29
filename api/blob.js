const express = require("express");
const router = express.Router();
const util = require('../util');
const con = require("../database");
const path = require("path");

const ZIP_PATH = "./allFileTest.zip"

const options = {
  root: path.join(__dirname, ".."),
}


router.get('/all/:training_id', (req, res) => {
  const sql = "SELECT mission_name, team_name, answer FROM answer_pending AS a JOIN (SELECT * FROM team WHERE training_id=?) AS b ON a.team_id=b._id JOIN mission AS c ON a.mission_id=c._id;"
  const query_param = [req.params.training_id]
  con.query(sql, query_param, async (err, result) => {
    if (err) {
      console.log(err)
      res.json(util.successFalse(err, ""))
    } else {
      result.forEach(item => {
        const words = item.answer.split('/')
        item.answer = words[words.length - 1]
        item.title = item.mission_name + " (" + item.team_name + ")." + item.answer.split('.').pop()
      })
      await downloadAllToZip(result)
      res.sendFile(path.join(__dirname, "..", ZIP_PATH))

      //downloadAllToZip(result).then(() => res.sendFile(path.join(__dirname, "..", ZIP_PATH), (err)=>{console.log(`sendFile Error ${err}`)}))
      //  .catch((ex) => {console.log(ex.message); res.json(util.successFalse(ex, "err while packig files"))})
    }
  })
  //downloadAllToZip().then(() => console.log('Done')).catch((ex) => console.log(ex.message));
})

module.exports = router


const downloadAllToZip = async (blobInfos) => {
  const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");

  const STORAGE_ACCOUNT_NAME = "storecuwvv4ix3vtva";
  const ACCOUNT_ACCESS_KEY = process.env.storage_key || "S9T5x7RaFD5l055yLg4AN37VyUh9iKBKwW0Yt+aZTPtD9NitKUH0T17Fg/DsFNl1b8qx+E2d5lfW+AStfkJckw==";

  const containerName = "aosfile";

  const zipFilePath = ZIP_PATH;

  const credentials = new StorageSharedKeyCredential(STORAGE_ACCOUNT_NAME, ACCOUNT_ACCESS_KEY);
  const blobServiceClient = new BlobServiceClient(`https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,credentials);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const streamDict = {}; // to have a map of blobName and it's corresponding stream

  for(const i in blobInfos)
  {
    const blobName = blobInfos[i].answer;
    const blobClient = containerClient.getBlobClient(blobName);
    const response = await blobClient.download(0); // download from 0 offset
    streamDict[blobInfos[i].title] = response.blobDownloadStream;
  }

  await streamsToCompressed(streamDict, zipFilePath);
}

async function streamsToCompressed(streamDict, outputFilePath) {
  return new Promise((resolve, reject) => {

    const fs = require("fs");
    const archiver = require('archiver');

    // create a file to stream archive data to.
    // In case you want to directly stream output in http response of express, just grab 'res' in that case instead of creating file stream
    const output = fs.createWriteStream(outputFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', () => {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        // log warning
      } else {
        // throw error
        throw err;
      }
    });

    // good practice to catch this error explicitly
    archive.on('error', (err) => {
      throw err;
    });

    // pipe archive data to the file
    archive.pipe(output);

    for(const blobName in streamDict) {
      const readableStream = streamDict[blobName];

      // finalize the archive (ie we are done appending files but streams have to finish yet)
      archive.append(readableStream, { name: blobName });

      readableStream.on("error", reject);
    }

    archive.finalize();
    resolve();
  });
}

//downloadAllToZip().then(() => console.log('Done')).catch((ex) => console.log(ex.message));