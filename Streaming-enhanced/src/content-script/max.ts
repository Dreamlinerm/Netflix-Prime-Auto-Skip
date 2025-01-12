import { startSharedFunctions, createSlider } from "@/content-script/shared-functions"
logStartOfAddon(Platforms.HBO)
// Global Variables

const { data: settings, promise } = useBrowserSyncStorage<settingsType>("settings", defaultSettings)
const videoSpeed: Ref<number> = ref(1)
let lastAdTimeText: number = 0

async function startHBO() {
	await promise
	startSharedFunctions(Platforms.HBO)
	HBOObserver.observe(document, config)
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
		increaseBadge()
		console.log("Credits skipped", button)
	}
}
function HBO_Watch_Credits(video: HTMLVideoElement) {
	let button = document.querySelector('[class*="DismissButton-Beam-Web-Ent"]') as HTMLElement
	if (button) {
		button.click()
		increaseBadge()
		console.log("Watched Credits", button)
	}
	// is movie
	button = document.querySelector(".player-shrink-transition-enter-done") as HTMLElement
	if (video && button) {
		video.click()
		increaseBadge()
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
