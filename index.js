const express = require('express')
const app = express()
const path = require('path')
const bodyParser = require( 'body-parser')
const cors = require('cors')
const util = require("./util");
const {StorageSharedKeyCredential, BlobServiceClient} = require("@azure/storage-blob");
const getConnection = require("./database");
const fs = require("fs");
const archiver = require("archiver");
const port = process.env.PORT || 8080

app.use(cors())
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "*");
    next()
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.use("/api/training", require("./api/training"));
app.use("/api/mission", require("./api/mission"));
app.use("/api/team", require("./api/team"));
app.use("/api/scoreboard", require("./api/scoreboard"));
app.use("/api/map", require("./api/map"));
app.use("/api/auth", require("./api/auth"));
app.use("/api/params", require("./api/params"));
app.use("/api/chat", require("./api/chat"));
app.use("/api/blob", require("./api/blob"));


app.listen(port, function (){
    console.log(`Server is working on port ${port}`);
})


/*
const saveAllFile = async (training_id) => {
    const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");
    const STORAGE_ACCOUNT_NAME = "storecuwvv4ix3vtva";
    const ACCOUNT_ACCESS_KEY = process.env.storage_key || "S9T5x7RaFD5l055yLg4AN37VyUh9iKBKwW0Yt+aZTPtD9NitKUH0T17Fg/DsFNl1b8qx+E2d5lfW+AStfkJckw==";
    const containerName = "aosfile";

    const saveLocation = `./training_id`

    const credentials = new StorageSharedKeyCredential(STORAGE_ACCOUNT_NAME, ACCOUNT_ACCESS_KEY);
    const blobServiceClient = new BlobServiceClient(`https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,credentials);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const streamDict = {}; // to have a map of blobName and it's corresponding stream

    getConnection(con => {
        con.query("SELECT * FROM (SELECT _id, training_id, mission_name FROM mission WHERE training_id=8) a JOIN (SELECT * FROM (SELECT * FROM scoreboard) q JOIN (SELECT _id, team_name FROM team) w on q.team_id=w._id) b ON a._id=b.mission_id;", [training_id], async (err, result) => {
              if (err) {
                  console.log(err)
                  return;
              } else {
                  for (const item of result) {
                      const answer = JSON.parse(item.answer)
                      for (const title in answer) {
                          if (answer[title][0]) {
                              let count = 1
                              for (const file of answer[title]) {
                                  //console.log(answer[title][0][0])
                                  if (answer[title][0][0]!=='h') continue
                                  //console.log()
                                  const blobName = `${item.mission_name} ${item.team_name} ${count}`;
                                  count++
                                  console.log(file.split('/')[file.split('/').length-1])
                                  const blobClient = containerClient.getBlobClient(file.split('/')[file.split('/').length-1]);
                                  const response = await blobClient.download(0); // download from 0 offset
                                  streamDict[blobName] = response.blobDownloadStream;
                              }
                          }
                      }
                  }
                  await streamsToCompressed(streamDict, saveLocation);
              }
          }
        )
    })
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

saveAllFile(8).then(() => console.log('Done')).catch((ex) => console.log(ex.message));*/