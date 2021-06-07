class SDK {
    hlsInstance;
    video;
    playableWindowMS = 1000; //TODO- calculate
    syncWindowMS = 250;
    glideLimitMS = 2500;
    MAX_RETRIES = 5;
    debugMode = false;
    // init ntpTime as current time with offset 0
    ntpTime = new Date();
    ntpOffset = 0;
    SPEED_LEVELS = [
        {
            min: -this.glideLimitMS,
            max: -1000,
            speed: 3
        },
        {
            min: -1000,
            max: -500,
            speed: 2
        },
        {
            min: -500,
            max: -this.syncWindowMS,
            speed: 1.8
        },
        {
            min: -this.syncWindowMS,
            max:  this.syncWindowMS,
            speed: 1
        },
        {
            min: this.syncWindowMS,
            max: 500,
            speed: 1 / 1.8
        },
        {
            min: 500,
            max: 1000,
            speed: 1 / 2
        },
        {
            min: 1000,
            max: this.glideLimitMS,
            speed: 1 / 3
        }
    ]
    constructor(hlsInstance, ntpTime, debugMode) {
        this.debugMode = debugMode;
        // init ntp
        if(ntpTime) {
            this.ntpTime = ntpTime;
            this.ntpOffset = new Date() - ntpTime;
        }
        // init hls and video
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
    log(message, params){
        if(this.debugMode){
            params ? console.log(message, params, new Date().toUTCString()) : console.log(message, new Date().toUTCString());
        }
    }
    sync(isPlay, UTCtime, videoTime, retries = 0) {
        this.log('start calc sync');
        if (retries > this.MAX_RETRIES) return;
        const differCommandTimeS = (Date.now() - UTCtime) / 1000; //StartTime
        const calibratedVideoTime = differCommandTimeS + videoTime;
        this.log({isPlay, UTCtime, videoTime, retries})
        this.log({calibratedVideoTime, now: Date.now()})
        this.videoPlay(isPlay);
        this.video.muted = true;
        // if video is currently synced - return
        if(this.isSynced(calibratedVideoTime)){
            this.log("synced");
            this.video.playbackRate = 1;
            return;
        }
        // if paused or has the required buffer - return
        if (!isPlay){
            this.videoSeek(calibratedVideoTime);
            this.log("pause");
            return;
        }
        const diffTimeMS = this.getTimeDiff(calibratedVideoTime) * 1000;
        if (Math.abs(diffTimeMS) < this.glideLimitMS) {
            const speedLevel = this.SPEED_LEVELS.find(level =>
                level.min <= diffTimeMS && diffTimeMS < level.max
            )
            this.video.playbackRate = speedLevel.speed;
            this.log('~~~~~~~~~~~ speed: '+ speedLevel.speed);
            setTimeout(() => {
                this.sync(isPlay, UTCtime, videoTime, ++retries);
            }, 200)
        }
        else if (this.hasBuffer(calibratedVideoTime)) {
            this.log('~~~~~~~~~~~ seek buffer ', calibratedVideoTime)
            this.videoSeek(calibratedVideoTime);
        }
        else {
            // calculate future time and then seek
            const downloadSpeedMS = this.calculateDownloadSpeedMS();
            // we need to calculate the buffer from the final point and not from the videotime
            let missingMS = this.calcMissingMS(calibratedVideoTime + (downloadSpeedMS * this.playableWindowMS));
            let downloadTimeMS = missingMS * downloadSpeedMS;
            let calculateVideoTime = calibratedVideoTime + downloadTimeMS;
            this.log({calculateVideoTime});
            this.log('~~~~~~~~~~~ seek ', calculateVideoTime)
            this.videoSeek(calculateVideoTime);
            const callback = () => {
                this.video.removeEventListener('seeked', callback);
                setTimeout(() => {
                    this.sync(isPlay, UTCtime, videoTime, ++retries);
                }, 100);
            }
            this.video.addEventListener('seeked', callback);
        }
    }
    // |-----------------------------|------------------------------|
    //-this.syncWindowMS           currentTime              + this.syncWindowMS
    isSynced(syncVideoTime){
        this.log("isSynced: this.video.currentTime "+ this.video.currentTime);
        this.log('isSynced: videoTime ' + syncVideoTime);
        return Math.abs(this.getTimeDiff(syncVideoTime)) <= this.syncWindowMS / 1000;
    }
    /**
     * return the diff between the player time and the given videoTime in seconds
     * @param videoTime
     * @returns {number}
     */
    getTimeDiff(videoTime) {
        this.log('getTimeDiff: videoTime ', videoTime);
        this.log('getTimeDiff: this.video.currentTime ', this.video.currentTime);
        this.log('getTimeDiff: (this.video.currentTime - videoTime) ', (this.video.currentTime - videoTime));
        return this.video.currentTime - videoTime;
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