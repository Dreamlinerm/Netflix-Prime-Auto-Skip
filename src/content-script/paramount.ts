import { startSharedFunctions, createSlider, Platforms } from "@/content-script/shared-functions"
import { sendMessage } from "webext-bridge/content-script"
// Global Variables

const { data: settings, promise } = useBrowserSyncStorage<settingsType>("settings", defaultSettings)
const videoSpeed: Ref<number> = ref(1)
let lastAdTimeText: number = 0
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
	if (button?.getAttribute("disabled") !== "") {
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

function PARA_Credits(time: number) {
	const button = document.querySelector('button[class*="UpNextButton-"]') as HTMLElement
	if (button && lastAdTimeText < time - 1) {
		lastAdTimeText = time
		button.click()
		settings.value.Statistics.SegmentsSkipped++
		sendMessage("increaseBadge", {}, "background")
		console.log("Credits skipped", button)
	}
}
function PARA_Watch_Credits(video: HTMLVideoElement) {
	let button = document.querySelector('button[class*="DismissButton-"]') as HTMLElement
	if (button) {
		button.click()
		settings.value.Statistics.SegmentsSkipped++
		sendMessage("increaseBadge", {}, "background")
		console.log("Watched Credits", button)
	}
	// is movie
	button = document.querySelector(".player-shrink-transition-enter-done") as HTMLElement
	if (video && button) {
		video.click()
		settings.value.Statistics.SegmentsSkipped++
		sendMessage("increaseBadge", {}, "background")
		console.log("Watched Credits", button)
	}
}
const PARASliderStyle = "height: 1em;background: rgb(221, 221, 221);display: none;width:200px;"
const PARASpeedStyle = "font-size: 1.5em;color:#b2b2b2;"
const PARADivStyle = "height:48px;display: flex;align-items: center;"
async function PARA_SpeedSlider(video: HTMLVideoElement) {
	const alreadySlider = document.querySelector("#videoSpeedSlider")
	if (!alreadySlider) {
		// infobar position for the slider to be added
		const position = document.querySelector('div[class*="ControlsFooterBottomRight-"]') as HTMLElement
		if (position) createSlider(video, videoSpeed, position, PARASliderStyle, PARASpeedStyle, PARADivStyle)
	}
}
async function PARA_SpeedKeyboard() {
	const steps = settings.value.General.sliderSteps / 10
	document.addEventListener("keydown", (event: KeyboardEvent) => {
		const video = document.querySelector("video") as HTMLVideoElement
		if (!video) return
		if (event.key === "d") {
			video.playbackRate = Math.min(video.playbackRate + steps * 2, settings.value.General.sliderMax / 10)
			videoSpeed.value = video.playbackRate
		} else if (event.key === "s") {
			video.playbackRate = Math.max(video.playbackRate - steps * 2, 0.6)
			videoSpeed.value = video.playbackRate
		}
	})
}
// #endregion

startPARA()
