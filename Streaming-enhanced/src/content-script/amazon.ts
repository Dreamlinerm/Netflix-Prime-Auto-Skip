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
logStartOfAddon(Platforms.Amazon)
// Global Variables

const { settings } = storeToRefs(optionsStore)
const ua = navigator.userAgent
const isMobile = /mobile|streamingEnhanced/i.test(ua)
let lastAdTimeText: number | string = 0
const videoSpeed: Ref<number> = ref(1)
const url = window.location.href
const hostname = window.location.hostname
const title = document.title
const isPrimeVideo = /amazon|primevideo/i.test(hostname) && (/video/i.test(title) || /video/i.test(url))

if (isPrimeVideo) {
	startSharedFunctions(Platforms.Amazon)
	startAmazon()
}

async function startAmazon() {
	await checkStoreReady(settings)
	AmazonSkipIntroObserver.observe(document, AmazonSkipIntroConfig)
	if (settings.value?.Video?.doubleClick) Amazon_doubleClick()
	AmazonObserver.observe(document, config)
	if (settings.value.Amazon?.selfAd) Amazon_selfAdTimeout()
	if (settings.value.Amazon?.skipAd) {
		// timeout of 100 ms because the ad is not loaded fast enough and the video will crash
		setTimeout(function () {
			Amazon_FreeveeTimeout()
		}, 1000)
	}
	if (settings.value.Amazon?.continuePosition) setTimeout(() => Amazon_continuePosition(), 500)
	if (settings.value.Video?.userAgent && isMobile) Amazon_customizeMobileView()
}

// #region Amazon
// Amazon Observers
const AmazonVideoClass = ".dv-player-fullscreen video"
const AmazonObserver = new MutationObserver(Amazon)

function Amazon() {
	if (settings.value.Amazon?.filterPaid) Amazon_FilterPaid()
	const video = document.querySelector(AmazonVideoClass) as HTMLVideoElement
	if (settings.value.Amazon?.skipCredits) Amazon_Credits()
	if (settings.value.Amazon?.watchCredits) Amazon_Watch_Credits()
	if (settings.value.Amazon?.speedSlider) Amazon_SpeedSlider(video)
	if (settings.value.Amazon?.xray) Amazon_xray()
	if (settings.value.Video?.scrollVolume) Amazon_scrollVolume()
}
const AmazonSkipIntroConfig = {
	attributes: true,
	attributeFilter: [".skipelement"],
	subtree: true,
	childList: true,
	attributeOldValue: false,
}
const AmazonSkipIntroObserver = new MutationObserver(Amazon_Intro)

async function Amazon_scrollVolume() {
	const volumeControl = document.querySelector('[aria-label="Volume"]:not(.enhanced)') as HTMLElement
	if (volumeControl) {
		volumeControl.classList.add("enhanced")
		volumeControl?.addEventListener("wheel", (event: WheelEvent) => {
			const video = document.querySelector(AmazonVideoClass) as HTMLVideoElement
			if (!video) return
			let volume = video.volume
			if (event.deltaY < 0) volume = Math.min(1, volume + 0.1)
			else volume = Math.max(0, volume - 0.1)
			video.volume = volume
		})
	}
}
let lastIntroTime = -1
function resetLastIntroTime() {
	setTimeout(() => {
		lastIntroTime = -1
	}, 5000)
}
function Amazon_Intro() {
	if (settings.value.Amazon?.skipIntro) {
		// skips intro and recap
		// recap on lucifer season 3 episode 3
		// intro lucifer season 3 episode 4
		const button = document.querySelector("[class*=skipelement]") as HTMLButtonElement
		if (button) {
			const video = document.querySelector(AmazonVideoClass) as HTMLVideoElement
			const time = video?.currentTime ?? 0
			if (typeof time === "number" && lastIntroTime != time) {
				lastIntroTime = time
				resetLastIntroTime()
				button.click()
				log("Intro skipped", button)
				//delay where the video is loaded
				setTimeout(function () {
					AmazonGobackbutton(video, time, video.currentTime)
					addSkippedTime(time, video.currentTime, "IntroTimeSkipped")
				}, 50)
			}
		}
	}
}
let reverseButton = false
async function AmazonGobackbutton(video: HTMLVideoElement, startTime: number, endTime: number) {
	if (!reverseButton) {
		reverseButton = true
		// go back button
		const button = document.createElement("button")
		button.style.cssText = "padding: 0px 22px; line-height: normal; min-width: 0px; z-index: 999; pointer-events: all;"
		button.setAttribute(
			"class",
			"fqye4e3 f1ly7q5u fk9c3ap fz9ydgy f1xrlb00 f1hy0e6n fgbpje3 f1uteees f1h2a8xb  f1cg7427 fiqc9rt fg426ew f1ekwadg",
		)
		button.setAttribute("data-uia", "reverse-button")
		button.textContent = browser.i18n.getMessage("WatchSkippedButton")
		document.querySelector(".atvwebplayersdk-action-buttons")?.appendChild(button)
		const buttonInHTML = document.querySelector('[data-uia="reverse-button"]')
		if (buttonInHTML) {
			function goBack() {
				video.currentTime = startTime
				if (buttonInHTML) buttonInHTML.remove()
				log("stopped observing| Intro")
				AmazonSkipIntroObserver.disconnect()
				const waitTime = endTime - startTime + 2
				setTimeout(function () {
					log("restarted observing| Intro")
					AmazonSkipIntroObserver.observe(document, AmazonSkipIntroConfig)
				}, waitTime * 1000)
			}
			buttonInHTML.addEventListener("click", goBack)
			setTimeout(() => {
				buttonInHTML.remove()
				reverseButton = false
			}, 5000)
		}
	}
}
async function Amazon_Credits() {
	const button = document.querySelector("[class*=nextupcard-button]") as HTMLElement
	if (button) {
		// only skipping to next episode not an entirely new series
		const newEpNumber = document.querySelector("[class*=nextupcard-episode]") as HTMLElement
		if (
			newEpNumber &&
			!/(?<!\S)1(?!\S)/.exec(newEpNumber?.textContent ?? "") &&
			lastAdTimeText != newEpNumber.textContent
		) {
			lastAdTimeText = newEpNumber.textContent ?? ""
			resetLastATimeText()
			button.click()
			increaseBadge()
			log("skipped Credits", button)
		}
	}
}
async function Amazon_Watch_Credits() {
	const button = document.querySelector("[class*=nextupcardhide-button]") as HTMLElement
	if (button) {
		button.click()
		increaseBadge()
		log("Watched Credits", button)
	}
}
const AmazonSliderStyle = "height: 1em;background: rgb(221, 221, 221);display: none;width:200px;"
async function Amazon_SpeedSlider(video: HTMLVideoElement) {
	if (video) {
		const alreadySlider = document.querySelector(".dv-player-fullscreen #videoSpeedSlider") as HTMLInputElement
		if (!alreadySlider) {
			// infobar position for the slider to be added
			const position = document.querySelector(".dv-player-fullscreen [class*=infobar-container]")?.firstChild
				?.lastChild as HTMLElement
			if (position) createSlider(video, videoSpeed, position, AmazonSliderStyle, "")
		} else {
			// need to resync the slider with the video sometimes
			const speed = document.querySelector(".dv-player-fullscreen #videoSpeed")
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

async function Amazon_continuePosition() {
	const continueCategory = document
		.querySelector('.j5ZgN-._0rmWBt[data-testid="card-overlay"]')
		?.closest('[class="+OSZzQ"]')
	const position = continueCategory?.parentNode?.childNodes?.[2]
	if (continueCategory && position) position.before(continueCategory)
}
async function Amazon_FilterPaid() {
	// if not on the shop page or homepremiere
	if (url.includes("storefront") || url.includes("genre") || url.includes("movie")) {
		// the yellow hand bag is the paid category .NbhXwl
		document.querySelectorAll("section[data-testid='standard-carousel'] ul:has(svg.NbhXwl)").forEach((a) => {
			deletePaidCategory(a as HTMLElement)
		})
	}
}
async function deletePaidCategory(a: HTMLElement) {
	// if the section is mostly paid content delete it
	// -2 because sometimes there are title banners
	if (
		a.children.length - a.querySelectorAll('[data-hidden="true"]').length - 2 <=
		a.querySelectorAll("[data-testid='card-overlay'] svg.NbhXwl").length
	) {
		const section = a.closest('[class="+OSZzQ"]')
		log("Filtered paid category", section)
		section?.remove()
		increaseBadge()
	}
	// remove individual paid elements
	else {
		a.querySelectorAll("li:has(svg.NbhXwl)").forEach((b) => {
			log("Filtered paid Element", b)
			b.remove()
			increaseBadge()
		})
	}
}
function Amazon_FreeveeTimeout() {
	// set loop every 1 sec and check if ad is there
	const AdInterval = setInterval(function () {
		if (!settings.value.Amazon.skipAd) {
			log("stopped observing| FreeVee Ad")
			clearInterval(AdInterval)
			return
		}
		const video = document.querySelector(AmazonVideoClass) as HTMLVideoElement
		if (video && !video.paused && video.currentTime > 0) {
			// && !video.paused
			skipAd(video)
		}
	}, 100)
}
async function skipAd(video: HTMLVideoElement) {
	// Series grimm
	// there area multiple adtime texts, the dv-player-fullscreen is the correct one
	const adTimeText = document.querySelector(".dv-player-fullscreen .atvwebplayersdk-ad-timer-text")
	if (adTimeText?.checkVisibility()) {
		let adTime
		adTime = parseAdTime(adTimeText?.childNodes?.[0]?.textContent)
		if (!adTime) adTime = parseAdTime(adTimeText?.childNodes?.[1]?.textContent)
		// !document.querySelector(".fu4rd6c.f1cw2swo") so it doesn't try to skip when the self ad is playing
		if (!document.querySelector(".fu4rd6c.f1cw2swo") && typeof adTime == "number" && adTime > 1 && !lastAdTimeText) {
			lastAdTimeText = adTime
			// biggest skiptime before crashing on amazon.com, can be little higher than 90 but 90 to be safe
			const bigTime = 90
			resetLastATimeText(adTime > bigTime ? 3000 : 1000)
			const skipTime = adTime > bigTime ? bigTime : adTime - 1
			video.currentTime += skipTime
			log("FreeVee Ad skipped, length:", skipTime, "s")
			settings.value.Statistics.AmazonAdTimeSkipped += skipTime
			increaseBadge()
		}
	}
}
async function resetLastATimeText(time = 1000) {
	// timeout of 1 second to make sure the button is not pressed too fast, it will crash or slow the website otherwise
	setTimeout(() => {
		lastAdTimeText = 0
	}, time)
}
async function Amazon_selfAdTimeout() {
	// set loop every 1 sec and check if ad is there
	const AdInterval = setInterval(function () {
		if (!settings.value.Amazon.selfAd) {
			log("stopped observing| Self Ad")
			clearInterval(AdInterval)
			return
		}
		const video = document.querySelector(AmazonVideoClass) as HTMLVideoElement
		if (video) {
			video.onplay = function () {
				// if video is playing
				const dvWebPlayer = document.querySelector("#dv-web-player")
				if (dvWebPlayer && getComputedStyle(dvWebPlayer).display != "none") {
					const button = document.querySelector(".fu4rd6c.f1cw2swo") as HTMLElement
					if (button) {
						// only getting the time after :08
						const adTime = parseInt(
							/:\d+/
								.exec(document.querySelector(".atvwebplayersdk-adtimeindicator-text")?.innerHTML ?? "")?.[0]
								?.substring(1) ?? "",
						)
						// wait for 100ms before skipping to make sure the button is not pressed too fast, or there will be infinite loading
						setTimeout(() => {
							button.click()
							if (typeof adTime === "number") settings.value.Statistics.AmazonAdTimeSkipped += adTime
							increaseBadge()
							log("Self Ad skipped, length:", adTime, button)
						}, 150)
					}
				}
			}
		}
	}, 100)
}

async function Amazon_customizeMobileView() {
	log("customizeMobileView")
	// customize mobile view for desktop website
	// /gp/video/detail/ is the film description page otherwise looks weird
	if (!url.includes("/gp/video/detail/")) {
		// add <meta name="viewport" content="width=device-width, initial-scale=1" /> to head
		const meta = document.createElement("meta")
		meta.name = "viewport"
		meta.content = "width=device-width, initial-scale=1"
		document.head.appendChild(meta)

		// make amazon more mobile friendly
		const navBelt = document.querySelector("#nav-belt") as HTMLElement
		if (navBelt) {
			navBelt.style.width = "100vw"
			navBelt.style.display = "flex"
			navBelt.style.flexDirection = "column"
			navBelt.style.height = "fit-content"
		}
		const navMain = document.querySelector("#nav-main") as HTMLElement
		if (navMain) navMain.style.display = "none"
	}
}
async function Amazon_xray() {
	document.querySelector(".xrayQuickViewList")?.remove()
	// remove bad background hue which is annoying
	const b = document.querySelector(".fkpovp9.f8hspre:not(.enhanced)") as HTMLElement
	if (b) {
		b.classList.add("enhanced")
		b.style.backgroundColor = "transparent"
		b.style.background = "transparent"
	}
}

async function Amazon_doubleClick() {
	if (settings.value.Video?.doubleClick) {
		// event listener for double click
		document.ondblclick = function () {
			const button = document.querySelector(".dv-player-fullscreen button[class*=fullscreen-button]") as HTMLElement
			button?.click()
		}
	} else {
		document.ondblclick = null
	}
}
// #endregion
