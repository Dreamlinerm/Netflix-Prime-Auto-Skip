import { createPinia } from "pinia"
import { useOptionsStore } from "@/stores/options.store"
import { sendMessage, onMessage } from "webext-bridge/content-script"
import Amazon from "@/components/shared-pages/Amazon.vue"
const pinia = createPinia()

// Global Variables
// Use the store
export const optionsStore = useOptionsStore(pinia)
export const date = new Date()
export const isFirefox = typeof browser !== "undefined"
// default Options for the observer (which mutations to observe)
export const config = { attributes: true, childList: true, subtree: true }

const { settings } = storeToRefs(optionsStore)
const version = __VERSION__

// Functions
// custom log function
export async function log(...args: any[]) {
	console.log(date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + date.getMilliseconds(), ...args)
}

// increase the badge count
export async function increaseBadge() {
	settings.value.Statistics.SegmentsSkipped++
	sendMessage("increaseBadge", {}, "background")
}
// checks if the store got the data from the storage
export async function checkStoreReady(setting: Ref<any>) {
	return new Promise((resolve) => {
		const readyStateCheckInterval = setInterval(function () {
			if (setting.value?.$ready) {
				clearInterval(readyStateCheckInterval)
				resolve(true)
			}
		}, 1)
	})
}

export enum Platforms {
	Netflix = "netflix",
	Amazon = "amazon",
	StarPlus = "starplus",
	Disney = "disney",
	Hotstar = "hotstar",
	Crunchyroll = "crunchyroll",
	HBO = "hbo",
}
export function logStartOfAddon(page: Platforms) {
	console.log("%cStreaming enhanced", "color: #00aeef;font-size: 2em;")
	console.log("version:", version)
	console.log("Settings", settings.value)
	if (page == Platforms.Netflix) console.log("Page %cNetflix", "color: #e60010;")
	else if (page == Platforms.Amazon) console.log("Page %cAmazon", "color: #00aeef;")
	else if (page == Platforms.StarPlus) console.log("Page %cStarPlus", "color: #fe541c;")
	else if (page == Platforms.Disney) console.log("Page %cDisney", "color: #0682f0;")
	else if (page == Platforms.Hotstar) console.log("Page %cHotstar", "color: #0682f0;")
	else if (page == Platforms.Crunchyroll) console.log("Page %cCrunchyroll", "color: #e67a35;")
	else if (page == Platforms.HBO) console.log("Page %cHBO", "color: #0836f1;")
}
type StatisticsKey =
	| "AmazonAdTimeSkipped"
	| "NetflixAdTimeSkipped"
	| "DisneyAdTimeSkipped"
	| "IntroTimeSkipped"
	| "RecapTimeSkipped"
	| "SegmentsSkipped"
export async function addSkippedTime(startTime: number, endTime: number, key: StatisticsKey) {
	if (typeof startTime === "number" && typeof endTime === "number" && endTime > startTime) {
		log(key, endTime - startTime)
		settings.value.Statistics[key] += endTime - startTime
		increaseBadge()
	}
}

export function parseAdTime(adTimeText: string | null) {
	if (!adTimeText) return false
	const adTime: number =
		parseInt(/:\d+/.exec(adTimeText ?? "")?.[0].substring(1) ?? "") +
		parseInt(/\d+/.exec(adTimeText ?? "")?.[0] ?? "") * 60
	if (isNaN(adTime)) return false
	return adTime
}

export function createSlider(
	video: HTMLVideoElement,
	videoSpeed: Ref<number>,
	position: HTMLElement,
	sliderStyle: string,
	speedStyle: string,
	divStyle = "",
) {
	videoSpeed.value = videoSpeed.value || video.playbackRate

	const slider = document.createElement("input")
	slider.id = "videoSpeedSlider"
	slider.type = "range"
	slider.min = settings.value.General.sliderMin.toString()
	slider.max = settings.value.General.sliderMax.toString()
	slider.value = (videoSpeed.value * 10).toString()
	slider.step = settings.value.General.sliderSteps.toString()
	// slider.style = sliderStyle
	Object.assign(slider.style, sliderStyle)

	const speed = document.createElement("p")
	speed.id = "videoSpeed"
	speed.textContent = videoSpeed.value ? videoSpeed.value.toFixed(1) + "x" : "1.0x"
	// speed.style = speedStyle
	Object.assign(speed.style, speedStyle)
	if (divStyle) {
		const div = document.createElement("div")
		// div.style = divStyle
		Object.assign(div.style, divStyle)
		div.appendChild(slider)
		div.appendChild(speed)
		position.prepend(div)
	} else position.prepend(slider, speed)

	if (videoSpeed.value) video.playbackRate = videoSpeed.value
	speed.onclick = function () {
		slider.style.display = slider.style.display === "block" ? "none" : "block"
	}
	slider.oninput = function () {
		const sliderValue = parseFloat(slider.value)
		speed.textContent = (sliderValue / 10).toFixed(1) + "x"
		video.playbackRate = sliderValue / 10
		videoSpeed.value = sliderValue / 10
	}

	return { slider, speed }
}
