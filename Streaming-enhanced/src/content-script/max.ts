import { startSharedFunctions, createSlider } from "@/content-script/shared-functions"
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
async function startHBO() {
	await promise
	logStartOfAddon()
	startSharedFunctions(Platforms.HBO)
	HBOObserver.observe(document, config)
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
		increaseBadge()
	}
}

// #region HBO
// HBO functions
const HBOObserver = new MutationObserver(HBO)
async function HBO() {
	const video: HTMLVideoElement = document.querySelector("video") as HTMLVideoElement
	const time = video?.currentTime
	if (settings.value.HBO?.skipIntro) HBO_Intro(video, time)
	if (settings.value.HBO?.skipCredits) HBO_Credits(time)
	if (settings.value.HBO?.watchCredits) HBO_Watch_Credits(video)
	if (settings.value.HBO?.speedSlider) HBO_SpeedSlider(video)
}
function HBO_Intro(video: HTMLVideoElement, time: number) {
	const button = document.querySelector('[class*="SkipButton-Beam-Web-Ent"]') as HTMLElement
	if (button?.checkVisibility({ visibilityProperty: true })) {
		button.click()
		console.log("Intro skipped", button)
		setTimeout(function () {
			addSkippedTime(time, video?.currentTime, "IntroTimeSkipped")
		}, 600)
	}
}
function HBO_Credits(time: number) {
	const button = document.querySelector('[class*="UpNextButton-Beam-Web-Ent"]') as HTMLElement
	if (button && lastAdTimeText < time - 1) {
		lastAdTimeText = time
		button.click()
		settings.value.Statistics.SegmentsSkipped++
		sendMessage("increaseBadge", {}, "background")
		console.log("Credits skipped", button)
	}
}
function HBO_Watch_Credits(video: HTMLVideoElement) {
	let button = document.querySelector('[class*="DismissButton-Beam-Web-Ent"]') as HTMLElement
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
const HBOSliderStyle = "height: 1em;background: rgb(221, 221, 221);display: none;width:200px;"
const HBOSpeedStyle = "font-size: 1.5em;color:#b2b2b2;"
const HBODivStyle = "height:48px;display: flex;align-items: center;"
async function HBO_SpeedSlider(video: HTMLVideoElement) {
	const alreadySlider = document.querySelector("#videoSpeedSlider")
	if (!alreadySlider) {
		// infobar position for the slider to be added
		const position = document.querySelector('[class*="ControlsFooterBottomRight-Beam-Web-Ent"]') as HTMLElement
		if (position) createSlider(video, videoSpeed, position, HBOSliderStyle, HBOSpeedStyle, HBODivStyle)
	}
}
// #endregion

startHBO()
