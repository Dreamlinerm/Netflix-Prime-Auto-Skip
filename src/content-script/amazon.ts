import { isPlaybackShortcut } from "@/utils/playbackKeyboard"
import { sendMessage } from "webext-bridge/content-script"
import {
	startSharedFunctions,
	parseAdTime,
	createSlider,
	Platforms,
	getCurrentEpisodeNumber,
} from "@/content-script/shared-functions"
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
	if (endTime > startTime) {
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
	watch(() => settings.value.Video.doubleClick, Amazon_doubleClick, { immediate: true })
	Amazon_SpeedKeyboard()
	AmazonObserver.observe(document, config)
	watch(
		() => settings.value.Amazon.skipAd,
		(enabled, _previous, onCleanup) => {
			if (!enabled) return
			let stop = () => {}
			const delay = setTimeout(() => {
				stop = Amazon_FreeveeTimeout()
			}, 1000)
			onCleanup(() => {
				clearTimeout(delay)
				stop()
				lastAdTimeText = 0
			})
		},
		{ immediate: true },
	)
	watch(
		() => settings.value.Amazon.selfAd,
		(enabled, _previous, onCleanup) => {
			if (enabled) onCleanup(Amazon_selfAdTimeout())
		},
		{ immediate: true },
	)
	if (settings.value.Video?.userAgent && isMobile) Amazon_customizeMobileView()
	watch(
		() => settings.value.Amazon.improveUI,
		(enabled, _previous, onCleanup) => {
			if (enabled) onCleanup(Amazon_improveUI())
		},
		{ immediate: true },
	)
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
	if (settings.value.Amazon?.xray) Amazon_xray()
	if (settings.value.Video?.scrollVolume) Amazon_scrollVolume()
}

async function Amazon_scrollVolume() {
	const volumeControl = document.querySelector(
		'[class*=volume]:is(button, div, input):not(.enhanced), [aria-label="Volume"]:not(.enhanced), [aria-label="Lautstärke"]:not(.enhanced), [aria-label="Volumen"]:not(.enhanced)',
	) as HTMLElement
	if (volumeControl) {
		volumeControl.classList.add("enhanced")
		volumeControl?.addEventListener("wheel", (event: WheelEvent) => {
			const video = document.querySelector(AmazonVideoClass) as HTMLVideoElement
			if (!video || !settings.value.Video.scrollVolume) return
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

function Amazon_Intro(video: HTMLVideoElement) {
	if (!video) return
	if (
		!reverseButtonClicked &&
		lastIntroTime === -1 &&
		getCurrentEpisodeNumber(document.querySelector('[data-testid="dp-atf-play-button"]')?.textContent) != 1
	) {
		// skips intro and recap
		// Supernatural S2 E3
		let button = document.querySelector("[class*=skipelement]") as HTMLButtonElement | undefined
		// Fallback match with textContent for other languages
		if (!button) {
			button = Array.from(document.querySelectorAll("button")).find((button) => {
				const buttonText = button.textContent!.replace(/\s+/g, " ").trim().toLowerCase()
				// langs covered by catchall intro:
				// buttonText === "skip intro" || // english
				// buttonText === "passer l'intro" || // français
				// buttonText === "salta intro" || // italiano
				// buttonText === "omitir introducción" || // español
				// buttonText === "avançar introdução" || // português
				// buttonText === "intro overslaan" || // nederlands

				return (
					buttonText === "vorspann überspringen" || // deutsch
					buttonText === "pular abertura" || // português brasil
					buttonText === "イントロをスキップ" || // 日本語
					buttonText === "pomiń wstęp" || // polski
					buttonText === "소개 건너뛰기" || // 한국어
					buttonText === "jeneriği atla" || // Türkçe
					buttonText === "laktawan ang intro" || // Wikang Filipino
					buttonText.includes("intro")
				)
			}) as HTMLButtonElement | undefined
		}

		if (button?.checkVisibility() && !document.querySelector("[class*=nextupcard-button]")) {
			const time = Math.floor(video.currentTime)
			lastIntroTime = time
			resetLastIntroTime()
			button.click()
			console.log("Intro skipped", button)
			//delay where the video is loaded
			setTimeout(function () {
				if (!video.isConnected || !settings.value.Amazon.skipIntro) return
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
	const button = document.querySelector("[class*=nextupcard-button]") as HTMLElement | undefined
	if (button) {
		// only skipping to next episode not an entirely new series
		const newEpNumber = document.querySelector("[class*=nextupcard-episode]") as HTMLElement
		if (
			// is series
			newEpNumber?.textContent &&
			// not different show.
			!/(?<!\S)1(?!\S)/.exec(newEpNumber.textContent) &&
			lastAdTimeText != newEpNumber.textContent
		) {
			lastAdTimeText = newEpNumber.textContent!
			resetLastATimeText()
			button.click()
			settings.value.Statistics.SegmentsSkipped++
			sendMessage("increaseBadge", {}, "background")
			console.log("skipped Credits", button)
		}
	}
}
async function Amazon_Watch_Credits() {
	const button = document.querySelector("[class*=nextupcardhide-button]") as HTMLElement
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
		let pauseButton = undefined
		const alreadySlider = document.querySelector(".dv-player-fullscreen #videoSpeedSlider") as HTMLInputElement
		if (!alreadySlider) {
			// infobar position for the slider to be added
			let position = document.querySelector(".dv-player-fullscreen [class*=infobar-container]")?.firstChild
				?.lastChild as HTMLElement
			//  AB/B test/ UI fallback
			if (!position) {
				pauseButton = document.querySelector("#atvwebplayersdk-play-pause-button") as HTMLElement
				position = pauseButton?.parentElement?.parentElement?.parentElement?.lastChild as HTMLElement
			}
			if (position) createSlider(video, videoSpeed, position, AmazonSliderStyle, "cursor: pointer;", "", pauseButton)
		} else {
			// need to resync the slider with the video sometimes
			const speed = document.querySelector(".dv-player-fullscreen #videoSpeed") as HTMLElement
			if (speed) {
				speed.onclick = function () {
					alreadySlider.style.display = alreadySlider.style.display === "block" ? "none" : "block"
				}
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
async function Amazon_SpeedKeyboard() {
	document.addEventListener(
		"keydown",
		(event: KeyboardEvent) => {
			if (!settings.value.Amazon.speedSlider || !isPlaybackShortcut(event)) return
			const steps = settings.value.General.sliderSteps / 10
			const video = document.querySelector(AmazonVideoClass) as HTMLVideoElement
			if (!video) return
			// Prime also uses S for subtitles. Consume handled keys before its player listeners.
			event.preventDefault()
			event.stopPropagation()
			if (event.key === "d") {
				video.playbackRate = Math.min(video.playbackRate + steps * 2, settings.value.General.sliderMax / 10)
				videoSpeed.value = video.playbackRate
			} else {
				video.playbackRate = Math.max(video.playbackRate - steps * 2, 0.6)
				videoSpeed.value = video.playbackRate
			}
		},
		true,
	)
}

const AMAZON_ALLOWED_FILTER_PATHS = /(storefront|genre|movie|amazon-video|\/tv|\/addons)/i
export function shouldRunAmazonPaidFilter(url: string) {
	try {
		return AMAZON_ALLOWED_FILTER_PATHS.test(new URL(url).pathname)
	} catch {
		return false
	}
}

export function isStoreIconTitle(title: string | null | undefined) {
	return /store/i.test(title ?? "")
}

export function shouldRemoveWholePaidSection(visibleCardsCount: number, paidCardsCount: number, bannerOffset = 0) {
	// bannerOffset = 0 because sometimes there are title banners, wich are not paid content.
	if (visibleCardsCount <= 0 || paidCardsCount <= 0) return false
	return visibleCardsCount - bannerOffset <= paidCardsCount
}

async function Amazon_FilterPaid() {
	const currentUrl = globalThis.location.href
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
		const video = document.querySelector(AmazonVideoClass) as HTMLVideoElement
		if (video && !video.paused && video.currentTime > 0) {
			// && !video.paused
			skipAd(video)
		}
	}, 100)
	return () => clearInterval(AdInterval)
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
function Amazon_selfAdTimeout() {
	const pending = new Set<ReturnType<typeof setTimeout>>()
	let handled: HTMLElement | null = null
	const inspect = () => {
		const video = document.querySelector<HTMLVideoElement>(AmazonVideoClass)
		const player = document.querySelector<HTMLElement>("#dv-web-player")
		const button = player?.querySelector<HTMLElement>(".fu4rd6c.f1cw2swo")
		if (!button || !button.checkVisibility() || !player || getComputedStyle(player).display === "none") {
			handled = null
			return
		}
		if (!settings.value.Amazon.selfAd || !video || video.paused || handled === button) return
		handled = button
		const adTime = parseAdTime(player.querySelector(".atvwebplayersdk-adtimeindicator-text")?.textContent ?? null)
		const timer = setTimeout(() => {
			pending.delete(timer)
			if (!settings.value.Amazon.selfAd || !button.isConnected || !video.isConnected) return
			button.click()
			if (typeof adTime === "number") settings.value.Statistics.AmazonAdTimeSkipped += adTime
			settings.value.Statistics.SegmentsSkipped++
			sendMessage("increaseBadge", {}, "background")
		}, 150)
		pending.add(timer)
	}
	const interval = setInterval(inspect, 100)
	document.addEventListener("play", inspect, true)
	return () => {
		clearInterval(interval)
		for (const timer of pending) clearTimeout(timer)
		document.removeEventListener("play", inspect, true)
	}
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
let lastClosedXrayUrl = ""
async function Amazon_xray() {
	if (lastClosedXrayUrl === window.location.href) return
	const xrayButton = document.querySelector(".xrayVodHeaderTitle.expanded .arrow.show") as HTMLElement
	if (xrayButton) {
		xrayButton.click()
		// increase stats
		settings.value.Statistics.SegmentsSkipped++
		sendMessage("increaseBadge", {}, "background")
		console.log("Xray closed", xrayButton)
		lastClosedXrayUrl = window.location.href
	}
}

async function Amazon_doubleClick() {
	if (settings.value.Video?.doubleClick) {
		// event listener for double click
		document.ondblclick = function () {
			const button = document.querySelector(
				".dv-player-fullscreen button[class*=fullscreen-button], button[aria-label*='Fullscreen'], button[aria-label*='Vollbild']",
			) as HTMLElement
			button?.click()
		}
	} else {
		document.ondblclick = null
	}
}
function Amazon_improveUI() {
	let timer: ReturnType<typeof setTimeout>
	const originalPointerEvents = document.body.style.pointerEvents
	const restore = () => {
		document.body.style.pointerEvents = originalPointerEvents
	}
	const style = document.createElement("style")

	// button opacity
	// background blur
	style.textContent = `
		.atvwebplayersdk-playpause-button,
		.atvwebplayersdk-fastseekback-button,
		.atvwebplayersdk-fastseekforward-button{
		  opacity: 0.45 !important;
		}
		.atvwebplayersdk-playpause-button:hover,
		.atvwebplayersdk-fastseekback-button:hover,
		.atvwebplayersdk-fastseekforward-button:hover{
		  opacity: 0.8 !important;
		}
		.f1makowq{
			opacity: 0 !important;
		}
	`
	document.head.appendChild(style)

	// Always restore controls, even on browsers that never emit scrollend.
	const onScroll = () => {
		document.body.style.pointerEvents = "none"
		clearTimeout(timer)
		timer = setTimeout(restore, 400)
	}
	const onScrollEnd = () => {
		clearTimeout(timer)
		timer = setTimeout(restore, 400)
	}
	document.addEventListener("scroll", onScroll)
	document.addEventListener("scrollend", onScrollEnd)
	return () => {
		clearTimeout(timer)
		restore()
		document.removeEventListener("scroll", onScroll)
		document.removeEventListener("scrollend", onScrollEnd)
		style.remove()
	}
}
// #endregion
