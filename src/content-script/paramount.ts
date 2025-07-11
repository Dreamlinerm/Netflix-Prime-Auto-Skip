import { startSharedFunctions, createSlider, Platforms } from "@/content-script/shared-functions"
import { sendMessage } from "webext-bridge/content-script"
// Global Variables

const { data: settings, promise } = useBrowserSyncStorage<settingsType>("settings", defaultSettings)
const videoSpeed: Ref<number> = ref(1)
const config = { attributes: true, childList: true, subtree: true }
async function logStartOfAddon() {
	console.log("%cStreaming enhanced", "color: #00aeef;font-size: 2em;")
	console.log("Settings", settings.value)
}
async function startPARA() {
	await promise
	logStartOfAddon()
	startSharedFunctions(Platforms.PARA)
	PARAObserver.observe(document, config)
	if (settings.value.PARA?.speedSlider) PARA_SpeedKeyboard()
	if (settings.value.Video?.scrollVolume) PARA_doubleClick()
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

// #region PARA
// PARA functions
const PARAObserver = new MutationObserver(PARA)
async function PARA() {
	const video: HTMLVideoElement = document.querySelector("video") as HTMLVideoElement
	const time = video?.currentTime
	if (settings.value.PARA?.skipIntro) PARA_Intro(video, time)
	if (settings.value.PARA?.skipCredits) PARA_Credits(time)
	if (settings.value.PARA?.watchCredits) PARA_Watch_Credits(video)
	if (settings.value.PARA?.speedSlider) PARA_SpeedSlider(video)
}
let lastIntroTime = -1
function resetLastIntroTime() {
	setTimeout(() => {
		lastIntroTime = -1
	}, 5000)
}
function PARA_Intro(video: HTMLVideoElement, time: number) {
	const button = document.querySelector("button.skip-button") as HTMLElement
	if (button && button.getAttribute("disabled") !== "") {
		const timeCheck = Math.floor(video?.currentTime ?? 0)
		if (typeof timeCheck === "number" && lastIntroTime != timeCheck) {
			lastIntroTime = timeCheck
			resetLastIntroTime()
			button.click()
			console.log("Intro skipped", button)
			setTimeout(function () {
				addSkippedTime(time, video?.currentTime, "IntroTimeSkipped")
			}, 600)
		}
	}
}
let lastCreditText = ""
async function resetLastCreditText(time = 1000) {
	// timeout of 1 second to make sure the button is not pressed too fast, it will crash or slow the website otherwise
	setTimeout(() => {
		lastCreditText = ""
	}, time)
}
function PARA_Credits(time: number) {
	const div = document.querySelector('div[class*="end-card-panel-"]') as HTMLElement
	if (div) {
		const button = div.querySelector("button.play-button") as HTMLElement
		// only skipping to next episode not an entirely new series
		const newEpNumber = div.querySelector("h2.sub-title") as HTMLElement
		const title = newEpNumber?.getAttribute("title") ?? ""
		if (lastCreditText != title && button) {
			lastCreditText = title
			resetLastCreditText()
			button.click()
			settings.value.Statistics.SegmentsSkipped++
			sendMessage("increaseBadge", {}, "background")
			console.log("skipped Credits", button)
		}
	}
}
function PARA_Watch_Credits(video: HTMLVideoElement) {
	const div = document.querySelector('div[class*="end-card-panel-"]') as HTMLElement
	const button = div?.querySelector("button.close-btn") as HTMLElement
	if (button) {
		button.click()
		settings.value.Statistics.SegmentsSkipped++
		sendMessage("increaseBadge", {}, "background")
		console.log("Watched Credits", button)
	}
}
const PARASliderStyle = "width:200px;display:none;"
const PARASpeedStyle = "font-size: 1.5em;width: 2em;color:#fff;cursor: pointer;"
const PARADivStyle = "height:48px;display: flex;align-items: center;align-self:center;"
async function PARA_SpeedSlider(video: HTMLVideoElement) {
	if (video) {
		const alreadySlider = document.querySelector("#videoSpeedSlider") as HTMLInputElement
		if (!alreadySlider) {
			const position = document.querySelector("div.controls-bottom-right") as HTMLElement
			if (position) createSlider(video, videoSpeed, position, PARASliderStyle, PARASpeedStyle, PARADivStyle)
		} else {
			// need to resync the slider with the video sometimes
			const speed = document.querySelector("#videoSpeed") as HTMLElement
			if (speed) {
				speed.onclick = function () {
					alreadySlider.style.display = alreadySlider.style.display === "block" ? "none" : "block"
				}
				watch(videoSpeed, (newValue) => {
					speed.textContent = newValue.toFixed(1) + "x"
					alreadySlider.value = (newValue * 10).toString()
				})
			}
			if (video.playbackRate != parseFloat(alreadySlider.value) / 10) {
				video.playbackRate = parseFloat(alreadySlider.value) / 10
			}
			alreadySlider.oninput = function () {
				if (speed) speed.textContent = (parseFloat(alreadySlider.value) / 10).toFixed(1) + "x"
				video.playbackRate = parseFloat(alreadySlider.value) / 10
			}
		}
	}
}
async function PARA_SpeedKeyboard() {
	// const steps = settings.value.General.sliderSteps / 10
	// document.addEventListener("keydown", (event: KeyboardEvent) => {
	// 	const video = document.querySelector("video") as HTMLVideoElement
	// 	if (!video) return
	// 	if (event.key === "d") {
	// 		video.playbackRate = Math.min(video.playbackRate + steps * 2, settings.value.General.sliderMax / 10)
	// 		videoSpeed.value = video.playbackRate
	// 	} else if (event.key === "s") {
	// 		video.playbackRate = Math.max(video.playbackRate - steps * 2, 0.6)
	// 		videoSpeed.value = video.playbackRate
	// 	}
	// })
}

async function PARA_doubleClick() {
	if (settings.value.Video?.doubleClick) {
		// event listener for double click
		document.ondblclick = function () {
			const fullscreenButton = document.querySelector("button.btn-fullscreen") as HTMLElement
			fullscreenButton?.click()
		}
	} else {
		document.ondblclick = null
	}
}
// #endregion

startPARA()
