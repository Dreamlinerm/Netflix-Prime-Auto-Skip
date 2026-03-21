import { sendMessage } from "webext-bridge/content-script"
import { startSharedFunctions, parseAdTime, createSlider, Platforms } from "@/content-script/shared-functions"
// Global Variables

const { data: settings, promise } = useBrowserSyncStorage<settingsType>("settings", defaultSettings)
const ua = navigator.userAgent
const isMobile = /mobile|streamingEnhanced/i.test(ua)
let lastAdTimeText: number | string = 0
const videoSpeed: Ref<number> = ref(1)
const initialUrl = globalThis.location.href
const hostname = globalThis.location.hostname
const title = document.title
const isPrimeVideo = /amazon|primevideo/i.test(hostname) && (/video/i.test(title) || /video/i.test(initialUrl))
const config = { attributes: true, childList: true, subtree: true }
const AMAZON_PAID_CARD_SELECTOR = 'article[data-card-entitlement="Unentitled"]'
const AMAZON_STORE_ICON_SELECTOR = "svg.NbhXwl, [data-testid='entitlement-icon'] svg"
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

if (isPrimeVideo) {
	startSharedFunctions(Platforms.Amazon)
	startAmazon()
}

async function startAmazon() {
	await promise
	logStartOfAddon()
	if (settings.value?.Video?.doubleClick) Amazon_doubleClick()
	if (settings.value.Amazon?.speedSlider) Amazon_SpeedKeyboard()
	AmazonObserver.observe(document, config)
	if (settings.value.Amazon?.skipAd) {
		// timeout of 100 ms because the ad is not loaded fast enough and the video will crash
		setTimeout(function () {
			Amazon_FreeveeTimeout()
		}, 1000)
	}
	if (settings.value.Amazon?.continuePosition) setTimeout(() => Amazon_continuePosition(), 500)
	if (settings.value.Video?.userAgent && isMobile) Amazon_customizeMobileView()
	if (settings.value.Amazon?.improveUI) Amazon_improveUI()
}

// #region Amazon
// Amazon Observers
const AmazonVideoClass = ".dv-player-fullscreen video"
const AmazonObserver = new MutationObserver(Amazon)

function Amazon() {
	if (settings.value.Amazon?.filterPaid) Amazon_FilterPaid()
	const video = document.querySelector(AmazonVideoClass) as HTMLVideoElement
	if (settings.value.Amazon?.skipIntro) Amazon_Intro(video)
	if (settings.value.Amazon?.skipCredits) Amazon_Credits()
	if (settings.value.Amazon?.watchCredits) Amazon_Watch_Credits()
	if (settings.value.Amazon?.speedSlider) Amazon_SpeedSlider(video)
	// if (settings.value.Video?.scrollVolume) Amazon_scrollVolume()
}

// async function Amazon_scrollVolume() {
// 	const volumeControl = document.querySelector('[aria-label="Volume"]:not(.enhanced)') as HTMLElement
// 	if (volumeControl) {
// 		volumeControl.classList.add("enhanced")
// 		volumeControl?.addEventListener("wheel", (event: WheelEvent) => {
// 			const video = document.querySelector(AmazonVideoClass) as HTMLVideoElement
// 			if (!video) return
// 			let volume = video.volume
// 			if (event.deltaY < 0) volume = Math.min(1, volume + 0.1)
// 			else volume = Math.max(0, volume - 0.1)
// 			video.volume = volume
// 		})
// 	}
// }
let lastIntroTime = -1
function resetLastIntroTime() {
	setTimeout(() => {
		lastIntroTime = -1
	}, 5000)
}

function Amazon_Intro(video: HTMLVideoElement) {
	if (!reverseButtonClicked && lastIntroTime === -1) {
		// skips intro and recap
		// recap on lucifer season 3 episode 3
		// intro lucifer season 3 episode 4
		const button = document.querySelector(
			"button.f1xhgfrd.fg4c0o1.fxdt570.ff1ld61.f1cet4yo.f11un3wk.fe9afsx.fj0jixm.f1e5razt.fw6qvwa.f1vpdgub.f1g75y8b, button[aria-label='Vorspann überspringen'], button[aria-label='Skip Intro']",
		) as HTMLButtonElement
		if (button?.checkVisibility()) {
			const time = Math.floor(video?.currentTime ?? 0)
			lastIntroTime = time
			resetLastIntroTime()
			button.click()
			console.log("Intro skipped", button)
			//delay where the video is loaded
			setTimeout(function () {
				AmazonGobackbutton(video, button?.parentElement?.parentElement?.parentElement, time, video.currentTime)
				addSkippedTime(time, video.currentTime, "IntroTimeSkipped")
			}, 50)
		}
	}
}
let reverseButtonClicked = false
async function AmazonGobackbutton(
	video: HTMLVideoElement,
	position: HTMLElement | null | undefined,
	startTime: number,
	endTime: number,
) {
	if (position) {
		// go back button
		const button = document.createElement("button")
		button.style.cssText = "padding: 0px 22px; line-height: normal; min-width: 0px; z-index: 999; pointer-events: all;"
		button.setAttribute(
			"class",
			"fqye4e3 f1ly7q5u fk9c3ap fz9ydgy f1xrlb00 f1hy0e6n fgbpje3 f1uteees f1h2a8xb  f1cg7427 fiqc9rt fg426ew f1ekwadg",
		)
		button.dataset.uia = "reverse-button"
		//  browser.i18n.getMessage("WatchSkippedButton")
		button.textContent = "Rewind?"
		position?.appendChild(button)
		const buttonTimeout = setTimeout(() => {
			button?.remove()
		}, 5000)
		function goBack() {
			reverseButtonClicked = true
			video.currentTime = startTime
			button?.remove()
			clearTimeout(buttonTimeout)
			console.log("stopped observing| Intro")
			const waitTime = endTime - startTime + 2
			setTimeout(function () {
				reverseButtonClicked = false
			}, waitTime * 1000)
		}
		button.addEventListener("click", goBack)
	}
}
async function Amazon_Credits() {
	const button = document.querySelector(
		"button.f1h7p346.fl0ztaa.f1w91twd.f1hy0e6n.fgbpje3.fe9afsx.fj0jixm",
	) as HTMLElement
	if (button) {
		// only skipping to next episode not an entirely new series
		const newEpNumber = document.querySelector(".f14s8172.f615xjr.f1jlz00e") as HTMLElement
		if (
			// is series
			newEpNumber?.textContent &&
			// not different show.
			!/(?<!\S)1(?!\S)/.exec(newEpNumber.textContent) &&
			lastAdTimeText != newEpNumber.textContent
		) {
			lastAdTimeText = newEpNumber.textContent ?? ""
			resetLastATimeText()
			button.click()
			settings.value.Statistics.SegmentsSkipped++
			sendMessage("increaseBadge", {}, "background")
			console.log("skipped Credits", button)
		}
	}
}
async function Amazon_Watch_Credits() {
	const button = document.querySelector("button.fs9qhvw.fl0ztaa.f1w91twd") as HTMLElement
	if (button) {
		button.click()
		settings.value.Statistics.SegmentsSkipped++
		sendMessage("increaseBadge", {}, "background")
		console.log("Watched Credits", button)
	}
}
const AmazonSliderStyle = "height: 1em;background: rgb(221, 221, 221);display: none;width:200px;"
async function Amazon_SpeedSlider(video: HTMLVideoElement) {
	if (video) {
		const alreadySlider = document.querySelector(".dv-player-fullscreen #videoSpeedSlider") as HTMLInputElement
		const alreadySpeed = document.querySelector(".dv-player-fullscreen #videoSpeed") as HTMLElement
		const position = document.querySelector(".f1y5vpot")?.lastChild as HTMLElement
		if (!alreadySlider) {
			// infobar position for the slider to be added
			if (position) createSlider(video, videoSpeed, position, AmazonSliderStyle, "cursor: pointer;")
		} else if (position.classList.contains("fkt4e8w")) {
			alreadySlider.style.display = "none"
			alreadySpeed.style.display = "none"
		} else {
			alreadySlider.style.display = "block"
			alreadySpeed.style.display = "block"
		}
	}
}
async function Amazon_SpeedKeyboard() {
	const steps = settings.value.General.sliderSteps / 10
	document.addEventListener("keydown", (event: KeyboardEvent) => {
		const video = document.querySelector(AmazonVideoClass) as HTMLVideoElement
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

async function Amazon_continuePosition() {
	const continueCategory = document
		.querySelector(".fbl-progress-bar")
		?.closest('[data-testid="navigation-carousel-wrapper"]')
	const position = continueCategory?.parentNode?.childNodes?.[2]
	if (continueCategory && position) position.before(continueCategory)
}
const AMAZON_ALLOWED_FILTER_PATHS = /(storefront|genre|movie|amazon-video|\/tv|\/addons)/i
export function shouldRunAmazonPaidFilter(url: string) {
	return AMAZON_ALLOWED_FILTER_PATHS.test(url)
}

export function isStoreIconTitle(title: string | null | undefined) {
	return /store/i.test(title ?? "")
}

export function shouldRemoveWholePaidSection(visibleCardsCount: number, paidCardsCount: number, bannerOffset = 2) {
	// bannerOffset = 2 because sometimes there are title banners, wich are not paid content.
	if (visibleCardsCount <= 0 || paidCardsCount <= 0) return false
	return visibleCardsCount - bannerOffset <= paidCardsCount
}

async function Amazon_FilterPaid() {
	const currentUrl = window.location.href
	// only run in storefront-like pages where rows are rendered
	if (!shouldRunAmazonPaidFilter(currentUrl)) return

	const carouselRows = Array.from(
		document.querySelectorAll(
			"section[data-testid*='carousel'] ul:has(" +
				AMAZON_STORE_ICON_SELECTOR +
				"), ul:has(" +
				AMAZON_PAID_CARD_SELECTOR +
				")",
		),
	)
	carouselRows.forEach((a) => {
		deletePaidCategory(a as HTMLElement)
	})
}
function hasPaidMarker(element: ParentNode) {
	if (element.querySelector(AMAZON_PAID_CARD_SELECTOR)) return true
	return Array.from(element.querySelectorAll(AMAZON_STORE_ICON_SELECTOR)).some((icon) => {
		if (icon.classList.contains("NbhXwl")) return true
		const iconTitle = icon.querySelector("title")?.textContent ?? ""
		return isStoreIconTitle(iconTitle)
	})
}
async function deletePaidCategory(a: HTMLElement) {
	const visibleCards = Array.from(a.children).filter((child): child is HTMLElement => {
		return child instanceof HTMLElement && child.tagName === "LI" && child.dataset.hidden !== "true"
	})
	const paidCards = visibleCards.filter((card) => hasPaidMarker(card))
	if (paidCards.length === 0) return

	// if the section is mostly paid content delete it
	if (shouldRemoveWholePaidSection(visibleCards.length, paidCards.length)) {
		const section = a.closest("section")
		// console.log("Filtered paid category", section)
		section?.remove()
		settings.value.Statistics.SegmentsSkipped++
		sendMessage("increaseBadge", {}, "background")
	}
	// remove individual paid elements
	else {
		paidCards.forEach((b) => {
			// console.log("Filtered paid Element", b)
			b.remove()
			settings.value.Statistics.SegmentsSkipped++
			sendMessage("increaseBadge", {}, "background")
		})
	}
}
function Amazon_FreeveeTimeout() {
	// set loop every 1 sec and check if ad is there
	const AdInterval = setInterval(function () {
		if (!settings.value.Amazon.skipAd) {
			console.log("stopped observing| FreeVee Ad")
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
	const adTimeText = document.querySelector(".dv-player-fullscreen .atvwebplayersdk-ad-timer-remaining-time")
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
			console.log("FreeVee Ad skipped, length:", skipTime, "s")
			settings.value.Statistics.AmazonAdTimeSkipped += skipTime
			settings.value.Statistics.SegmentsSkipped++
			sendMessage("increaseBadge", {}, "background")
		}
	}
}
async function resetLastATimeText(time = 1000) {
	// timeout of 1 second to make sure the button is not pressed too fast, it will crash or slow the website otherwise
	setTimeout(() => {
		lastAdTimeText = 0
	}, time)
}

async function Amazon_customizeMobileView() {
	console.log("customizeMobileView")
	const currentUrl = globalThis.location.href
	// customize mobile view for desktop website
	// /gp/video/detail/ is the film description page otherwise looks weird
	if (!currentUrl.includes("/gp/video/detail/")) {
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
async function Amazon_doubleClick() {
	if (settings.value.Video?.doubleClick) {
		// event listener for double click
		document.ondblclick = function () {
			const FullscreenButton = document.querySelector(
				"button[aria-label*='Fullscreen'], button[aria-label*='Vollbild']",
			) as HTMLButtonElement
			FullscreenButton?.click()
		}
	} else {
		document.ondblclick = null
	}
}
let timer: NodeJS.Timeout
async function Amazon_improveUI() {
	// no more hover animation on scroll, because it is annoying.
	document.addEventListener("scroll", () => {
		document.body.style.pointerEvents = "none"
	})
	document.addEventListener("scrollend", () => {
		clearTimeout(timer)
		timer = setTimeout(() => {
			document.body.style.pointerEvents = "auto"
		}, 400)
	})
}
// #endregion
