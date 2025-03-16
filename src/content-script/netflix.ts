import { sendMessage } from "webext-bridge/content-script"
import { startSharedFunctions, createSlider, Platforms } from "@/content-script/shared-functions"

startSharedFunctions(Platforms.Netflix)
// Global Variables

const { data: settings, promise } = useBrowserSyncStorage<settingsType>("settings", defaultSettings)
const ua = navigator.userAgent
let lastAdTimeText: number | string = 0
const videoSpeed: Ref<number> = ref(1)
const isEdge = /edg/i.test(ua)
const config = { attributes: true, childList: true, subtree: true }
async function logStartOfAddon() {
	console.log("%cStreaming enhanced", "color: #00aeef;font-size: 2em;")
	console.log("Settings", settings.value)
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

async function resetLastATimeText(time = 1000) {
	// timeout of 1 second to make sure the button is not pressed too fast, it will crash or slow the website otherwise
	setTimeout(() => {
		lastAdTimeText = 0
	}, time)
}

async function startNetflix() {
	await promise
	logStartOfAddon()
	if (settings.value.Netflix?.profile) AutoPickProfile()
	if (settings.value.Netflix?.skipAd) Netflix_SkipAdInterval()
	NetflixObserver.observe(document, config)
}

// #region Netflix
// Netflix Observer
const NetflixObserver = new MutationObserver(Netflix)
function Netflix() {
	const video = document.querySelector("video")
	const NSettings = settings.value.Netflix
	if (NSettings?.profile) Netflix_profile()
	if (NSettings?.skipIntro) {
		if (Netflix_General('[data-uia="player-skip-intro"]', "Intro skipped", false)) {
			if (video) {
				const time = video?.currentTime
				setTimeout(function () {
					addSkippedTime(time, video?.currentTime, "IntroTimeSkipped")
				}, 600)
			}
		}
	}
	if (NSettings?.skipRecap) {
		if (
			Netflix_General('[data-uia="player-skip-recap"]', "Recap skipped", false) ||
			Netflix_General('[data-uia="player-skip-preplay"]', "Recap skipped", false)
		) {
			if (video) {
				const time = video?.currentTime
				setTimeout(function () {
					addSkippedTime(time, video?.currentTime, "RecapTimeSkipped")
				}, 600)
			}
		}
	}
	if (NSettings?.skipCredits) {
		Netflix_General('[data-uia="next-episode-seamless-button-draining"]', "Credits skipped")
		// if (!Netflix_General('[data-uia="next-episode-seamless-button-draining"]', "Credits skipped draining")) {
		// 	Netflix_General('[data-uia="next-episode-seamless-button"]', "Credits skipped regular")
		// }
	}
	if (NSettings?.watchCredits) Netflix_General('[data-uia="watch-credits-seamless-button"]', "Credits watched")
	if (NSettings?.skipBlocked) Netflix_General('[data-uia="interrupt-autoplay-continue"]', "Blocked skipped")
	if (NSettings?.speedSlider && video) Netflix_SpeedSlider(video)
	if (settings.value.Video?.scrollVolume && video) Netflix_scrollVolume(video)
	if (NSettings?.removeGames) Netflix_removeGames()
}
async function Netflix_scrollVolume(video: HTMLVideoElement) {
	const volumeControl = document.querySelector('[data-uia*="control-volume"] div:not(.enhanced)') as HTMLElement
	if (volumeControl) {
		volumeControl.classList.add("enhanced")
		const handleVolumeControl = (event: WheelEvent) => {
			let volume = video.volume
			if (event.deltaY < 0) volume = Math.min(1, volume + 0.1)
			else volume = Math.max(0, volume - 0.1)
			video.volume = volume
		}
		volumeControl?.removeEventListener("wheel", handleVolumeControl)
		volumeControl?.addEventListener("wheel", handleVolumeControl)
	}
}
// to parse html umlaut symbols like &auml; to ä
function decodeHtmlEntities(str: string) {
	return new DOMParser().parseFromString("<!doctype html><body>" + str, "text/html").body.textContent
}
function Netflix_profile() {
	// AutoPickProfile();
	const currentProfile = document.querySelector("[href*='/YourAccount']")
	if (currentProfile) {
		// there is a space before the - thats why slice -1
		const currentProfileName = decodeHtmlEntities(
			currentProfile?.getAttribute("aria-label")?.split("–")?.[0].split("-")?.[0].slice(0, -1) ?? "",
		)
		if (currentProfileName && currentProfileName !== settings.value.General.profileName) {
			// small profile picture
			settings.value.General.profilePicture = (currentProfile?.firstChild?.firstChild as HTMLImageElement)?.src
			console.log("Profile switched to", currentProfileName, settings.value.General?.profilePicture)
			settings.value.General.profileName = currentProfileName
			console.log("Profile switched to", currentProfileName)
		}
	}
}
function AutoPickProfile() {
	if (!window.location.pathname.includes("Profile") && !window.location.pathname.includes("profile")) {
		const profileButtons = document.querySelectorAll(".profile-name")
		profileButtons.forEach((button) => {
			if (button.textContent === settings.value.General.profileName) {
				// big profile picture
				// slice(4, -1) to remove the url(" ") from the string
				settings.value.General.profilePicture = (
					button?.parentElement?.firstChild?.firstChild as HTMLElement
				)?.style?.backgroundImage?.slice(5, -2)
				button?.parentElement?.click()
				console.log("Profile automatically chosen:", settings.value.General.profileName)
				settings.value.Statistics.SegmentsSkipped++
				sendMessage("increaseBadge", {}, "background")
			}
		})
	}
}
function Netflix_General(selector: string, name: string, incBadge = true) {
	const button = document.querySelector(selector) as HTMLElement
	if (button) {
		console.log(name, button)
		button.click()
		if (incBadge) settings.value.Statistics.SegmentsSkipped++
		sendMessage("increaseBadge", {}, "background")
		return true
	}
	return false
}
function Netflix_SkipAdInterval() {
	const AdInterval = setInterval(() => {
		if (!settings.value.Netflix?.skipAd) {
			console.log("stopped observing| Ad")
			clearInterval(AdInterval)
			return
		}
		const video = document.querySelector("video")
		// .default-ltr-cache-mmvz9h or ltr-mmvz9h
		const adLength = Number(document.querySelector('span[class*="mmvz9h"]')?.textContent)
		// 16 max but too fast
		if (video) {
			let playBackRate = 8
			if (isEdge) playBackRate = 3
			if ((adLength || lastAdTimeText) && video.paused) {
				video.play()
			}
			if (adLength > 8 && video.playbackRate != playBackRate) {
				console.log("Ad skipped, length:", adLength, "s")
				settings.value.Statistics.NetflixAdTimeSkipped += adLength
				settings.value.Statistics.SegmentsSkipped++
				sendMessage("increaseBadge", {}, "background")
				if (settings.value.Video.epilepsy) video.style.opacity = "0"
				video.muted = true
				video.playbackRate = playBackRate
				lastAdTimeText = adLength
			} else if (adLength > 2 && video.playbackRate < 2) {
				video.playbackRate = adLength / 2
				lastAdTimeText = adLength
			} // added lastAdTimeText because other speedsliders are not working anymore
			else if (adLength <= 2 || (!adLength && lastAdTimeText)) {
				// videospeed is speedSlider value
				video.muted = false
				video.playbackRate = videoSpeed.value
				lastAdTimeText = 0
				if (settings.value.Video.epilepsy) video.style.opacity = "1"
			}
		}
		// pause video shows ad
		// sherlock show comes alot.
		const div = document.querySelector('div[data-uia="pause-ad-title-display"]')
		const button = document.querySelector('button[data-uia="pause-ad-expand-button"]') as HTMLElement
		if (
			button &&
			div?.checkVisibility({ opacityProperty: true }) &&
			(!video || (video.paused && lastAdTimeText != video.currentTime / 10))
		) {
			if (video) lastAdTimeText = video.currentTime / 10
			resetLastATimeText()
			button.click()
			console.log("Remove Video Paused ad", button)
			settings.value.Statistics.SegmentsSkipped++
			sendMessage("increaseBadge", {}, "background")
			setTimeout(() => {
				// not always a video is showing on next episode apparently
				const v = video || document.querySelector("video")
				v?.pause()
			}, 100)
		}
	}, 100)
}
const NetflixSliderStyle = "display: none;width:200px;"
const NetflixSpeedStyle = "font-size: 3em;padding: 0 5px;margin: unset;align-content: center;"
function Netflix_SpeedSlider(video: HTMLVideoElement) {
	// only add speed slider on lowest subscription tier
	// && !document.querySelector('[data-uia="control-speed"]')
	const alreadySlider = document.querySelector("#videoSpeedSlider")
	if (!alreadySlider) {
		const p = (document.querySelector('[data-uia="controls-standard"]')?.firstChild as HTMLElement)?.children
		if (p) {
			// infobar position for the slider to be added
			const position = p[p.length - 2]?.firstChild?.lastChild as HTMLElement
			if (position) createSlider(video, videoSpeed, position, NetflixSliderStyle, NetflixSpeedStyle)
		}
	}
}
function Netflix_removeGames() {
	const gamesRow = document.querySelector("div.mobile-games-row")
	if (gamesRow) {
		gamesRow.remove()
		console.log("Netflix removed games")
		settings.value.Statistics.SegmentsSkipped++
		sendMessage("increaseBadge", {}, "background")
	}
}
// #endregion

startNetflix()
