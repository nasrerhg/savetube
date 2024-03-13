const express = require("express")
const https = require("https")
const {env} = require("process")
const ytdl = require('ytdl-core');
const { videoDataExtractor } = require("./custom_modules/video-data-extractor.js")
const EventEmiter = require("node:events");
const cors = require('cors'); // Include cors middleware

// disabling updates for the ytdl-core module 
env.YTDL_NO_UPDATE = false




const app = express()



app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cors({ origin: '*' }));


function readStream(response) {
    let responseStream = response.body.getReader()
    let streamEvent = new EventEmiter() 
    function chunksReader(stream) {
        stream.read()
            .then(({value,done})=>{
                if (done) {
                    // console.log("stream complete")
                    streamEvent.emit("finish")
                    return
                }
                // console.log("new chunk received")
                streamEvent.emit("data",value)
                chunksReader(responseStream)
            })
            .catch((error)=>{
                // console.log("iterator error");
                // console.log(error);
                streamEvent.emit("error",error)
            })
    }
    chunksReader(responseStream)
    return streamEvent 
}
function httpsGetPromisefied(httpsGetArguments) {
    let httpsGetPromise = new Promise((resolve, reject) => {
        https.get(httpsGetArguments, (response) => {
            resolve(response)
        }).on("error", (error) => {
            reject(error)
        })
    })
    return httpsGetPromise
}
function getHeaders(response) {
    let rawHeaders = response.rawHeaders
    let arrangedHeaders = {}
    rawHeaders.forEach(rawHeader => {
        if (rawHeaders.indexOf(rawHeader) % 2 === 0) {
            arrangedHeaders[rawHeader] = ""
        } else {
            arrangedHeaders[rawHeaders[rawHeaders.indexOf(rawHeader) - 1]] = rawHeader

        }
    });
    return arrangedHeaders
}
function bytesToMegaBytes(bytes) {
    return bytes / (1024 ** 2)
}






app.get("/indentify-video/", async (req, res) => {
    console.log("\n----------------------- video identification request ----------------------------\n");
    let youtubeVideoUrl = req.query.url
    console.log("requesting info on the link : " + youtubeVideoUrl);
    res.setHeader("Access-Control-Allow-Origin", "*")
    try {
        let info = await ytdl.getInfo(youtubeVideoUrl)
        // let info = JSON.parse(readFileSync("./last-response.json",{encoding:"utf-8"}))
        console.log("video info received");
        let videoData = videoDataExtractor(info)
        // let videoData = info
        let promises = []
        // adding the contentLength (size) of each audioVideo format
        console.log("setting content Length for audioVideo formats...")
        for (let format of videoData.formats.audioVideo) {
            let promise = new Promise(async (resolve,reject)=>{
                try {
                    let response = await httpsGetPromisefied(format.url)
                    let extractedContentLength = getHeaders(response)["Content-Length"]
                    format.contentLength = extractedContentLength
                    console.log("a format content Length added");
                    resolve("done")
                } catch (error) {
                    console.log("ERROR : https get Method : setting content length");
                    console.log("=> ",error);
                    reject(error)
                }
            })
            promises.push(promise)
        }
        // adding the contentLength (size) of each audioVideo format
        console.log("setting content Length for audio formats...")
        for (let format of videoData.formats.audio) {
            let promise = new Promise(async (resolve,reject)=>{
                try {
                    let response = await httpsGetPromisefied(format.url)
                    let extractedContentLength = getHeaders(response)["Content-Length"]
                    format.contentLength = extractedContentLength
                    console.log("a format content Length added");
                    resolve("done")
                } catch (error) {
                    console.log("ERROR : https get Method : setting content length");
                    console.log("=> ",error);
                    reject(error)
                }
            })
            promises.push(promise)
        }
        await Promise.allSettled(promises)
        console.log("setting content Length for audioVideo formats completed")
        console.log("setting content Length for audio formats completed")
        console.log("sending the video info");
        res.send(videoData)
    } catch (error) {
        console.log("ERROR : ytdl get info \n" + error)
        res.json({
            state : "error",
            message : error.toString()
        })
    }
})


app.post("/restream",(req,res)=>{
    console.log("------------------------ url restream requested --------------------------");
    res.statusCode = 206
    res.setHeader("Access-Control-Allow-Origin", "*")
    let url = req.body.url
    console.log('target url : ',url);
    https.get(url,(response)=>{
        console.log("target url responded");
        console.log("response status code : ",response.statusCode);
        console.log("restreaming the stream");
        response.on("data",(data)=>{
            console.log("chunk sent");
            res.write(data)
        })
        response.on("end",()=>{
            console.log("finished restreaming");
            res.end()
        })
        response.on("error",(error)=>{
            console.log("stream error : ",error)
        })
    }).on("error",(error)=>{
        console.log(" restreaming https error")
        console.log(error)
        res.setHeader("Content-Type","application/json")
        res.json({
            state: "error",
            message : error.toString()
        })
    })
})

app.listen(3001, () => {
    console.log("server running on port 3001...");
})