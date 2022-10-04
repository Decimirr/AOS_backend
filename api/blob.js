const express = require("express");
const router = express.Router();
const util = require('../util');
const getConnection = require("../database");
const path = require("path");
const uploads = require("../uploads");
const {StorageSharedKeyCredential, BlobServiceClient} = require("@azure/storage-blob");
const fs = require("fs");
const archiver = require("archiver");

const STATIC_PATH = "./uploads"


const STORAGE_ACCOUNT_NAME = "storecuwvv4ix3vtva";
const ACCOUNT_ACCESS_KEY = process.env.storage_key || "S9T5x7RaFD5l055yLg4AN37VyUh9iKBKwW0Yt+aZTPtD9NitKUH0T17Fg/DsFNl1b8qx+E2d5lfW+AStfkJckw==";
const containerName = "aosfile";
const credentials = new StorageSharedKeyCredential(STORAGE_ACCOUNT_NAME, ACCOUNT_ACCESS_KEY);
const blobServiceClient = new BlobServiceClient(`https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,credentials);
const containerClient = blobServiceClient.getContainerClient(containerName);


router.post("/", uploads.upload_blob.single("file"), (req, res) => {
  req.file.url = req.file.url.split("?")[0]
  console.log(req.file)
  res.json(util.successTrue(req.file))
})

router.post("/multiple", uploads.upload_blob.array("files"), (req, res) => {
  console.log(req.body.files)
  console.log(req.files)
  const result = req.files.map((file) => file.url.split("?")[0])
  console.log(result)
  res.json(util.successTrue(result))
})


router.get('/all/:training_id', (req, res) => {
  saveAllFile(req.params.training_id, ()=>{
    const zipPath = path.join(__dirname, "..", STATIC_PATH, `${req.params.training_id}.zip`)
    fs.readFile(zipPath, async (err, data) => {
      if (err != null) {
        console.log(err)
        res.json(util.successFalse(err, "err while uploading zip"))
      } else {
        const blobName = `${req.params.training_id}.zip`
        const blockBlobClient = containerClient.getBlockBlobClient(blobName)
        console.log(`uploading ${blobName} to ${blockBlobClient.url}`)
        const uploadBlobResponse = await blockBlobClient.upload(data, data.length)
        if (uploadBlobResponse.errorCode == null)
          res.json(util.successTrue(null))
        else
          res.json(util.successFalse(uploadBlobResponse.errorCode, 'err while uploading blob'))
      }
    })
  })

  /*getConnection(con => {
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
        
      }
    })
  })*/
})

module.exports = router




const saveAllFile = async (training_id, callback) => {
  const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");
  const STORAGE_ACCOUNT_NAME = "storecuwvv4ix3vtva";
  const ACCOUNT_ACCESS_KEY = process.env.storage_key || "S9T5x7RaFD5l055yLg4AN37VyUh9iKBKwW0Yt+aZTPtD9NitKUH0T17Fg/DsFNl1b8qx+E2d5lfW+AStfkJckw==";
  const containerName = "aosfile";

  const saveLocation = path.join(__dirname, "..", STATIC_PATH, `${training_id}.zip`)

  const credentials = new StorageSharedKeyCredential(STORAGE_ACCOUNT_NAME, ACCOUNT_ACCESS_KEY);
  const blobServiceClient = new BlobServiceClient(`https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,credentials);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const streamDict = {}; // to have a map of blobName and it's corresponding stream

  getConnection(con => {
    con.query("SELECT * FROM (SELECT _id, training_id, mission_name FROM mission WHERE training_id=?) a JOIN (SELECT * FROM (SELECT * FROM scoreboard) q JOIN (SELECT _id, team_name FROM team) w on q.team_id=w._id) b ON a._id=b.mission_id;", [training_id], async (err, result) => {
        if (err) {
          console.log(err)
          return;
        } else {
          console.log(result)
          const totalCount = result.length
          let currCount = 1
          for (const item of result) {
            console.log(`${currCount++}/${totalCount}`)
            const answer = JSON.parse(item.answer)
            for (const title in answer) {
              if (answer[title][0]) {
                let count = 1
                for (const file of answer[title]) {
                  //console.log(answer[title][0][0])
                  if (answer[title][0][0]!=='h') continue
                  //console.log()
                  const ext = file.split('.')[file.split('.').length-1]
                  const blobName = `(${item.mission_name})-(${item.team_name}) ${count}.${ext}`;
                  count++
                  console.log(file.split('/')[file.split('/').length-1])
                  const blobClient = containerClient.getBlobClient(file.split('/')[file.split('/').length-1]);
                  const response = await blobClient.download(0); // download from 0 offset
                  streamDict[blobName] = response.blobDownloadStream;
                }
              }
            }
          }
          streamsToCompressed(streamDict, saveLocation, callback);
        }
      }
    )
  })
}

async function streamsToCompressed(streamDict, outputFilePath, callback) {
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
      callback()
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
              if (answer[title].isArray()) {
                let count = 1
                for (const file of answer[title]) {
                  const blobName = `${item.mission_name} ${item.team_name} ${count}`;
                  count++
                  const blobClient = containerClient.getBlobClient(file);
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


const downloadAllToZip = async (blobInfos) => {
  const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");

  const STORAGE_ACCOUNT_NAME = "storecuwvv4ix3vtva";
  const ACCOUNT_ACCESS_KEY = process.env.storage_key || "S9T5x7RaFD5l055yLg4AN37VyUh9iKBKwW0Yt+aZTPtD9NitKUH0T17Fg/DsFNl1b8qx+E2d5lfW+AStfkJckw==";

  const containerName = "aosfile";

  const zipFilePath = ZIP_PATH;

  const credentials = new StorageSharedKeyCredential(STORAGE_ACCOUNT_NAME, ACCOUNT_ACCESS_KEY);
  const blobServiceClient = new BlobServiceClient(`https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,credentials);
  const containerClient = blobServiceClient.getContainerClient(containerName);



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

//downloadAllToZip().then(() => console.log('Done')).catch((ex) => console.log(ex.message));*/