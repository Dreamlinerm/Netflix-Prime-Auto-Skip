import {
	log,
	increaseBadge,
	optionsStore,
	checkStoreReady,
	Platforms,
	logStartOfAddon,
	config,
	addSkippedTime,
	parseAdTime,
	createSlider,
} from "@/utils/helper"
logStartOfAddon(Platforms.Amazon)
// Global Variables

const { settings } = storeToRefs(optionsStore)

async function startAmazon() {
	await checkStoreReady(settings)
	const Amazon = settings.value.Amazon
	AmazonSkipIntroObserver.observe(document, AmazonSkipIntroConfig)
	if (settings?.Video?.doubleClick) Amazon_doubleClick()
	AmazonObserver.observe(document, config)
	if (Amazon?.skipAd) Amazon_AdTimeout()
	if (Amazon?.blockFreevee) {
		// timeout of 100 ms because the ad is not loaded fast enough and the video will crash
		setTimeout(function () {
			Amazon_FreeveeTimeout()
		}, 1000)
	}
	if (Amazon?.continuePosition) setTimeout(() => Amazon_continuePosition(), 500)
	if (settings.Video?.userAgent && isMobile) Amazon_customizeMobileView()
}

// #region Amazon
// Amazon Observers
const AmazonVideoClass = ".dv-player-fullscreen video"
const AmazonObserver = new MutationObserver(Amazon)

function Amazon() {
	if (settings.Amazon?.filterPaid) Amazon_FilterPaid()
	const video = document.querySelector(AmazonVideoClass)
	if (settings.Amazon?.skipCredits) Amazon_Credits()
	if (settings.Amazon?.watchCredits) Amazon_Watch_Credits()
	if (settings.Amazon?.speedSlider) Amazon_SpeedSlider(video)
	if (settings.Amazon?.xray) Amazon_xray()
	if (settings.Video?.scrollVolume) Amazon_scrollVolume()
}
const AmazonSkipIntroConfig = {
	attributes: true,
	attributeFilter: [".skipelement"],
	subtree: true,
	childList: true,
	attributeOldValue: false,
}
// const AmazonSkipIntro = new RegExp("skipelement", "i");
const AmazonSkipIntroObserver = new MutationObserver(Amazon_Intro)

async function Amazon_scrollVolume() {
	const volumeControl = document.querySelector('[aria-label="Volume"]:not(.enhanced)')
	if (volumeControl) {
		volumeControl.classList.add("enhanced")
		volumeControl?.addEventListener("wheel", (event) => {
			const video = document.querySelector(AmazonVideoClass)
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
	if (settings.Amazon?.skipIntro) {
		// skips intro and recap
		// recap on lucifer season 3 episode 3
		// intro lucifer season 3 episode 4
		let button = document.querySelector("[class*=skipelement]")
		if (button) {
			let video = document.querySelector(AmazonVideoClass)
			const time = video?.currentTime
			if (typeof time === "number" && lastIntroTime != parseInt(time)) {
				lastIntroTime = parseInt(time)
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
async function AmazonGobackbutton(video, startTime, endTime) {
	if (!reverseButton) {
		reverseButton = true
		// go back button
		const button = document.createElement("button")
		button.style = "padding: 0px 22px; line-height: normal; min-width: 0px;z-index:999;pointer-events:all;"
		button.setAttribute(
			"class",
			"fqye4e3 f1ly7q5u fk9c3ap fz9ydgy f1xrlb00 f1hy0e6n fgbpje3 f1uteees f1h2a8xb  f1cg7427 fiqc9rt fg426ew f1ekwadg",
		)
		button.setAttribute("data-uia", "reverse-button")
		button.textContent = browser.i18n.getMessage("WatchSkippedButton")
		document.querySelector(".atvwebplayersdk-action-buttons").appendChild(button)
		let buttonInHTML = document.querySelector('[data-uia="reverse-button"]')
		function goBack() {
			video.currentTime = startTime
			buttonInHTML.remove()
			log("stopped observing| Intro")
			AmazonSkipIntroObserver.disconnect()
			const waitTime = endTime - startTime + 2
			//log("waiting for:", waitTime);
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
async function Amazon_Credits() {
	const button = document.querySelector("[class*=nextupcard-button]")
	if (button) {
		// only skipping to next episode not an entirely new series
		const newEpNumber = document.querySelector("[class*=nextupcard-episode]")
		if (newEpNumber && !/(?<!\S)1(?!\S)/.exec(newEpNumber.textContent) && lastAdTimeText != newEpNumber.textContent) {
			lastAdTimeText = newEpNumber.textContent
			resetLastATimeText()
			button.click()
			increaseBadge()
			log("skipped Credits", button)
		}
	}
}
async function Amazon_Watch_Credits() {
	let button = document.querySelector("[class*=nextupcardhide-button]")
	if (button) {
		button.click()
		increaseBadge()
		log("Watched Credits", button)
	}
}
const AmazonSliderStyle = "height: 1em;background: rgb(221, 221, 221);display: none;width:200px;"
async function Amazon_SpeedSlider(video) {
	if (video) {
		let alreadySlider = document.querySelector(".dv-player-fullscreen #videoSpeedSlider")
		if (!alreadySlider) {
			// infobar position for the slider to be added
			let position = document.querySelector(".dv-player-fullscreen [class*=infobar-container]")?.firstChild?.lastChild
			if (position) createSlider(video, position, AmazonSliderStyle, "")
		} else {
			// need to resync the slider with the video sometimes
			let speed = document.querySelector(".dv-player-fullscreen #videoSpeed")
			if (video.playbackRate != alreadySlider.value / 10) {
				video.playbackRate = alreadySlider.value / 10
			}
			alreadySlider.oninput = function () {
				speed.textContent = (this.value / 10).toFixed(1) + "x"
				video.playbackRate = this.value / 10
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
			deletePaidCategory(a)
		})
	}
}
async function deletePaidCategory(a) {
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
	let AdInterval = setInterval(function () {
		if (!settings.Amazon.blockFreevee) {
			log("stopped observing| FreeVee Ad")
			clearInterval(AdInterval)
			return
		}
		let video = document.querySelector(AmazonVideoClass)
		if (video && !video.paused && video.currentTime > 0) {
			// && !video.paused
			skipAd(video)
		}
	}, 100)
}
function parseAdTime(adTimeText) {
	const adTime = parseInt(/:\d+/.exec(adTimeText)?.[0].substring(1)) + parseInt(/\d+/.exec(adTimeText)?.[0]) * 60
	if (isNaN(adTime)) return false
	return adTime
}
async function skipAd(video) {
	// Series grimm
	// there area multiple adtime texts, the dv-player-fullscreen is the correct one
	const adTimeText = document.querySelector(".dv-player-fullscreen .atvwebplayersdk-ad-timer-text")
	if (adTimeText?.checkVisibility()) {
		let adTime
		adTime = parseAdTime(adTimeText?.childNodes?.[0]?.textContent)
		if (!adTime) adTime = parseAdTime(adTimeText?.childNodes?.[1]?.textContent)
		// !document.querySelector(".fu4rd6c.f1cw2swo") so it doesn't try to skip when the self ad is playing
		if (!document.querySelector(".fu4rd6c.f1cw2swo") && adTime > 1 && !lastAdTimeText) {
			lastAdTimeText = adTime
			// biggest skiptime before crashing on amazon.com, can be little higher than 90 but 90 to be safe
			const bigTime = 90
			resetLastATimeText(adTime > bigTime ? 3000 : 1000)
			const skipTime = adTime > bigTime ? bigTime : adTime - 1
			video.currentTime += skipTime
			log("FreeVee Ad skipped, length:", skipTime, "s")
			settings.Statistics.AmazonAdTimeSkipped += skipTime
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
async function Amazon_AdTimeout() {
	// set loop every 1 sec and check if ad is there
	let AdInterval = setInterval(function () {
		if (!settings.Amazon.skipAd) {
			log("stopped observing| Self Ad")
			clearInterval(AdInterval)
			return
		}
		let video = document.querySelector(AmazonVideoClass)
		if (video) {
			video.onplay = function () {
				// if video is playing
				if (getComputedStyle(document.querySelector("#dv-web-player")).display != "none") {
					let button = document.querySelector(".fu4rd6c.f1cw2swo")
					if (button) {
						// only getting the time after :08
						let adTime = parseInt(
							/:\d+/.exec(document.querySelector(".atvwebplayersdk-adtimeindicator-text").innerHTML)?.[0].substring(1),
						)
						// wait for 100ms before skipping to make sure the button is not pressed too fast, or there will be infinite loading
						setTimeout(() => {
							button.click()
							if (typeof adTime === "number") settings.Statistics.AmazonAdTimeSkipped += adTime
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
		let meta = document.createElement("meta")
		meta.name = "viewport"
		meta.content = "width=device-width, initial-scale=1"
		document.head.appendChild(meta)

		// make amazon more mobile friendly
		let navBelt = document.querySelector("#nav-belt")
		if (navBelt) {
			navBelt.style.width = "100vw"
			navBelt.style.display = "flex"
			navBelt.style.flexDirection = "column"
			navBelt.style.height = "fit-content"
		}
		let navMain = document.querySelector("#nav-main")
		if (navMain) navMain.style.display = "none"
	}
}
async function Amazon_xray() {
	document.querySelector(".xrayQuickViewList")?.remove()
	// remove bad background hue which is annoying
	let b = document.querySelector(".fkpovp9.f8hspre:not(.enhanced)")
	if (b) {
		b.classList.add("enhanced")
		b.style.backgroundColor = "transparent"
		b.style.background = "transparent"
	}
}

async function Amazon_doubleClick() {
	if (settings.Video?.doubleClick) {
		// event listener for double click
		document.ondblclick = function () {
			document.querySelector(".dv-player-fullscreen button[class*=fullscreen-button]")?.click()
		}
	} else {
		document.ondblclick = null
	}
}
// #endregion

startAmazon()
