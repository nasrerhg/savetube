let searchBarContainer = document.querySelector(".search-bar-container")
let searchBar = searchBarContainer.querySelector(".search-bar")
let searchInput = searchBar.querySelector("input")
let searchBtn = searchBar.querySelector(".btn-search")
let searchBarPopUps = searchBarContainer.querySelector(".pop-up")
let searchBarLoading = searchBarPopUps.querySelector(".in-progress")
let searchBarError = searchBarPopUps.querySelector(".error")


let formatSelectingCard = document.querySelector(".card-select-format")
let formatsBtns = formatSelectingCard.querySelector(".btns")
let mp4Btn = formatSelectingCard.querySelector(".btns").querySelector(".mp4-btn")
let mp3Btn = formatSelectingCard.querySelector(".btns").querySelector(".mp3-btn")
let mp4list = formatSelectingCard.querySelector(".mp4-list")
let mp3list = formatSelectingCard.querySelector(".mp3-list")


// server url
const serverUrl = "http://localhost:3001"



function oneDigitAfterPoint(number) {
    // console.log("--------------- start operation------------------");
    // console.log('input value : ',number);
    let normalPart = number.toString().split(".")[0]
    let floatPart = Number(number.toString().split(".")[1])
    if (normalPart !== "0") {
        let ceiledFloat = Math.ceil( ( floatPart / 10 ** ( floatPart.toString().length - 1) ) ) 
        // console.log('output value : ',Number(`${normalPart}.${ceiledFloat}`));
        // console.log("--------------- end operation------------------");
        return Number(`${normalPart}.${ceiledFloat}`) 
    }else{
        // console.log("normal part = 0");
        // console.log('output value : ',Number(`0.${floatPart.toString().slice(0,1)}`));
        // console.log("--------------- end operation------------------");
        return Number(`0.${floatPart.toString().slice(0,1)}`) 
    }
    
}
function bytesToMegaBytes(bytes) {
    return oneDigitAfterPoint(bytes / (1024 ** 2))
}
function percentage(portion,total) {
    portion = Number(portion)
    total = Number(total)
    return Number(((100/total) * portion).toString().slice(0,3))
}
// manages the dropdown menus and set their triggers
// [triggerElement1,dropDownMenu1],[triggerElement2,dropDownMenu2]
function formatDropMenusAnimator(...triggerListPacks) {
    // set all the drop menus to hidden 
    function hideAllDropdownMenus(triggerListPacks) {
        triggerListPacks.forEach(triggerListPack => {
            let dropDownMenu = triggerListPack[1]
            dropDownMenu.classList.add("hidden")
        });
    }
    // set btns as triggers to their drop down menus
    triggerListPacks.forEach(currentTriggerListPack => {
        let triggerBtn = currentTriggerListPack[0]
        let dropDownMenu = currentTriggerListPack[1]

        triggerBtn.addEventListener("click", function () {
            let allButCurrentPack = []
            // remove current dropdown Menu element from the elements to reset
            triggerListPacks.forEach(triggerListPack => {
                if (currentTriggerListPack !== triggerListPack) {
                    allButCurrentPack.push(triggerListPack)
                }
            });
            // reset all to hidden
            hideAllDropdownMenus(allButCurrentPack)
            dropDownMenu.classList.toggle("hidden")
        })
    });
}
formatDropMenusAnimator([mp4Btn, mp4list], [mp3Btn, mp3list])

function secondsToHrsMinsSecs(duration) {
    let secs,
        mins,
        hrs;

    if (duration >= 3600) {
        hrs = (duration - (duration % 3600)) / 3600
        duration = duration % 3600
    } else {
        hrs = 0
    }
    if (duration >= 60) {
        mins = (duration - (duration % 60)) / 60
        duration = duration % 60
    } else {
        mins = 0
    }
    secs = (duration % 60)

    if (hrs < 10) {
        hrs = "0" + hrs
    }
    if (mins < 10) {
        mins = "0" + mins
    }
    if (secs < 10) {
        secs = "0" + secs
    }

    if (Number(hrs) === 0) {
        return `${mins}:${secs}`
    } else {
        return `${hrs}:${mins}:${secs}`
    }

}

function readStream(response) {
    console.log("> ",response)
    let responseStream = response.body.getReader()
    let eventDispatcher = new EventTarget()
    
    function chunksReader(stream) {
        stream.read()
            .then(({value,done})=>{
                if (done) {
                    // console.log("stream complete")
                    let streamFinishEvent = new CustomEvent("finish")
                    eventDispatcher.dispatchEvent(streamFinishEvent)
                    return
                }
                // console.log("new chunk received")
                let streamDataEvent = new CustomEvent("data",{detail : value})
                eventDispatcher.dispatchEvent(streamDataEvent)
                chunksReader(responseStream)
            })
            .catch((error)=>{
                // console.log("iterator error");
                // console.log(error);
                let streamErrorEvent = new CustomEvent("error",{detail : error})
                eventDispatcher.dispatchEvent(streamErrorEvent)
            })
    }
    chunksReader(responseStream)
    // return eventDistpatcher
    return {
        on : (eventType,callback)=>{
            eventDispatcher.addEventListener(eventType,(event)=>{
                callback(event.detail)
            })
        }
    }
}


function videoDataInsertion(videoDataRes) {
    let formatSelectingCard = document.querySelector(".card-select-format")
    let thumbnail = formatSelectingCard.querySelector(".video-data").querySelector(".thumbnail").querySelector("img")
    let title = formatSelectingCard.querySelector(".video-data").querySelector(".title")
    let duration = formatSelectingCard.querySelector(".video-data").querySelector(".duration")

    thumbnail.setAttribute("src", videoDataRes.thumbnail)
    title.textContent = videoDataRes.title
    duration.textContent = `${secondsToHrsMinsSecs(videoDataRes.duration)}`

}

function videoFormatsInsertion(videoDataRes) {
    function mp4DownloadOptionHtmlTemplate(quality, extension, resolution, size,contentLength, url) {
        return `<div
                    data-quality="${quality}"
                    data-extension="${extension}"
                    data-resolution="${resolution}"
                    data-size="${size}"
                    data-content-length="${contentLength}"
                    data-url="${url}"
                    class="download-option"
                >
                    <div class="format-data">
                        <div class="quality">${quality}</div>
                        <div class="extension">${extension}</div>
                        <div class="resolution">${resolution}</div>
                        <div class="size">${size} MB</div>
                    </div>
                    <div class="icon-container">
                        <img src="./assets/icons/icon-download-white.png" alt="">
                    </div>
                </div>`
    }
    function mp3DownloadOptionHtmlTemplate(quality, extension, size,contentLength, url) {
        return `<div 
                    data-quality="${quality}"
                    data-extension="${extension}"
                    data-size="${size}"
                    data-content-length="${contentLength}"
                    data-url="${url}"
                    class="download-option"
                >
                    <div class="format-data">
                        <div class="quality">${quality}</div>
                        <div class="extension">${extension}</div>
                        <div class="size">${size} MB</div>
                    </div>
                    <div class="icon-container">
                        <img src="./assets/icons/icon-download-white.png" alt="">
                    </div>
                </div>`
    }
    let mp4list = formatSelectingCard.querySelector(".mp4-list")
    let mp3listDownloadOptions = formatSelectingCard.querySelector(".mp3-list").querySelectorAll(".download-option")

    videoDataRes.formats.audioVideo.forEach(audioVideoFormat => {
        mp4list.innerHTML +=
            mp4DownloadOptionHtmlTemplate(
                audioVideoFormat.qualityLabel,
                audioVideoFormat.extension,
                `${audioVideoFormat.width} x ${audioVideoFormat.height}`,
                bytesToMegaBytes(audioVideoFormat.contentLength),
                audioVideoFormat.contentLength,
                audioVideoFormat.url,

            )

    });
    videoDataRes.formats.audio.forEach(audioFormat => {
        mp3list.innerHTML +=
            mp3DownloadOptionHtmlTemplate(
                "AUDIO",
                audioFormat.extension,
                bytesToMegaBytes(audioFormat.contentLength),
                audioFormat.contentLength,
                audioFormat.url

            )

    });
}

function videoDownloadingInsertion(videoDataRes,selectedFormat) {
    let downloadingCard = document.querySelector(".card-downloading")
    let downloadingCardThumbnail = downloadingCard.querySelector(".video-data").querySelector(".thumbnail").querySelector("img")
    let downloadingCardTitle = downloadingCard.querySelector(".video-data").querySelector(".title")
    let downloadingCardDuration = downloadingCard.querySelector(".video-data").querySelector(".duration")
    let downloadingCardQuatlity = downloadingCard.querySelector(".video-data").querySelector(".quatlity")
    let downloadingCardResolution = downloadingCard.querySelector(".video-data").querySelector(".resolution")
    let downloadingCardExtension = downloadingCard.querySelector(".video-data").querySelector(".extension")

    let progressBar = downloadingCard.querySelector(".download-progress-bar")
    let fullSize = progressBar.querySelector(".full-file-size").querySelector("span")

    console.log("downloading ",videoDataRes);
    downloadingCardThumbnail.setAttribute("src",videoDataRes.thumbnail) 
    downloadingCardTitle.textContent = videoDataRes.title
    downloadingCardDuration.textContent = secondsToHrsMinsSecs(videoDataRes.duration)

    downloadingCardQuatlity.textContent = selectedFormat.quality
    if (selectedFormat.resolution !== undefined) {
        downloadingCardResolution.textContent = selectedFormat.resolution
    }
    downloadingCardExtension.textContent = selectedFormat.extension

    fullSize.textContent = selectedFormat.size

    //downloading video

    downloadVideo(selectedFormat.url,selectedFormat.hasVideo,videoDataRes.title,selectedFormat.extension,selectedFormat.contentLength)

}

async function downloadVideo(videoUrl,hasVideo,title,extension,size) {
    try {
        let options = {
            method: "POST",
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify({
                url : videoUrl
            })
        }
        console.log("video downloading request sent");
        let rawResponse = await fetch(`${serverUrl}/restream`,options)
        console.log("response received: ",rawResponse);
        console.log("reading the stream...");
        let fileChunksArray = []
        // checking if its an error message
        console.log("checking for response errors...");
        console.log("response content-type : ",rawResponse.headers.get('Content-type'));
        if (rawResponse.headers.get('Content-type') !== null) {
            if (rawResponse.headers.get('Content-type').includes("application/json")) {
                let jsonedRes = await rawResponse.json()
                throw jsonedRes.message
            }
        }
        let videoStream = readStream(rawResponse)
        let downloadPartSize = 0
        let downloadedPart = document.querySelector(".downloaded-part-size").querySelector("span")
        let progressBarPercentageText = document.querySelector(".percentage-level-text")
        let progressBarLevel = document.querySelector(".percentage-level")
        videoStream.on("data",(data)=>{
            console.log("new chunk received")
            downloadPartSize += data.length
            downloadedPart.textContent = bytesToMegaBytes(downloadPartSize)
            progressBarPercentageText.textContent = percentage(downloadPartSize,size)+"%"
            progressBarLevel.style.width = percentage(downloadPartSize,size)+"%"
            fileChunksArray.push(data)
        })
    
        videoStream.on("finish",()=>{
            console.log('stream finished ');
            let mimeType;
            if (!hasVideo) {
                mimeType = "audio/"+extension
            }
            let blobFile = new File(fileChunksArray,`${title}.${extension}`,{type : mimeType})
            console.log("blob file : ",blobFile);
            let blobFileUrl = URL.createObjectURL(blobFile)
            let downloadBtn = document.querySelector(".btn-download-file")
            downloadBtn.classList.remove("hidden")
            downloadBtn.setAttribute("href",blobFileUrl)
            downloadBtn.setAttribute("download",blobFile.name)
        })
    } catch (error) {
        console.log("error");
        console.log("downloading the video error : ",error);
    }
}

searchBtn.addEventListener("click", function () {
    searchBarError.classList.add("hidden")
    searchBarLoading.classList.remove("hidden")
    console.log("requesting info on url : ",searchInput.value);
    fetch(`${serverUrl}/indentify-video?url=` + searchInput.value)
        .then((rawRes) => {
            return rawRes.json()
        })
        .then((res) => {
            if (res.state === "error") {
                throw res.message
            }
            console.log("response received : ",res);
            searchBarError.classList.add("hidden")
            searchBarLoading.classList.add("hidden")
            searchBarContainer.classList.add("hidden")
            formatSelectingCard.classList.remove("hidden")
            videoDataInsertion(res)
            videoFormatsInsertion(res)
            // setting actions on the formats buttons 
            let mp4BtnsFormats = mp4list.querySelectorAll(".download-option")
            mp4BtnsFormats.forEach(downloadOption => {
                downloadOption.addEventListener("click",function(){
                    let downloadingCard = document.querySelector(".card-downloading")
                    
                    console.log(this.dataset);
                    formatSelectingCard.classList.add("hidden")
                    downloadingCard.classList.remove("hidden")
                    videoDownloadingInsertion(res,this.dataset)
                    
                })
            });
            // setting actions on the formats buttons 
            let mp3BtnsFormats = mp3list.querySelectorAll(".download-option")
            mp3BtnsFormats.forEach(downloadOption => {
                downloadOption.addEventListener("click",function(){
                    let downloadingCard = document.querySelector(".card-downloading")
                    
                    console.log(this.dataset);
                    formatSelectingCard.classList.add("hidden")
                    downloadingCard.classList.remove("hidden")
                    videoDownloadingInsertion(res,this.dataset)
                    
                })
            });
        })
        .catch((error) => {
            searchBarLoading.classList.add("hidden")
            searchBarError.classList.remove("hidden")
            searchBarError.textContent = error
            console.log(">", error);
        })
})







// back button
function backButton() {
    let searchBarContainer = document.querySelector(".search-bar-container")
    let formatSelectingCard = document.querySelector(".card-select-format")
    let downloadingCard = document.querySelector(".card-downloading")

    let formatSelectingCardReturnBtn = formatSelectingCard.querySelector(".card-header").querySelector(".return")
    let downloadingCardReturnBtn = downloadingCard.querySelector(".card-header").querySelector(".return")

    formatSelectingCardReturnBtn.addEventListener("click",function () {
        formatSelectingCard.classList.add("hidden")
        formatSelectingCard.previousElementSibling.classList.remove("hidden")
    })
    downloadingCardReturnBtn.addEventListener("click",function () {
        downloadingCard.classList.add("hidden")
        downloadingCard.previousElementSibling.classList.remove("hidden")
    })

}
backButton()
















// let bufferArray= []
// // function readStream(readableStream) {
// //     readableStream.read()
// //         .then(({value,done})=>{
// //             if (done) {
// //                 console.log("stream is complete ")
// //                 let blobFile = new File(bufferArray,"blob-video.mp4",{type:"video/mp4"})
// //                 let blobFileUrl = URL.createObjectURL(blobFile)
// //                 document.body.innerHTML = "<video src="+ blobFileUrl +" controls></video>"
// //                 return
// //             }
// //             console.log("value")
// //             bufferArray.push(value)
// //             readStream(readableStream)
// //         })
// // }


// console.log("requested");
// let targetUrl = "https://rr4---sn-p5h-jhoy.googlevideo.com/videoplayback?expire=1710199870&ei=3j_vZez2Laz2xN8Pi-eU-As&ip=41.250.70.225&id=o-AAP_snHBmzHv-SqPmW85UfNTim9uccVhKRR5Z2sFg-ki&itag=251&source=youtube&requiressl=yes&xpc=EgVo2aDSNQ%3D%3D&mh=Km&mm=31%2C29&mn=sn-p5h-jhoy%2Csn-apn7en7s&ms=au%2Crdu&mv=m&mvi=4&pl=24&pcm2=no&initcwndbps=657500&spc=UWF9fytTx0FY5KtzFvnEje8cKaF1PzQUMAO3XDWHFfpLZpo&vprv=1&svpuc=1&mime=audio%2Fwebm&ns=f2Ntju3EsRuwaO8x_iIelzkQ&gir=yes&clen=2714882&dur=153.401&lmt=1676099187112313&mt=1710177922&fvip=4&keepalive=yes&fexp=24007246&c=WEB&sefc=1&txp=4532434&n=zSwnoYQc8VbVeQ&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cxpc%2Cpcm2%2Cspc%2Cvprv%2Csvpuc%2Cmime%2Cns%2Cgir%2Cclen%2Cdur%2Clmt&sig=AJfQdSswRQIgYyPMXiGbsOnGBRVMrZEUBpVJUQ1TjUtA-vKZPoMDQD0CIQDAtgQACJP4vRB0zOfhV5zhX3Eim7zCpEsdN4QNrBZ2Lw%3D%3D&lsparams=mh%2Cmm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpl%2Cinitcwndbps&lsig=APTiJQcwRQIhAN9jorR-W2YyllUaloGcfAjjyFMaFItxrpz0zmKU25FVAiBA3nnUheKlclgvYAKasvW-2VDTgiAOEpGOtIxsmSh9pw%3D%3D"
// let link = "http://localhost:3001/restream"
// let options = {
//     method: "POST",
//     headers: {
//         "Content-Type":'application/json'
//     },
//     body: JSON.stringify({
//         url : targetUrl
//     })
// }
// console.log(options);
// fetch(link,options)
//     .then((res)=>{
//         console.log("res");
//         let responseStream = readStream(res)
//         let videoBlobData = []
//         responseStream.on("data",(data)=>{
//             console.log("new chunk received ");
//             videoBlobData.push(data)
//         })
//         responseStream.on("finish",(data)=>{
//             console.log("finished ");
//             let blobFile = new File(videoBlobData,"blob-video.mp4",{type:"video/mp4"})
//             console.log(blobFile);
//             let blobFileUrl = URL.createObjectURL(blobFile)
//             document.body.innerHTML = "<video src='"+blobFileUrl+"' controls ></video><a name='img.jpg' href="+ blobFileUrl+" download>Download</a>"
//         })
//     })
//     .catch((error)=>{
//         console.log(error)
//     })


