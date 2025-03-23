// find the focus
// document.querySelectorAll("div, a, button").forEach((button) => {
// 	button.addEventListener(
// 		"focus",
// 		function ($event) {
// 			const target = $event.target as HTMLElement
// 			// .activeElement?.classList?.toString()
// 			console.log("focus:", target)
// 		},
// 		true,
// 	)
// })
// Shared functions
function parseAdTime(adTimeText: string | null) {
	if (!adTimeText) return false
	const adTime: number =
		parseInt(/:\d+/.exec(adTimeText ?? "")?.[0].substring(1) ?? "") +
		parseInt(/\d+/.exec(adTimeText ?? "")?.[0] ?? "") * 60
	if (isNaN(adTime)) return false
	return adTime
}

function createSlider(
	video: HTMLVideoElement,
	videoSpeed: number,
	position: HTMLElement,
	sliderStyle: string,
	speedStyle: string,
	divStyle = "",
) {
	videoSpeed = videoSpeed || video.playbackRate

	const slider = document.createElement("input")
	slider.id = "videoSpeedSlider"
	slider.type = "range"
	slider.min = "5"
	slider.max = "20"
	slider.value = "10"
	slider.step = "1"
	slider.style.cssText = sliderStyle

	const speed = document.createElement("p")
	speed.id = "videoSpeed"
	speed.textContent = videoSpeed ? videoSpeed.toFixed(1) + "x" : "1.0x"
	speed.style.cssText = speedStyle
	if (divStyle) {
		const div = document.createElement("div")
		div.style.cssText = divStyle
		div.appendChild(slider)
		div.appendChild(speed)
		position.prepend(div)
	} else position.prepend(slider, speed)

	if (videoSpeed) video.playbackRate = videoSpeed
	speed.onclick = function () {
		slider.style.display = slider.style.display === "block" ? "none" : "block"
	}
	slider.oninput = function () {
		const sliderValue = parseFloat(slider.value)
		speed.textContent = (sliderValue / 10).toFixed(1) + "x"
		video.playbackRate = sliderValue / 10
		videoSpeed = sliderValue / 10
	}

	return { slider, speed }
}
// Global Variables

const ua = navigator.userAgent
let lastAdTimeText: number | string = 0
const videoSpeed: number = 1
const url = window.location.href
const hostname = window.location.hostname
const title = document.title
const config = { attributes: true, childList: true, subtree: true }
async function logStartOfAddon() {
	console.log("%cStreaming enhanced", "color: #00aeef;font-size: 2em;")
}
type StatisticsKey =
	| "AmazonAdTimeSkipped"
	| "NetflixAdTimeSkipped"
	| "DisneyAdTimeSkipped"
	| "IntroTimeSkipped"
	| "RecapTimeSkipped"
	| "SegmentsSkipped"

async function startAmazon() {
	logStartOfAddon()
	adjustForTV()
	AmazonSkipIntroObserver.observe(document, AmazonSkipIntroConfig)
	AmazonObserver.observe(document, config)
	Amazon_selfAdTimeout()
	// timeout of 100 ms because the ad is not loaded fast enough and the video will crash
	setTimeout(function () {
		Amazon_FreeveeTimeout()
	}, 1000)
	setTimeout(() => Amazon_continuePosition(), 500)
}
async function adjustForTV() {
	const header = document.querySelector("header#pv-navigation-bar") as HTMLElement
	if (header) header.style.position = "relative"
	document.querySelector("div#nav-belt")?.remove()
	document.querySelector("div#nav-main")?.remove()
	document.querySelector("nav#shortcut-menu")?.remove()
}

// #region Amazon
// Amazon Observers
const AmazonVideoClass = ".dv-player-fullscreen video"
const AmazonObserver = new MutationObserver(Amazon)

function Amazon() {
	Amazon_FilterPaid()
	const video = document.querySelector(AmazonVideoClass) as HTMLVideoElement
	Amazon_Credits()
	Amazon_Watch_Credits()
	Amazon_SpeedSlider(video)
	Amazon_xray()
	Amazon_scrollVolume()
	remove_unnecessary_elements()
}
const AmazonSkipIntroConfig = {
	attributes: true,
	attributeFilter: [".skipelement"],
	subtree: true,
	childList: true,
	attributeOldValue: false,
}
const AmazonSkipIntroObserver = new MutationObserver(Amazon_Intro)

async function remove_unnecessary_elements() {
	// fix tabindex navigation
	document
		.querySelectorAll('ul[data-testid="card-container-list"] li article section div a:not(.enhanced)')
		.forEach((a) => {
			a.classList.add("enhanced")
			a.removeAttribute("tabindex")
			// a.removeAttribute("tabindex")
			a.addEventListener("mouseover", function (e) {
				e.preventDefault()
				e.stopPropagation()
			})
		})
}

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
	// skips intro and recap
	// recap on lucifer season 3 episode 3
	// intro lucifer season 3 episode 4
	const button = document.querySelector("[class*=skipelement]") as HTMLButtonElement
	if (button?.checkVisibility()) {
		const video = document.querySelector(AmazonVideoClass) as HTMLVideoElement
		const time = Math.floor(video?.currentTime ?? 0)
		if (typeof time === "number" && lastIntroTime != time) {
			lastIntroTime = time
			resetLastIntroTime()
			button.click()
			console.log("Intro skipped", button)
			//delay where the video is loaded
			setTimeout(function () {
				AmazonGobackbutton(video, time, video.currentTime)
			}, 50)
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
		//  browser.i18n.getMessage("WatchSkippedButton")
		button.textContent = "Rewind?"
		document.querySelector(".atvwebplayersdk-action-buttons")?.appendChild(button)
		const buttonInHTML = document.querySelector('[data-uia="reverse-button"]')
		if (buttonInHTML) {
			function goBack() {
				video.currentTime = startTime
				if (buttonInHTML) buttonInHTML.remove()
				console.log("stopped observing| Intro")
				AmazonSkipIntroObserver.disconnect()
				const waitTime = endTime - startTime + 2
				setTimeout(function () {
					console.log("restarted observing| Intro")
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
			// is series
			newEpNumber?.textContent &&
			// not different show.
			!/(?<!\S)1(?!\S)/.exec(newEpNumber.textContent) &&
			lastAdTimeText != newEpNumber.textContent
		) {
			lastAdTimeText = newEpNumber.textContent ?? ""
			resetLastATimeText()
			button.click()
			console.log("skipped Credits", button)
		}
	}
}
async function Amazon_Watch_Credits() {
	const button = document.querySelector("[class*=nextupcardhide-button]") as HTMLElement
	if (button) {
		button.click()
		console.log("Watched Credits", button)
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
	// TODO: put back
	// const continueCategory = document
	// 	.querySelector('.j5ZgN-._0rmWBt[data-testid="card-overlay"]')
	// 	?.closest('[class="+OSZzQ"]')
	// const position = continueCategory?.parentNode?.childNodes?.[2]
	// if (continueCategory && position) position.before(continueCategory)
}
async function Amazon_FilterPaid() {
	// if not on the shop page or homepremiere
	if (url.includes("storefront") || url.includes("genre") || url.includes("movie") || url.includes("Amazon-Video")) {
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
		console.log("Filtered paid category", section)
		section?.remove()
	}
	// remove individual paid elements
	else {
		a.querySelectorAll("li:has(svg.NbhXwl)").forEach((b) => {
			console.log("Filtered paid Element", b)
			b.remove()
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
			console.log("FreeVee Ad skipped, length:", skipTime, "s")
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
							console.log("Self Ad skipped, length:", adTime, button)
						}, 150)
					}
				}
			}
		}
	}, 100)
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
// #endregion
startAmazon()
