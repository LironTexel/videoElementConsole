class ServerMock {
    UTCtime = new Date();
    videoTime = 0;
    getVideoDiff = (currentVideoTime) => {
        const estimateVideoTime = this.getCurrentVideoTime();
        return currentVideoTime - estimateVideoTime;
    }
    getCurrentVideoTime(){
        const currentTime = new Date();
        const UTCdiff = (currentTime - this.UTCtime) / 1000;

        return this.videoTime + UTCdiff;
    }
}