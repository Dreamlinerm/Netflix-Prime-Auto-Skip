import { log, increaseBadge, date, optionsStore, checkStoreReady, Platforms, logStartOfAddon } from "@/utils/helper"
logStartOfAddon(Platforms.Crunchyroll)
// Global Variables

const { settings } = storeToRefs(optionsStore)

async function startCrunchyroll() {
	await checkStoreReady(settings)
	// if (settings.value.Crunchyroll.disableNumpad) Crunchyroll_disableNumpad()
	// if (settings.value.Video.doubleClick) startdoubleClick()
	// CrunchyrollObserver.observe(document, config)
	// if (settings.value.Video.playOnFullScreen) startPlayOnFullScreen()
	watch(
		settings,
		(newValue) => {
			console.log("settings changed", newValue)
		},
		{ deep: true },
	)
}
startCrunchyroll()

// browser.storage.sync.onChanged.addListener(function (changes) {
// 	if (changes?.settings) {
// 		const { oldValue, newValue } = changes.settings
// 		settings = newValue
// 		if (!oldValue || newValue.Video.playOnFullScreen !== oldValue?.Video?.playOnFullScreen) startPlayOnFullScreen()
// 	}
// })
// const config = { attributes: true, childList: true, subtree: true }
// const CrunchyrollObserver = new MutationObserver(Crunchyroll)
// function Crunchyroll() {
// 	let video = document.querySelector("video")
// 	const time = video?.currentTime
// 	if (settings.Crunchyroll?.skipIntro) Crunchyroll_Intro(video, time)
// 	if (settings.Crunchyroll?.speedSlider) Crunchyroll_SpeedSlider(video)
// 	if (settings.Video?.scrollVolume) Crunchyroll_scrollVolume(video)
// }
// async function Crunchyroll_scrollVolume(video) {
// 	const volumeControl = document.querySelector('[data-testid="vilos-volume_container"]:not(.enhanced)')
// 	if (volumeControl) {
// 		volumeControl.classList.add("enhanced")
// 		volumeControl?.addEventListener("wheel", (event) => {
// 			event.preventDefault()
// 			let volume = video.volume
// 			if (event.deltaY < 0) volume = Math.min(1, volume + 0.1)
// 			else volume = Math.max(0, volume - 0.1)
// 			video.volume = volume
// 			const sliderKnob = document.querySelector('div[data-testid="vilos-volume_slider"]').children[1].firstChild
// 				.firstChild
// 			sliderKnob.style.transform = `translateX(${volume * 61}px) translateX(-8px) scale(1)`
// 		})
// 	}
// }

// async function addSkippedTime(startTime, endTime, key) {
// 	if (typeof startTime === "number" && typeof endTime === "number" && endTime > startTime) {
// 		log(key, endTime - startTime)
// 		settings.Statistics[key] += endTime - startTime
// 		increaseBadge()
// 	}
// }
// function OnFullScreenChange() {
// 	let video = document.querySelector("video")
// 	if (window.fullScreen && video) {
// 		video.play()
// 		log("auto-played on fullscreen")
// 		increaseBadge()
// 	}
// }
// async function startPlayOnFullScreen() {
// 	if (settings.Video?.playOnFullScreen) {
// 		log("started observing| PlayOnFullScreen")
// 		addEventListener("fullscreenchange", OnFullScreenChange)
// 	} else {
// 		log("stopped observing| PlayOnFullScreen")
// 		removeEventListener("fullscreenchange", OnFullScreenChange)
// 	}
// }
// let skipped = false
// let audioButtonClicked = false
// async function setLanguage(lang, index) {
// 	settings.Crunchyroll.dubLanguage = { lang, index }
// 	console.log("dubLanguage", settings.Crunchyroll.dubLanguage)
// 	browser.storage.sync.set({ settings })
// }
// async function registerAudioButton() {
// 	const Radios = document.querySelectorAll('[data-testid="vilos-settings_radio_item"]')
// 	if (Radios) {
// 		Radios.forEach((radio, index) => {
// 			const checked = radio.querySelector("circle.dot")?.parentNode?.parentNode?.querySelector(".r-jwli3a")
// 			const lang = radio.querySelector('[dir="auto"]')?.textContent
// 			if (checked && settings.Crunchyroll.dubLanguage?.lang != checked?.textContent) setLanguage(lang, index)
// 			radio.addEventListener("click", function () {
// 				setLanguage(lang, index)
// 			})
// 		})
// 	}
// }
// function setAudioLanguage() {
// 	// check if settings_audio_track_submenu  was clicked
// 	const audioButton = document.querySelector('[data-testid="vilos-settings_audio_track_submenu"]')
// 	if (audioButton) {
// 		audioButton.addEventListener("click", function () {
// 			if (!audioButtonClicked) {
// 				console.log("audioButton clicked")
// 				audioButtonClicked = true
// 				setTimeout(function () {
// 					registerAudioButton()
// 				}, 200)
// 			}
// 		})
// 	} else if (audioButtonClicked) {
// 		setTimeout(function () {
// 			audioButtonClicked = false
// 		}, 1000)
// 	}
// }
// let reverseButtonClicked = false
// let reverseButtonStartTime
// let reverseButtonEndTime
// async function Crunchyroll_Intro(video, time) {
// 	// saves the audio language to settings
// 	setAudioLanguage()
// 	if (!reverseButtonClicked) {
// 		const button = document.querySelector('[data-testid="skipIntroText"]')
// 		if (button && !skipped) {
// 			// add timeout because it can skip mid sentence if language is not japanese.
// 			skipped = true
// 			setTimeout(
// 				function () {
// 					button?.click()
// 					skipped = false
// 					log("Intro skipped", button)
// 					setTimeout(function () {
// 						CrunchyrollGobackbutton(video, time, video?.currentTime)
// 						addSkippedTime(time, video?.currentTime, "IntroTimeSkipped")
// 					}, 600)
// 				},
// 				settings.Crunchyroll?.dubLanguage?.index === 0 || settings.Crunchyroll?.dubLanguage?.index == undefined
// 					? 0
// 					: 2e3,
// 			)
// 		}
// 	} else if (!document.querySelector(".reverse-button")) {
// 		addButton(video, reverseButtonStartTime, reverseButtonEndTime)
// 	}
// }

// function addButton(video, startTime, endTime) {
// 	if (reverseButtonClicked) return
// 	const button = document.createElement("div")
// 	button.setAttribute(
// 		"class",
// 		"reverse-button css-1dbjc4n r-1awozwy r-lj0ial r-1jd5jdk r-1loqt21 r-18u37iz r-eu3ka r-1777fci r-kuhrb7 r-ymttw5 r-u8s1d r-1ff5aok r-1otgn73",
// 	)
// 	button.style = "color:white;"
// 	button.textContent = "Watch skipped ?"

// 	let buttonTimeout = setTimeout(() => {
// 		button.remove()
// 	}, 5000)
// 	button.onclick = function () {
// 		reverseButtonClicked = true
// 		video.currentTime = startTime
// 		button.remove()
// 		clearTimeout(buttonTimeout)
// 		const waitTime = endTime - startTime + 2
// 		//log("waiting for:", waitTime);
// 		setTimeout(function () {
// 			reverseButtonClicked = false
// 		}, waitTime * 1000)
// 	}
// 	let position = document.querySelector("#velocity-overlay-package")
// 	if (position) position.appendChild(button)
// }

// async function CrunchyrollGobackbutton(video, startTime, endTime) {
// 	reverseButtonStartTime = startTime
// 	reverseButtonEndTime = endTime
// 	addButton(video, startTime, endTime)
// }

// let videoSpeed
// async function setVideoSpeed(speed) {
// 	videoSpeed = speed
// }
// async function Crunchyroll_SpeedSlider(video) {
// 	if (video) {
// 		let alreadySlider = document.querySelector("#videoSpeedSlider")
// 		if (!alreadySlider) {
// 			// infobar position for the slider to be added
// 			// console.log(document.querySelector("#settingsControl"));
// 			const position = document.querySelector("#settingsControl")?.parentElement
// 			if (position) {
// 				videoSpeed = videoSpeed || video.playbackRate

// 				let slider = document.createElement("input")
// 				slider.id = "videoSpeedSlider"
// 				slider.type = "range"
// 				slider.min = settings.General.sliderMin
// 				slider.max = settings.General.sliderMax
// 				slider.value = videoSpeed * 10
// 				slider.step = settings.General.sliderSteps
// 				slider.style = "display: none;width:200px;"

// 				let speed = document.createElement("p")
// 				speed.id = "videoSpeed"
// 				speed.textContent = videoSpeed ? videoSpeed.toFixed(1) + "x" : "1.0x"
// 				// makes the button clickable
// 				// speed.setAttribute("class", "control-icon-btn");
// 				speed.style = "color:white;margin: auto;padding: 0 5px;"
// 				position.prepend(slider, speed)

// 				if (videoSpeed) video.playbackRate = videoSpeed
// 				speed.onclick = function (event) {
// 					event.stopPropagation()
// 					slider.style.display = slider.style.display === "block" ? "none" : "block"
// 				}
// 				slider.onclick = function (event) {
// 					event.stopPropagation()
// 				}
// 				slider.oninput = function (event) {
// 					event.stopPropagation()
// 					speed.textContent = (this.value / 10).toFixed(1) + "x"
// 					video.playbackRate = this.value / 10
// 					setVideoSpeed(this.value / 10)
// 				}
// 			}
// 		}
// 	}
// }
// async function Crunchyroll_disableNumpad() {
// 	addEventListener(
// 		"keydown",
// 		async function (event) {
// 			if (event.location === 3) {
// 				console.log("key blocked: " + event.key)
// 				event.stopPropagation()
// 				increaseBadge()
// 			}
// 		},
// 		true,
// 	)
// }
// async function startdoubleClick() {
// 	if (settings.Video?.doubleClick) {
// 		// event listener for double click
// 		document.ondblclick = function () {
// 			let video = document.querySelector("video")
// 			if (video) {
// 				// video is fullscreen
// 				if (window.fullScreen) {
// 					document.exitFullscreen()
// 				} else {
// 					document.body.requestFullscreen()
// 				}
// 			}
// 		}
// 	} else {
// 		document.ondblclick = null
// 	}
// }
