class SDK {
    hlsInstance;
    video;
    playableWindowMS = 1000; //TODO- calculate
    syncWindowS = 150 / 1000;
    playTimeMS = 5;
    debugMode = false;
    constructor(hlsInstance, debugMode) {
        this.debugMode = debugMode;
        if(hlsInstance) {
            this.hlsInstance = hlsInstance;
            this.hlsInstance.config.maxLoadingDelay = 1
            this.video = hlsInstance._media;
            this.log('initialized');
        }
        if(this.debugMode) {
            window.hlsInstance = this.hlsInstance;
        }
    }
    log(message){
        if(this.debugMode){
            console.log(message);
        }
    }
    sync(isPlay, UTCtime, videoTime) {
        const differCommandTime = Date.now() - UTCtime;//StartTime
        const calibratedVideoTime = differCommandTime + videoTime;
        this.videoPlay(isPlay);
        this.video.muted = true;
        // if video is currently synced - return
        if(this.isSynced(calibratedVideoTime)){
            this.log("synced");
            return;
        }
        // if paused or has the required buffer - return
        if (!isPlay || this.hasBuffer(calibratedVideoTime)){
            this.videoSeek(calibratedVideoTime);
            this.log("pause or buffer");
            return;
        }

        //TODO insert seek or speed

        // else - calculate future time and then seek
        const downloadSpeedMS = this.calculateDownloadSpeedMS();
        // we need to calculate the buffer from the final point and not from the videotime
        let missingMS = this.calcMissingMS(calibratedVideoTime + (downloadSpeedMS * this.playableWindowMS));
        let downloadTimeMS = missingMS * downloadSpeedMS;
        let calculateVideoTime = calibratedVideoTime + downloadTimeMS;
        this.log({calculateVideoTime});
        this.videoSeek(calculateVideoTime);
    }
    // |-----------------------------|------------------------------|
    //-this.syncWindowS           currentTime              + this.syncWindowS
    isSynced(videoTime){
        this.log("isSynced: this.video.currentTime "+ this.video.currentTime);
        this.log('isSynced: videoTime ' + videoTime);
        this.log("isSynced: this.video.currentTime - videoTime " + (this.video.currentTime - videoTime));
        return this.getTimeDiff(videoTime) <= this.syncWindowS;
    }

    /**
     * return the diff between the player time and the given videoTime
     * @param videoTime
     * @returns {number}
     */
    getTimeDiff(videoTime) {
        return Math.abs(this.video.currentTime - videoTime);
    }

    hasBuffer(videoTime){
        return this.calcMissingMS(videoTime) === 0;
    }
    calcMissingMS(videoTime){
        if(this.video?.buffered?.length){
            for (let timeIndex = 0; timeIndex < this.video.buffered.length; timeIndex++) {
                const endBufferTime = this.video.buffered.end(timeIndex);
                const startBufferTime = this.video.buffered.start(timeIndex);
                if(startBufferTime <= videoTime && videoTime < endBufferTime){
                    const remainingMS = (endBufferTime - videoTime) * 1000;
                    const missingMS = this.playableWindowMS - remainingMS;
                    this.log({missingMS})
                    return missingMS < 0 ? 0 : missingMS;
                }
            }
        }
        return this.playableWindowMS;
    }
    videoSeek(videoTime) {
        //TODO: use this.hlsLib (HLS.js)
        this.video.currentTime = videoTime;
    }
    videoPlay(isPlay) {
        //TODO: use this.hlsLib (HLS.js)
        if(isPlay) {
            this.video.play();
            //TODO: calculate play time
        } else {
            this.video.pause();
        }
    }
    calculateDownloadSpeedMS(){
        //TODO: calculate downloadSpeedMS base on another players JS
        const levelIndex = this.hlsInstance.levelController.currentLevelIndex;
        this.log({levelIndex});
        if (levelIndex < 0) return 0.0002235; // TODO consult product about player with no load data

        const levelBitrateInBPS = this.hlsInstance.levelController._levels[levelIndex].bitrate;
        this.log({levelBitrateInBPS});
        const bandwidthInBPS = this.hlsInstance.bandwidthEstimate;
        this.log({bandwidthInBPS});
        const downloadSpeedMS = ( levelBitrateInBPS / bandwidthInBPS ) / 1000; // time to download MS and not seconds
        this.log({downloadSpeedMS});
        return downloadSpeedMS;
    }
}