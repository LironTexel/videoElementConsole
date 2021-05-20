////////////////////// CONSTS //////////////////////

const VIDEO_HEIGHT = 320;
const VIDEO_WIDTH = 600;
const VIDEO_POSTER = 'https://icatcare.org/app/uploads/2018/07/Thinking-of-getting-a-cat.png';
const MEDIA_ERROR_CODES = {
    1: 'MEDIA_ERR_ABORTED',
    2: 'MEDIA_ERR_NETWORK',
    3: 'MEDIA_ERR_DECODE',
    4: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
}
const READY_STATE_CODES = {
    0: 'HAVE_NOTHING',
    1: 'HAVE_METADATA',
    2: 'HAVE_CURRENT_DATA',
    3: 'HAVE_FUTURE_DATA',
    4: 'HAVE_ENOUGH_DATA',
}
const NETWORK_STATE_CODES = {
    0: 'NETWORK_EMPTY',
    1: 'NETWORK_IDLE',
    2: 'NETWORK_LOADING',
    3: 'NETWORK_NO_SOURCE',
}
const EVENTS_BINDS = {
    play: true,
    pause: true,
    playing: true,
    progress: true,
    ratechange: true,
    abort: true,
    canplay: true,
    canplaythrough: true,
    durationchange: true,
    emptied: true,
    ended: true,
    error: true,
    loadeddata: true,
    loadedmetadata: true,
    loadstart: true,
    seeked: true,
    seeking: true,
    stalled: true,
    suspend: true,
    timeupdate: true,
    volumechange: true,
    waiting: true,
    // custom callbacks (not video events)
    onenterpictureinpicture: true,
    onleavepictureinpicture: true,
    onfullscreenchange: true,
    oncontextmenu: true,
}

////////////////////// INIT VIDEO //////////////////////

window.video = document.querySelector('.player');
video.setAttribute('poster', VIDEO_POSTER);
video.height = VIDEO_HEIGHT;
video.width = VIDEO_WIDTH;

////////////////////// MAIN //////////////////////

initLogBindsView();
bindVideoEvents();

initSelectAllButton();
initClearLogsButton();
initSegmentsArea();

initVideoData();
initInputs();

////////////////////// INIT LOG FUNCTIONS //////////////////////

/**
 * Creates the checkboxes for the binds
 */
function initLogBindsView() {
    window.logBinds = document.querySelector('.log-binds');
    Object.entries(EVENTS_BINDS).forEach( entry => {
        const eventName = entry[0];
        const eventValue = entry[1];
        logBinds.innerHTML +=
            `<div class="event ${eventName}">
                <input id="${eventName}Bind"
                       class="event-${eventName}-input"
                       type="checkbox" ${eventValue && 'checked' || ''}
                       onChange="EVENTS_BINDS['${eventName}'] = !EVENTS_BINDS['${eventName}']">
                <label for="${eventName}Bind">${eventName}</label>
            </div>`
    })
}

/**
 * Adds listeners to the video element
 */
function bindVideoEvents() {
    window.logs = document.querySelector('.logs');
    video.addEventListener('abort', e => logsHandler(e, e.target.abort) , false);
    video.addEventListener('canplay', e => logsHandler(e) , false);
    video.addEventListener('canplaythrough', e => logsHandler(e) , false);
    video.addEventListener('durationchange', e => logsHandler(e, e.target.duration) , false);
    video.addEventListener('emptied', e => logsHandler(e) , false);
    video.addEventListener('ended', e => logsHandler(e, e.target.ended) , false);
    video.addEventListener('error', e => logsHandler(e, MEDIA_ERROR_CODES[e.target.error?.code]) , false);
    video.addEventListener('loadeddata', e => logsHandler(e) , false);
    video.addEventListener('loadedmetadata', e => logsHandler(e) , false);
    video.addEventListener('loadstart', e => logsHandler(e) , false);
    video.addEventListener('pause', e => logsHandler(e, e.target.paused) , false);
    video.addEventListener('play', e => logsHandler(e) , false);
    video.addEventListener('playing', e => logsHandler(e) , false);
    video.addEventListener('progress', e => logsHandler(e) , false);
    video.addEventListener('ratechange', e => logsHandler(e, video.playbackRate) , false);
    video.addEventListener('seeked', e => logsHandler(e, video.currentTime) , false);
    video.addEventListener('seeking', e => logsHandler(e, e.target.seeking) , false);
    video.addEventListener('stalled', e => logsHandler(e) , false);
    video.addEventListener('suspend', e => logsHandler(e) , false);
    video.addEventListener('timeupdate', e => logsHandler(e, e.target.currentTime) , false);
    video.addEventListener('volumechange', e => logsHandler(e, e.target.volume) , false);
    video.addEventListener('waiting', e => logsHandler(e) , false);
    video.onenterpictureinpicture = () => logsHandler({type: 'onenterpictureinpicture'});
    video.onleavepictureinpicture = () => logsHandler({type: 'onleavepictureinpicture'});
    video.onfullscreenchange = () => logsHandler({type: 'onfullscreenchange'});
    video.oncontextmenu = () => logsHandler({type: 'oncontextmenu'});

    function logsHandler(e, data) {
        if (EVENTS_BINDS[e.type]) {
            logs.innerHTML += `<div class="event ${e.type}"> ${e.type} ${data !== undefined ? data : ''}</div>`;
            logs.scrollTop = logs.scrollHeight;
        }
    }
}

////////////////////// INIT VIEW FUNCTIONS //////////////////////

/**
 * Initialise the Select All button
 */
function initSelectAllButton() {
    window.bindsSelectAllButton = document.querySelector('.binds-select-all-button');
    bindsSelectAllButton.addEventListener('click', () => {
        const shouldSelect = bindsSelectAllButton.innerHTML !== 'Deselect all';
        const events = document.querySelectorAll('.log-binds .event input');
        Array.prototype.forEach.call(events, function(event) {
            if (event.checked && !shouldSelect || !event.checked && shouldSelect) {
                event.click();
            }
        });
        bindsSelectAllButton.innerHTML = bindsSelectAllButton.innerHTML === 'Deselect all' ? 'Select all' : 'Deselect all';
    })
}

/**
 * Initialise the Clear logs button
 */
function initClearLogsButton() {
    window.clearLogsButton = document.querySelector('.logs-clear-button');
    clearLogsButton.addEventListener('click', () => {
        logs.innerHTML = '';
    })
}

/**
 * Initialise segments area
 */
function initSegmentsArea() {
    initMarkers();
    initSrgmentViews();

    function initMarkers() {
        initSuggestedTimeMarker();
        initCurrentTimeMarker();

        function initCurrentTimeMarker(){
            window.currentTimeMarker = document.querySelector('.currentTime-marker');
            video.addEventListener('timeupdate', updateCurrentTimeMarkerPosition , false);
            video.addEventListener('loadedmetadata', updateCurrentTimeMarkerPosition , false);
        }

        function initSuggestedTimeMarker() {
            window.segmentsArea = document.querySelector('.segments-area');
            window.suggestedTimeMarker = document.querySelector('.suggestedTime-marker');
            segmentsArea.addEventListener("mousemove", e => {
                if (video.duration) {
                    suggestedTimeMarker.style.left = e.offsetX + 'px';
                    const suggestedTime = (e.offsetX / segmentsArea.offsetWidth) * video.duration;
                    suggestedTimeMarker.setAttribute('suggestedTime-before', roundFix(suggestedTime));
                    suggestedTimeMarker.classList.add("show");
                }
            }, false);

            segmentsArea.addEventListener("mouseleave", () => {
                suggestedTimeMarker.classList.remove("show");
            }, false);

            segmentsArea.addEventListener("click", e => {
                if(video.duration) {
                    const suggestedTime = (e.offsetX / segmentsArea.offsetWidth) * video.duration;
                    video.currentTime = suggestedTime;
                    updateCurrentTimeMarkerPosition();
                }
            }, false);
        }

        function updateCurrentTimeMarkerPosition() {
            const position = (video.currentTime / video.duration) * 100;
            currentTimeMarker.style.left = position + '%';
            currentTimeMarker.setAttribute('currentTime-before', roundFix(video.currentTime));
        }
    };

    function initSrgmentViews() {
        window.seekableView = document.querySelector('.seekable-view');
        window.bufferedView = document.querySelector('.buffered-view');
        window.playedView = document.querySelector('.played-view');
        video.addEventListener('loadedmetadata', processSeekableSegments , false);
        video.addEventListener('progress', processBufferedSegments , false);
        video.addEventListener('timeupdate', processPlayedSegments , false);

        seekableView.innerHTML = '';
        bufferedView.innerHTML = '';
        playedView.innerHTML = '';

        function processSeekableSegments() {
            seekableView.innerHTML = '';
            for (let i = 0; i < video.seekable.length; i++) {
                const segmentWidth = ((video.seekable.end(i) - video.seekable.start(i)) / video.duration) * 100;
                const segmentLeft = (video.seekable.start(i) / video.duration) * 100;
                const segmentEnd = roundFix(video.seekable.end(i));
                seekableView.innerHTML +=
                    `<div class="segment seekable-segment segment-${i}" end-before=${segmentEnd} style="width: ${segmentWidth}%; left: ${segmentLeft}%"></div>`
            }
        }

        function processBufferedSegments() {
            bufferedView.innerHTML = '';
            for (let i = 0; i < video.buffered.length; i++) {
                const segmentWidth = ((video.buffered.end(i) - video.buffered.start(i)) / video.duration) * 100;
                const segmentLeft = (video.buffered.start(i) / video.duration) * 100;
                const segmentEnd = roundFix(video.buffered.end(i));
                bufferedView.innerHTML +=
                    `<div class="segment buffered-segment segment-${i}" end-before=${segmentEnd} style="width: ${segmentWidth}%; left: ${segmentLeft}%">${i}</div>`
            }
        }

        function processPlayedSegments() {
            playedView.innerHTML = '';
            for (let i = 0; i < video.played.length; i++) {
                const segmentWidth = ((video.played.end(i) - video.played.start(i)) / video.duration) * 100;
                const segmentLeft = (video.played.start(i) / video.duration) * 100;
                const segmentEnd = roundFix(video.played.end(i));
                playedView.innerHTML +=
                    `<div class="segment played-segment segment-${i}" end-before=${segmentEnd} style="width: ${segmentWidth}%; left: ${segmentLeft}%">${i}</div>`
            }
        }
    }

    function roundFix(num, toFixed = 2) {
        return parseFloat(num).toFixed(toFixed);
    }
}

////////////////////// INIT DATA FUNCTIONS //////////////////////

/**
 * Updates the data section and adds event listeners
 */
function initVideoData() {
    initCurrentSrc();
    initDuration();
    initVideoFrames();
    initReadyState();
    initNetworkState();
    initTextTracks();
}

function initCurrentSrc() {
    document.getElementById('currentSrc-data').innerHTML = video.currentSrc;
    document.getElementById('currentSrcInput').value = video.currentSrc;
    video.addEventListener('loadedmetadata', () => {
        document.getElementById('currentSrc-data').innerHTML = video.currentSrc;
        document.getElementById('currentSrcInput').value = video.currentSrc;
    });
}

function initDuration() {
    document.getElementById('duration-data').innerHTML = video.duration;
    document.getElementById('duration-info').innerHTML = video.duration;
    video.addEventListener('durationchange', () => {
        document.getElementById('duration-data').innerHTML = video.duration;
        document.getElementById('duration-info').innerHTML = video.duration;
    });
}

function initVideoFrames() {
    function updateVideoFramesData() {
        document.getElementById('playbackQuality-total-info').innerHTML = video.getVideoPlaybackQuality().totalVideoFrames;
        document.getElementById('playbackQuality-dropped-info').innerHTML = video.getVideoPlaybackQuality().droppedVideoFrames;
        document.getElementById('playbackQuality-corrupted-info').innerHTML = video.getVideoPlaybackQuality().corruptedVideoFrames;
        document.getElementById('getVideoPlaybackQuality-data').innerHTML = parseVideoPlaybackQuality(video.getVideoPlaybackQuality())

        function parseVideoPlaybackQuality(data) {
            return `totalVideoFrames: ${data.totalVideoFrames}, droppedVideoFrames: ${data.droppedVideoFrames}, corruptedVideoFrames: ${data.corruptedVideoFrames}`;
        }
    }
    updateVideoFramesData();
    video.addEventListener('timeupdate', () => {
        updateVideoFramesData();
    }, false);
}

function initReadyState() {
    updateReadyStateFields();
    video.addEventListener('loadedmetadata', updateReadyStateFields);
    video.addEventListener('canplay', updateReadyStateFields);
    video.addEventListener('canplaythrough', updateReadyStateFields);
    video.addEventListener('stalled', updateReadyStateFields);
    video.addEventListener('waiting', updateReadyStateFields);
    video.addEventListener('suspend', updateReadyStateFields);

    function updateReadyStateFields() {
        document.getElementById('readyState-data').innerHTML = video.readyState;
        document.getElementById('readyState-info').innerHTML = READY_STATE_CODES[video.readyState];
    }
}

function initNetworkState() {
    updateNetworkStateFields();
    video.addEventListener('loadedmetadata', updateNetworkStateFields);
    video.addEventListener('canplay', updateNetworkStateFields);
    video.addEventListener('canplaythrough', updateNetworkStateFields);
    video.addEventListener('stalled', updateNetworkStateFields);
    video.addEventListener('waiting', updateNetworkStateFields);
    video.addEventListener('suspend', updateNetworkStateFields);

    function updateNetworkStateFields() {
        document.getElementById('networkState-data').innerHTML = video.networkState;
        document.getElementById('networkState-info').innerHTML = NETWORK_STATE_CODES[video.networkState];
    }
}

function initTextTracks() {
    const parsedTracks = parseTextTracks(video.textTracks);
    document.getElementById('textTracks-data').innerHTML = parsedTracks;
    document.getElementById('textTracks-info').innerHTML = parsedTracks;

    function parseTextTracks(tracksData = []) {
        let res = ''
        for (let i = 0; i < tracksData.length; i++) {
            res += `<div>${i + 1}- ${tracksData[i].kind}, "${tracksData[i].label}", ${tracksData[i].language}</div>`
        }
        return res;
    }
}

////////////////////// INIT INPUT FUNCTIONS //////////////////////

/**
 * Initialise all the input elements
 */
function initInputs() {
    initVolumeInput();
    initWidthInput();
    initHeightInput();
    initCurrentTimeInput();
    initPlaybackRateInput();
    initPlayPauseButtons();
    initAutoplayInput();
    initPictureInPictureInput();
    initFullScreenInput();
    initMutedInput();
    initLoopInput();
    initControlsInput();
    initPreloadInput();
    initPosterInput();
    initSrcInput();
}

function initVolumeInput() {
    window.volumeInput = document.querySelector('.volume-input');
    volumeInput.value = video.volume;
    document.getElementById('volume-data').innerHTML = video.volume;
    video.addEventListener('volumechange', () => document.querySelector('.volume-input').value = video.volume , false);
    video.addEventListener('volumechange', () => document.getElementById('volume-data').innerHTML = video.volume , false);
    volumeInput.addEventListener('input', function(e) {
        video.volume = e.target.value;
        document.getElementById('volume-data').innerHTML = video.volume;
    })
}

function initWidthInput() {
    window.widthInput = document.querySelector('.width-input');
    widthInput.value = video.width;
    document.getElementById('width-data').innerHTML = video.width;
    widthInput.addEventListener('input', function(e) {
        video.width = e.target.value;
        document.getElementById('width-data').innerHTML = video.width;
    })
}

function initHeightInput() {
    window.heightInput = document.querySelector('.height-input');
    heightInput.value = video.height;
    document.getElementById('height-data').innerHTML = video.height;
    heightInput.addEventListener('input', function(e) {
        video.height = e.target.value;
        document.getElementById('height-data').innerHTML = video.height;
    })
}

function initCurrentTimeInput() {
    window.currentTimeInput = document.querySelector('.currentTime-input');
    currentTimeInput.value = video.currentTime;
    document.getElementById('currentTime-data').innerHTML = video.currentTime;
    video.addEventListener('timeupdate', () => document.getElementById('currentTime-data').innerHTML = video.currentTime , false);
    video.addEventListener('timeupdate', () => document.querySelector('.currentTime-input').value = video.currentTime , false);
    video.addEventListener('durationchange', () => document.querySelector('.currentTime-input').setAttribute('max', video.duration), false);
    video.addEventListener('loadedmetadata', () => document.querySelector('.currentTime-input').setAttribute('value', '0'), false);
    video.addEventListener('loadedmetadata', () => document.querySelector('.currentTime-input').removeAttribute('disabled'), false);
    currentTimeInput.addEventListener('input', function(e) {
        video.currentTime = e.target.value;
        document.getElementById('currentTime-data').innerHTML = video.currentTime;
    })
}

function initPlaybackRateInput() {
    window.playbackRateInput = document.querySelector('.playbackRate-input');
    playbackRateInput.value = video.playbackRate;
    document.getElementById('playbackRate-data').innerHTML = video.playbackRate;
    video.addEventListener('ratechange', () => document.querySelector('.playbackRate-input').value = video.playbackRate , false);
    video.addEventListener('ratechange', () => document.getElementById('playbackRate-data').innerHTML = video.playbackRate , false);
    playbackRateInput.addEventListener('input', function(e) {
        video.playbackRate = e.target.value;
        document.getElementById('playbackRate-data').innerHTML = video.playbackRate;
    })
}

function initPlayPauseButtons() {
    video.addEventListener('pause', () => document.getElementById('paused-data').innerHTML = video.paused , false);
    video.addEventListener('play', () => document.getElementById('paused-data').innerHTML = video.paused , false);
    document.getElementById('paused-data').innerHTML = video.paused;

    window.playButton = document.querySelector('.play-button');
    playButton.addEventListener('click', () => video.play());
    window.pauseButton = document.querySelector('.pause-button');
    pauseButton.addEventListener('click', () => video.pause());
}

function initAutoplayInput() {
    window.autoplayInput = document.querySelector('.autoplay-input');
    autoplayInput.value = video.autoplay;
    document.getElementById('autoplay-data').innerHTML = video.autoplay;
    autoplayInput.addEventListener('change', function() {
        this.checked ? video.setAttribute('autoplay', true) : video.removeAttribute('autoplay')
        document.getElementById('autoplay-data').innerHTML = video.autoplay;
    })
}

function initPictureInPictureInput() {
    window.pictureInPictureInput = document.querySelector('.pictureInPicture-input');
    pictureInPictureInput.value = !!document.pictureInPictureElement;
    document.getElementById('pictureInPicture-data').innerHTML = document.pictureInPictureElement?.toString();
    video.addEventListener('loadedmetadata', () => document.querySelector('.pictureInPicture-input').removeAttribute('disabled'), false);
    pictureInPictureInput.addEventListener('change', function() {
        const reqPromise = this.checked && document.pictureInPictureEnabled ? video.requestPictureInPicture() : document.exitPictureInPicture();
        reqPromise.then((res) => {
            document.getElementById('pictureInPicture-data').innerHTML = res;
        })
    })
}

function initFullScreenInput() {
    window.fullScreenInput = document.querySelector('.fullScreen-input');
    fullScreenInput.value = !!document.fullscreenElement;
    document.getElementById('fullScreen-data').innerHTML = document.fullscreenElement?.toString();

    fullScreenInput.addEventListener('change', function() {
        const reqPromise = this.checked && document.fullscreenEnabled ? video.requestFullscreen() : document.exitFullscreen();
        reqPromise.then((res) => {
            document.getElementById('fullScreen-data').innerHTML = res;
        })
        setTimeout(() => {
            fullScreenInput.checked = false;
            document.exitFullscreen().then((res) => {
                document.getElementById('fullScreen-data').innerHTML = res;
            })
        }, 2000);
    })
}

function initMutedInput() {
    window.mutedInput = document.querySelector('.muted-input');
    mutedInput.checked = video.muted;
    document.getElementById('muted-data').innerHTML = video.muted;
    video.addEventListener('volumechange', () => document.getElementById('muted-data').innerHTML = video.muted , false);
    video.addEventListener('volumechange', () => mutedInput.checked = video.muted , false);
    mutedInput.addEventListener('change', function() {
        video.muted = this.checked;
        document.getElementById('muted-data').innerHTML = video.muted;
    })
}

function initLoopInput() {
    window.loopInput = document.querySelector('.loop-input');
    loopInput.checked = video.loop;
    document.getElementById('loop-data').innerHTML = video.loop;
    loopInput.addEventListener('change', function() {
        video.loop = this.checked;
        document.getElementById('loop-data').innerHTML = video.loop;
    })
}

function initControlsInput() {
    window.controlsInput = document.querySelector('.controls-input');
    controlsInput.checked = video.controls;
    document.getElementById('controls-data').innerHTML = video.controls;
    controlsInput.addEventListener('change', function() {
        this.checked ? video.setAttribute('controls', 'controls') : video.removeAttribute('controls');
        document.getElementById('controls-data').innerHTML = video.controls;
    })
}

function initPreloadInput() {
    document.getElementById('preload-data').innerHTML = video.preload;
    const radios = document.querySelectorAll('input[name="preload"]');
    Array.prototype.forEach.call(radios, function(radio) {
        radio.checked = radio.value === video.preload;
        radio.addEventListener('change', function () {
            video.setAttribute('preload', this.value)
            document.getElementById('preload-data').innerHTML = video.preload;
        });
    });
}

function initPosterInput() {
    document.getElementById('poster-data').innerHTML = video.poster;
    document.getElementById('posterInput').value = video.poster;
    posterInput.addEventListener('change', (e) => {
        video.poster = e.target.value;
        document.getElementById('poster-data').innerHTML = video.poster;
    })
}

function initSrcInput() {
    document.getElementById('src-data').innerHTML = video.src;
    document.getElementById('srcInput').value = video.src;
    srcInput.addEventListener('change', (e) => {
        const src = e.target.value;
        src ? video.src = e.target.value : video.removeAttribute('src');
        video.load();
        document.getElementById('src-data').innerHTML = video.src;
    })
}