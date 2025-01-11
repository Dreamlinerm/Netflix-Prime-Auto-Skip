import {
	log,
	increaseBadge,
	optionsStore,
	checkStoreReady,
	Platforms,
	logStartOfAddon,
	config,
	addSkippedTime,
} from "@/utils/helper"
import { startSharedFunctions, parseAdTime, createSlider } from "@/content-script/shared-functions"
startSharedFunctions(Platforms.Disney)
// Global Variables

const { settings } = storeToRefs(optionsStore)
const hostname = window.location.hostname
const isDisney = /disneyplus|starplus/i.test(hostname)
const isHotstar = /hotstar/i.test(hostname)
const isStarPlus = /starplus/i.test(hostname)
let lastAdTimeText: number | string = 0
async function resetLastATimeText(time = 1000) {
	// timeout of 1 second to make sure the button is not pressed too fast, it will crash or slow the website otherwise
	setTimeout(() => {
		lastAdTimeText = 0
	}, time)
}
const videoSpeed: Ref<number> = ref(1)
async function startDisney() {
	await checkStoreReady(settings)
	logStartOfAddon(Platforms.Disney)
	if (isHotstar) Hotstar_doubleClick()
	DisneyObserver.observe(document, config)
	setInterval(function () {
		const video = Array.from(document.querySelectorAll("video")).find((v) => v.checkVisibility()) as HTMLVideoElement
		if (settings.value.Disney?.skipAd) Disney_skipAd(video)
	}, 300)
}

// #region Disney
// Disney Observers
const DisneyObserver = new MutationObserver(Disney)
function Disney() {
	// first ad not first video
	const video = Array.from(document.querySelectorAll("video")).find((v) => v.checkVisibility()) as HTMLVideoElement
	const time = video?.currentTime
	if (settings.value.Disney?.skipIntro) Disney_Intro(video, time)
	Disney_skipCredits(time)
	if (settings.value.Disney?.watchCredits) Disney_Watch_Credits()
	if (settings.value.Disney?.speedSlider) Disney_SpeedSlider(video)
	if (isDisney) {
		Disney_addHomeButton()
		if (settings.value.Disney?.selfAd) Disney_selfAd(video, time)
	}
	if (settings.value.Video?.scrollVolume) Disney_scrollVolume(video)
}
async function Disney_skipAd(video: HTMLVideoElement) {
	if (video) {
		const adTimeText = document.querySelector("div.overlay_interstitials__content_time_display")
		if (adTimeText) {
			const adTime = parseAdTime(adTimeText?.textContent)
			if (adTime && adTime >= 1 && lastAdTimeText != video.currentTime) {
				if (lastAdTimeText == 0) {
					log("Disney Ad skipped, length:", adTime, "s")
					settings.value.Statistics.DisneyAdTimeSkipped += adTime
					increaseBadge()
				}
				lastAdTimeText = video.currentTime
				video.currentTime += adTime
			}
		} else lastAdTimeText = 0
		// remove das video wird nach der pause fortgesetzt text after skipping ad
		const continueText = document.querySelector("p.toast-notification__text[aria-hidden='true']")
		if (continueText?.checkVisibility()) {
			continueText.remove()
			increaseBadge()
		}
	}
}
async function Disney_scrollVolume(video: HTMLVideoElement) {
	const volumeControl = document.querySelector("div.audio-control:not(.enhanced)") as HTMLElement
	if (volumeControl) {
		volumeControl.classList.add("enhanced")
		volumeControl?.addEventListener("wheel", (event: WheelEvent) => {
			let volume = video.volume
			if (event.deltaY < 0) volume = Math.min(1, volume + 0.1)
			else volume = Math.max(0, volume - 0.1)
			video.volume = volume
			const sliderContainer = volumeControl.querySelector(".slider-container")
			const sliderChildren = (sliderContainer?.firstChild as HTMLElement)?.children
			if (sliderChildren.length > 2) {
				const firstChild = sliderChildren[1] as HTMLElement
				const secondChild = sliderChildren[2] as HTMLElement
				firstChild.style.strokeDashoffset = 100 - volume * 100 + "px"
				firstChild.style.height = volume * 100 + "%"
				secondChild.style.height = volume * 100 + "%"
			}
		})
	}
}

async function Disney_Intro(video: HTMLVideoElement, time: number) {
	// intro star wars andor Season 1 episode 2
	// Recap Criminal Minds Season 1 Episode 2
	let button: HTMLElement | undefined
	if (isDisney) {
		const skipCreditsButton = isStarPlus
			? document.querySelector('[data-gv2elementkey="playNext"]')
			: document.querySelector('[data-testid="playback-action-button"]')
		if (!skipCreditsButton) button = document.querySelector(".skip__button") as HTMLElement
	} else
		button = document
			.evaluate("//span[contains(., 'Skip Intro')]", document, null, XPathResult.ANY_TYPE, null)
			?.iterateNext()?.parentElement as HTMLElement
	if (button) {
		button.click()
		log("Intro/Recap skipped", button)
		setTimeout(function () {
			addSkippedTime(time, video?.currentTime, "IntroTimeSkipped")
		}, 600)
	}
}
async function Disney_skipCredits(currentTime: number) {
	let button: HTMLElement
	if (isStarPlus) button = document.querySelector('[data-gv2elementkey="playNext"]') as HTMLElement
	else if (isDisney && !document.querySelector('[data-testid="playback-action-button"]'))
		button = document.querySelector('[data-testid="icon-restart"]')?.parentElement as HTMLElement
	else
		button = document
			.evaluate("//span[contains(., 'Next Episode')]", document, null, XPathResult.ANY_TYPE, null)
			?.iterateNext()?.parentElement as HTMLElement
	if (button) {
		// time is to avoid clicking too fast
		const time = currentTime
		if (time && lastAdTimeText != time) {
			const videoFullscreen = document.fullscreenElement !== null
			lastAdTimeText = time
			if (settings.value.Disney?.skipCredits) {
				button.click()
				log("Credits skipped", button)
				increaseBadge()
				resetLastATimeText()
			}
			if (!isHotstar) {
				// keep video fullscreen
				setTimeout(function () {
					if (videoFullscreen && document.fullscreenElement == null) {
						chrome.runtime.sendMessage({ type: "fullscreen" })
						function resetFullscreen() {
							chrome.runtime.sendMessage({ type: "exitFullscreen" })
							log("exitFullscreen")
							removeEventListener("fullscreenchange", resetFullscreen)
						}
						addEventListener("fullscreenchange", resetFullscreen)
						document.onkeydown = function (evt) {
							if ("key" in evt && (evt.key === "Escape" || evt.key === "Esc")) {
								chrome.runtime.sendMessage({ type: "exitFullscreen" })
							}
						}
						log("fullscreen")
					}
				}, 1000)
			}
		}
	}
}
async function Disney_addHomeButton() {
	// add home button to the end of the credits
	const buttonDiv = document.querySelector('[data-testid="browser-action-button"]')?.parentElement
	if (buttonDiv && !document.querySelector("#homeButton")) {
		const homeButton = document.createElement("button")
		homeButton.textContent = browser.i18n.getMessage("HomeButton")
		homeButton.id = "homeButton"
		homeButton.style.cssText =
			'color: white;background-color: #40424A;border: rgb(64, 66, 74);border-radius: 5px;padding: 0 2px 0 2px;height: 56px;padding-left: 24px;padding-right: 24px;letter-spacing: 1.76px;font-size: 15px;  text-transform: uppercase;cursor: pointer;font-family:"Avenir-World-for-Disney-Demi", sans-serif;'
		// add hover effect
		homeButton.onmouseover = function () {
			homeButton.style.backgroundColor = "#474a53"
		}
		homeButton.onmouseout = function () {
			homeButton.style.backgroundColor = "#40424A"
		}
		homeButton.onclick = function () {
			window.location.href = "/"
		}
		buttonDiv.appendChild(homeButton)
	}
}
async function Disney_Watch_Credits() {
	let button: Element | null | undefined
	if (isStarPlus) button = document.querySelector('[data-gv2elementkey="playNext"]')
	else if (isDisney && !document.querySelector('[data-testid="playback-action-button"]'))
		button = document.querySelector('[data-testid="icon-restart"]')?.parentElement
	else
		button = document
			.evaluate("//span[contains(., 'Next Episode')]", document, null, XPathResult.ANY_TYPE, null)
			?.iterateNext()?.parentElement as HTMLElement
	if (button) {
		// only skip if the next video is the next episode of a series (there is a timer)
		let time
		if (isDisney) time = /\d+/.exec(button?.textContent ?? "")?.[0]
		if (
			(isHotstar &&
				!document
					.evaluate("//span[contains(., 'My Space')]", document, null, XPathResult.ANY_TYPE, null)
					?.iterateNext()) ||
			(time && lastAdTimeText != time)
		) {
			const video = document.querySelector("video")
			if (video) {
				video.click()
				lastAdTimeText = time ?? 0
				log("Credits Watched", button)
				increaseBadge()
				resetLastATimeText()
			}
		}
	}
}

const DisneySliderStyle = "pointer-events: auto;background: rgb(221, 221, 221);display: none;width:200px;"
const DisneySpeedStyle =
	"height:10px;min-width:40px;color:#f9f9f9;pointer-events: auto;position: relative;bottom: 8px;padding: 0 5px;"
async function Disney_SpeedSlider(video: HTMLVideoElement) {
	if (video) {
		const alreadySlider: HTMLInputElement | null = document.querySelector("#videoSpeedSlider")
		if (!alreadySlider) {
			// infobar position for the slider to be added
			let position: HTMLElement | null
			if (isDisney) position = document.querySelector(".controls__right")
			else
				position = document.querySelector(".icon-player-landscape")?.parentElement?.parentElement?.parentElement
					?.parentElement as HTMLElement
			if (position) createSlider(video, videoSpeed, position, DisneySliderStyle, DisneySpeedStyle)
		} else {
			// need to resync the slider with the video sometimes
			const speed = document.querySelector("#videoSpeed")
			if (video.playbackRate !== parseFloat(alreadySlider.value) / 10) {
				video.playbackRate = parseFloat(alreadySlider.value) / 10
			}
			alreadySlider.oninput = function () {
				const sliderValue = parseFloat(alreadySlider.value)
				if (speed) speed.textContent = (sliderValue / 10).toFixed(1) + "x"
				video.playbackRate = sliderValue / 10
				videoSpeed.value = sliderValue / 10
			}
		}
	}
}

async function Disney_selfAd(video: HTMLVideoElement, time: number) {
	if (isDisney) {
		const button: HTMLElement | null = document.querySelector(".overlay_interstitials__promo_skip_button")
		if (button) {
			button.click()
			log("SelfAd skipped", button)
			setTimeout(function () {
				addSkippedTime(time, video?.currentTime, "DisneyAdTimeSkipped")
			}, 600)
		}
	}
}

async function Hotstar_doubleClick() {
	if (settings.value.Video?.doubleClick) {
		// event listener for double click
		document.ondblclick = function () {
			document.querySelector(".icon-player-landscape")?.closest("button")?.click()
			document.querySelector(".icon-player-portrait")?.closest("button")?.click()
		}
	} else {
		document.ondblclick = null
	}
}
// #endregion

startDisney()
