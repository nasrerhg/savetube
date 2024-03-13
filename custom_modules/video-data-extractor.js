function videoDataExtractor(infoObject) {
    let videoData = {};
    videoData.title = infoObject.videoDetails.title
    videoData.duration = infoObject.videoDetails.lengthSeconds
    videoData.thumbnail = infoObject.videoDetails.thumbnails[thumbnails.length - 1].url

    videoData.formats = {}
    videoData.formats.audioVideo = []
    videoData.formats.noAudioVideo = []
    videoData.formats.audio = []

    infoObject.formats.forEach(format => {
        let formatData = {}
        formatData.extension = format.mimeType.split(";")[0].split("/")[1]
        formatData.hasVideo = format.hasVideo
        formatData.hasAudio = format.hasAudio
        formatData.contentLength = format.contentLength

        if (format.hasVideo && format.hasAudio) {
            formatData.qualityLabel = format.qualityLabel
            formatData.url = format.url
            formatData.width = format.width
            formatData.height = format.height
            videoData.formats.audioVideo.push(formatData)
        }
        if (format.hasVideo && format.hasAudio === false) {
            formatData.qualityLabel = format.qualityLabel
            formatData.url = format.url
            formatData.width = format.width
            formatData.height = format.height
            videoData.formats.noAudioVideo.push(formatData)
        }
        if (format.hasVideo === false && format.hasAudio) {
            if (formatData.extension.includes("mp4")) {
                formatData.extension = format.codecs.split(".")[0]
            }
            formatData.url = format.url
            videoData.formats.audio.push(formatData)
        }
    });
    return videoData
}
module.exports = { videoDataExtractor }
