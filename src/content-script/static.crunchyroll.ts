import { sendMessage } from "webext-bridge/content-script"
// Global Variables

const { data: settings, promise } = useBrowserSyncStorage<settingsType>("settings", defaultSettings)
const config = { attributes: true, childList: true, subtree: true }
async function logStartOfAddon() {
	console.log("%cStreaming enhanced", "color: #00aeef;font-size: 2em;")
	console.log("Settings", settings.value)
}
async function startCrunchyroll() {
	await promise
	logStartOfAddon()
	if (settings.value.Crunchyroll.disableNumpad) Crunchyroll_disableNumpad()
	if (settings.value.Video.doubleClick) startdoubleClick()
	CrunchyrollObserver.observe(document, config)
	if (settings.value.Video.playOnFullScreen) startPlayOnFullScreen()
	watch(
		settings,
		(newValue, oldValue) => {
			console.log("settings changed", newValue)
			if (!oldValue || newValue.Video.playOnFullScreen !== oldValue?.Video?.playOnFullScreen) startPlayOnFullScreen()
		},
		{ deep: true },
	)
}
type StatisticsKey =
	| "AmazonAdTimeSkipped"
	| "NetflixAdTimeSkipped"
	| "DisneyAdTimeSkipped"
	| "IntroTimeSkipped"
	| "RecapTimeSkipped"
	| "SegmentsSkipped"
async function addSkippedTime(startTime: number, endTime: number, key: StatisticsKey) {
	if (typeof startTime === "number" && typeof endTime === "number" && endTime > startTime) {
		console.log(key, endTime - startTime)
		settings.value.Statistics[key] += endTime - startTime
		sendMessage("increaseBadge", {}, "background")
	}
}

// #region Crunchyroll
// Crunchyroll functions
const CrunchyrollObserver = new MutationObserver(Crunchyroll)
function Crunchyroll() {
	const video = document.querySelector("video")
	if (!video) return
	const time = video?.currentTime
	if (settings.value.Crunchyroll?.skipIntro) Crunchyroll_Intro(video, time)
	if (settings.value.Crunchyroll?.speedSlider) Crunchyroll_SpeedSlider(video)
	if (settings.value.Video?.scrollVolume) Crunchyroll_scrollVolume(video)
}
async function Crunchyroll_scrollVolume(video: HTMLVideoElement) {
	const volumeControl = document.querySelector('[data-testid="vilos-volume_container"]:not(.enhanced)') as HTMLElement
	if (volumeControl) {
		volumeControl.classList.add("enhanced")
		volumeControl.addEventListener("wheel", (event: WheelEvent) => {
			event.preventDefault()
			let volume = video.volume
			if (event.deltaY < 0) volume = Math.min(1, volume + 0.1)
			else volume = Math.max(0, volume - 0.1)
			video.volume = volume
			const sliderKnob = document.querySelector('div[data-testid="vilos-volume_slider"]')?.children?.[1]?.firstChild
				?.firstChild as HTMLElement
			if (sliderKnob) sliderKnob.style.transform = `translateX(${volume * 61}px) translateX(-8px) scale(1)`
		})
	}
}

function OnFullScreenChange() {
	const video = document.querySelector("video") as HTMLVideoElement
	//TODO: check if document.fullscreenElement is working before: window.fullScreen
	if (document.fullscreenElement && video) {
		video.play()
		console.log("auto-played on fullscreen")
		settings.value.Statistics.SegmentsSkipped++
		sendMessage("increaseBadge", {}, "background")
	}
}
async function startPlayOnFullScreen() {
	if (settings.value.Video?.playOnFullScreen) {
		console.log("started observing| PlayOnFullScreen")
		addEventListener("fullscreenchange", OnFullScreenChange)
	} else {
		console.log("stopped observing| PlayOnFullScreen")
		removeEventListener("fullscreenchange", OnFullScreenChange)
	}
}
let skipped = false
let reverseButtonClicked = false
let reverseButtonStartTime: number
let reverseButtonEndTime: number
async function Crunchyroll_Intro(video: HTMLVideoElement, time: number) {
	// saves the audio language to settings
	if (!reverseButtonClicked) {
		const button = document.querySelector('[data-testid="skipIntroText"]') as HTMLElement
		if (button && !skipped) {
			// add timeout because it can skip mid sentence if language is not japanese.
			skipped = true
			setTimeout(function () {
				button?.click()
				skipped = false
				console.log("Intro skipped", button)
				setTimeout(function () {
					CrunchyrollGobackbutton(video, time, video?.currentTime)
					addSkippedTime(time, video?.currentTime, "IntroTimeSkipped")
				}, 600)
			}, settings.value.General.Crunchyroll_skipTimeout)
		}
	} else if (!document.querySelector(".reverse-button")) {
		addButton(video, reverseButtonStartTime, reverseButtonEndTime)
	}
}

function addButton(video: HTMLVideoElement, startTime: number, endTime: number) {
	if (reverseButtonClicked) return
	const button = document.createElement("div")
	button.setAttribute(
		"class",
		"reverse-button css-1dbjc4n r-1awozwy r-lj0ial r-1jd5jdk r-1loqt21 r-18u37iz r-eu3ka r-1777fci r-kuhrb7 r-ymttw5 r-u8s1d r-1ff5aok r-1otgn73",
	)
	button.style.color = "white"
	button.textContent = "Rewind?"

	const buttonTimeout = setTimeout(() => {
		button.remove()
	}, 5000)
	button.onclick = function () {
		reverseButtonClicked = true
		video.currentTime = startTime
		button.remove()
		clearTimeout(buttonTimeout)
		const waitTime = endTime - startTime + 2
		//console.log("waiting for:", waitTime);
		setTimeout(function () {
			reverseButtonClicked = false
		}, waitTime * 1000)
	}
	const position = document.querySelector("#velocity-overlay-package")
	if (position) position.appendChild(button)
}

async function CrunchyrollGobackbutton(video: HTMLVideoElement, startTime: number, endTime: number) {
	reverseButtonStartTime = startTime
	reverseButtonEndTime = endTime
	addButton(video, startTime, endTime)
}

let videoSpeed: number
async function setVideoSpeed(speed: number) {
	videoSpeed = speed
}
async function Crunchyroll_SpeedSlider(video: HTMLVideoElement) {
	if (video) {
		const alreadySlider = document.querySelector("#videoSpeedSlider")
		if (!alreadySlider) {
			// infobar position for the slider to be added
			// console.log((document.querySelector("#settingsControl"));
			const position = document.querySelector("#settingsControl")?.parentElement
			if (position) {
				videoSpeed = videoSpeed || video.playbackRate

				const slider = document.createElement("input")
				slider.id = "videoSpeedSlider"
				slider.type = "range"
				slider.min = settings.value.General.sliderMin.toString()
				slider.max = settings.value.General.sliderMax.toString()
				slider.value = (videoSpeed * 10).toString()
				slider.step = settings.value.General.sliderSteps.toString()
				slider.style.display = "none"
				slider.style.width = "200px"

				const speed = document.createElement("p")
				speed.id = "videoSpeed"
				speed.textContent = videoSpeed ? videoSpeed.toFixed(1) + "x" : "1.0x"
				// makes the button clickable
				// speed.setAttribute("class", "control-icon-btn");
				speed.style.color = "white"
				speed.style.margin = "auto"
				speed.style.padding = "0 5px"
				position.prepend(slider, speed)

				if (videoSpeed) video.playbackRate = videoSpeed
				speed.onclick = function (event) {
					event.stopPropagation()
					slider.style.display = slider.style.display === "block" ? "none" : "block"
				}
				slider.onclick = function (event) {
					event.stopPropagation()
				}
				slider.oninput = function (event) {
					event.stopPropagation()
					speed.textContent = (parseInt(slider.value) / 10).toFixed(1) + "x"
					video.playbackRate = parseInt(slider.value) / 10
					setVideoSpeed(parseInt(slider.value) / 10)
				}
			}
		}
	}
}
async function Crunchyroll_disableNumpad() {
	addEventListener(
		"keydown",
		async function (event) {
			if (event.location === 3) {
				console.log("key blocked: " + event.key)
				event.stopPropagation()
				settings.value.Statistics.SegmentsSkipped++
				sendMessage("increaseBadge", {}, "background")
			}
		},
		true,
	)
}
async function startdoubleClick() {
	if (settings.value.Video?.doubleClick) {
		// event listener for double click
		document.ondblclick = function () {
			const video = document.querySelector("video")
			if (video) {
				// video is fullscreen
				//TODO: check if document.fullscreenElement is working before: window.fullScreen
				if (document.fullscreenElement) {
					document.exitFullscreen()
				} else {
					document.body.requestFullscreen()
				}
			}
		}
	} else {
		document.ondblclick = null
	}
}
// #endregion
startCrunchyroll()
