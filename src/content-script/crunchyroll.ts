import { sendMessage } from "webext-bridge/content-script"
import {
	startSharedFunctions,
	Platforms,
	createSlider,
	getColorForRating,
	getIsTransparent,
	getDiffInDays,
} from "@/content-script/shared-functions"
startSharedFunctions(Platforms.Crunchyroll)
// Global Variables

const { data: settings, promise } = useBrowserSyncStorage<settingsType>("settings", defaultSettings)
const { data: crunchyList, promise: crunchyListPromise } = useBrowserSyncStorage<CrunchyList>("crunchyList", [], false)
const url = globalThis.location.href
const date = new Date()
const today = date.toISOString().split("T")[0]
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

async function startCrunchyroll() {
	// watch ready state
	await promise
	await crunchyListPromise
	logStartOfAddon()
	if (settings.value.Crunchyroll.releaseCalendar) Crunchyroll_ReleaseCalendar()
	if (settings.value.Crunchyroll.profile) {
		const pickInterval = setInterval(function () {
			Crunchyroll_AutoPickProfile()
		}, 100)
		// only click on profile on page load not when switching profiles
		setTimeout(function () {
			clearInterval(pickInterval)
		}, 2000)
	}
	if (settings.value.Video.playOnFullScreen) startPlayOnFullScreen()
	if (settings.value.Video.doubleClick) startdoubleClick()
	if (settings.value.Crunchyroll.speedSlider) Crunchyroll_SpeedKeyboard()
	CrunchyrollObserver.observe(document, config)
	getMALCache()
}
// #region MAL Rating
// MyAnimeList integration: shows a TMDB-badge-style rating in the bottom right corner of browse cards
type MALNode = {
	id: number
	title: string
	main_picture?: { medium: string; large: string }
	mean?: number
	num_scoring_users?: number
	media_type?: string
	start_date?: string
}
type MALSearchResponse = {
	data?: Array<{ node: MALNode }>
}
type MALCacheEntry = {
	id: number
	title: string
	score: number | null
	num_scoring_users: number
	media_type: string
	start_date: string
	poster: string | null
	date: string
}
type MALCacheType = { [title: string]: MALCacheEntry }
let MALCache: MALCacheType = {}
// how long a rating should be kept in the cache before refetching
const MALGCdiff = 30

function getMALUrl(id: number) {
	return `https://myanimelist.net/anime/${id}`
}

async function getMALCache() {
	const result = await browser.storage.local.get("MALCache")
	MALCache = result?.MALCache as MALCacheType
	if (typeof MALCache !== "object") {
		console.log("MALCache not found, creating new one", MALCache)
		try {
			await browser.storage.local.set({ MALCache: {} })
		} catch (error) {
			console.log(error)
		}
		MALCache = {}
	}
	if (settings.value.Crunchyroll?.showRating) startMALRatingInterval()
	if (getDiffInDays(settings.value.General.MALGCdate, date) >= MALGCdiff) malGarbageCollection()
	browser.storage.onChanged.addListener(function (changes, areaName) {
		if (areaName === "local" && changes?.MALCache) MALCache = changes.MALCache.newValue as MALCacheType
	})
}
// set MAL Cache if cache size under 5MB
async function setMALCache() {
	const size = new TextEncoder().encode(JSON.stringify(MALCache)).length
	const megaBytes = size / 1024 / 1024
	if (megaBytes < 5) {
		await browser.storage.local.set({ MALCache })
	} else {
		console.log("MALCache cleared", megaBytes)
		MALCache = {}
		await browser.storage.local.set({ MALCache })
	}
}
async function malGarbageCollection() {
	// clear every rating older than 30 days
	console.log("malGarbageCollection started, deleting old ratings:")
	const keys = Object.keys(MALCache)
	for (const key of keys) {
		if (getDiffInDays(MALCache[key].date, date) >= MALGCdiff) {
			delete MALCache[key]
		}
	}
	settings.value.General.MALGCdate = today
	setMALCache()
}

// MAL's search endpoint returns a 400 "invalid q" for very long queries, so trim to
// just the part before a subtitle-separating colon, then hard-cap the length as a safety net
const MAL_MAX_QUERY_LENGTH = 64
function getMALSearchQuery(title: string) {
	const beforeColon = title.split(":")[0].trim()
	return beforeColon.slice(0, MAL_MAX_QUERY_LENGTH).trim()
}

async function getMALInfo(title: string, card: HTMLElement) {
	const searchUrl = `https://api.myanimelist.net/v2/anime?q=${encodeURIComponent(getMALSearchQuery(title))}&limit=1&fields=mean,num_scoring_users,media_type,start_date,main_picture`
	const data: MALSearchResponse = await sendMessage("fetchMAL", { url: searchUrl }, "background")
	const node = data?.data?.[0]?.node
	if (!node) console.log("MAL: no match or fetch error for", title, data)
	const compiledData: MALCacheEntry = {
		id: node?.id ?? 0,
		title: node?.title ?? title,
		score: node?.mean ?? null,
		num_scoring_users: node?.num_scoring_users ?? 0,
		media_type: node?.media_type ?? "",
		start_date: node?.start_date ?? "",
		poster: node?.main_picture?.medium ?? null,
		date: today,
	}
	MALCache[title] = compiledData
	setMALRatingOnCard(card, compiledData)
	setMALCache()
}

function setMALRatingOnCard(card: HTMLElement, data: MALCacheEntry) {
	if (card.querySelector("#mal-rating")) return
	// no MAL match: still show a "?" badge instead of nothing, same as the TMDB rating badge does
	const a = data?.id ? document.createElement("a") : document.createElement("div")
	a.id = "mal-rating"
	if (data?.id) {
		;(a as HTMLAnchorElement).href = getMALUrl(data.id)
		;(a as HTMLAnchorElement).target = "_blank"
	}
	const voteCount = data.num_scoring_users || 0
	const score = data.score ?? 0
	Object.assign(a.style, {
		position: "absolute",
		bottom: "0",
		right: "0.2vw",
		color: "black",
		textDecoration: "none",
		background: getColorForRating(score, voteCount < 50),
		borderRadius: "5px",
		padding: "0 2px 0 2px",
		zIndex: "2",
		fontSize: "1vw",
	})
	if (data.score) {
		let releaseText = ""
		if (settings.value.Video?.showYear && data.start_date) {
			releaseText = new Date(data.start_date).getFullYear() + "-"
		}
		a.textContent = releaseText + data.score.toFixed(1)
	} else {
		a.textContent = "?"
	}
	card.style.position = "relative"
	card.appendChild(a)
	if (getIsTransparent(score, voteCount < 50)) {
		const greyOverlay = document.createElement("div")
		Object.assign(greyOverlay.style, {
			position: "absolute",
			top: "0",
			left: "0",
			right: "0",
			bottom: "0",
			background: "rgba(40, 40, 40, 0.7)",
			pointerEvents: "none",
			zIndex: "1",
		})
		card.appendChild(greyOverlay)
	}
}

// no-match results (id 0, e.g. from a since-fixed query bug or a transient API error) are
// retried much sooner than real matches, instead of being stuck for the full 30-day cache window
const MAL_NO_MATCH_RETRY_DAYS = 1
function addMALRating() {
	const cards = document.querySelectorAll('div[data-t~="series-card"]:not(.mal-rated)')
	cards.forEach((cardEl) => {
		const card = cardEl as HTMLElement
		card.classList.add("mal-rated")
		const title = card.querySelector('h3[data-t="title"] a')?.textContent?.trim()
		if (!title) return
		const cached = MALCache[title]
		const cacheTtlDays = cached?.id ? MALGCdiff : MAL_NO_MATCH_RETRY_DAYS
		if (cached && getDiffInDays(cached.date, date) < cacheTtlDays) {
			setMALRatingOnCard(card, cached)
		} else {
			getMALInfo(title, card)
		}
	})
}

async function startMALRatingInterval() {
	addMALRating()
	const MALRatingInterval = setInterval(function () {
		if (!settings.value.Crunchyroll?.showRating) {
			console.log("stopped observing| MAL Rating")
			clearInterval(MALRatingInterval)
			return
		}
		addMALRating()
	}, 1000)
}
// #endregion
// #region Crunchyroll
// Crunchyroll functions
const CrunchyrollObserver = new MutationObserver(Crunchyroll)
async function Crunchyroll() {
	if (settings.value.Crunchyroll?.profile) Crunchyroll_profile()
	const video = document.querySelector("video")
	if (!video) return
	if (settings.value.Crunchyroll?.bigPlayer) Crunchyroll_bigPlayerStyle()
	const time = video?.currentTime
	Crunchyroll_Intro_Outro(video, time)
	if (settings.value.Crunchyroll?.speedSlider) Crunchyroll_SpeedSlider(video)
	if (settings.value.Video?.scrollVolume) Crunchyroll_scrollVolume(video)
}
async function Crunchyroll_profile() {
	// save profile
	const img = document.querySelector(".avatar-wrapper img") as HTMLImageElement
	if (img && img.src !== settings.value.General.Crunchyroll_profilePicture) {
		settings.value.General.Crunchyroll_profilePicture = img.src
		//setStorage()
		console.log("Profile switched to", img.src)
	}
}
async function Crunchyroll_AutoPickProfile() {
	// click on profile picture
	if (document.querySelector(".profile-item-name")) {
		document.querySelectorAll(".erc-profile-item img")?.forEach((element) => {
			const img = element as HTMLImageElement
			if (img.src === settings.value.General.Crunchyroll_profilePicture) {
				img.click()
				console.log("Profile automatically chosen:", img.src)
				settings.value.Statistics.SegmentsSkipped++
				sendMessage("increaseBadge", {}, "background")
			}
		})
	}
}
const styleId = "enhanced-crunchyroll-big-player-style"
async function Crunchyroll_bigPlayerStyle() {
	const existingStyle = document.getElementById(styleId)
	if (existingStyle) return

	// keep the header above the player in normal flow (not sticky/overlayed)
	const style = document.createElement("style")
	style.id = styleId
	let styles = /*css*/ `
      .video-player-wrapper{
					max-height: calc(100vw / 1.7777);
          height: 100vh;
      }
			[class^="app-layout__header"] {
					position: absolute;
          top: 0;
          width: 100%;
          height: 3.75rem;
          z-index: 999;
			}
      .erc-large-header {
          position: absolute;
          top: 0;
          width: 100%;
          height: 3.75rem;
          z-index: 999;
      }
      .erc-large-header .header-content {
          position: absolute;
          top: -3.75rem;
          transition: top 0.4s, top 0.4s;
      }
      .erc-large-header:hover .header-content {
          top: 0;
      }
  `
	style.textContent = styles
	document.head.appendChild(style)
}

async function Crunchyroll_scrollVolume(video: HTMLVideoElement) {
	const volumeControl = document.querySelector(
		'[data-testid="bottom-left-controls-stack"]:not(.enhanced) [data-testid="volume-slider-container"]',
	) as HTMLElement
	if (volumeControl) {
		volumeControl?.parentElement?.classList.add("enhanced")
		volumeControl.addEventListener("wheel", (event: WheelEvent) => {
			event.preventDefault()
			let volume = video.volume
			if (event.deltaY < 0) volume = Math.min(1, volume + 0.1)
			else volume = Math.max(0, volume - 0.1)
			video.volume = volume
		})
	}
}

function OnFullScreenChange() {
	const video = document.querySelector("video") as HTMLVideoElement
	if (document.fullscreenElement && video) {
		video.play()
		console.log("auto-played on fullscreen")
		settings.value.Statistics.SegmentsSkipped++
		sendMessage("increaseBadge", {}, "background")
	}
}
async function startPlayOnFullScreen() {
	if (settings.value.Video?.playOnFullScreen) {
		console.log("started observing| PlayOnFullScreen")
		addEventListener("fullscreenchange", OnFullScreenChange)
	} else {
		console.log("stopped observing| PlayOnFullScreen")
		removeEventListener("fullscreenchange", OnFullScreenChange)
	}
}

// add timeout because it can skip mid sentence if language is not japanese.
let skipped = false
let reverseButtonClicked = false
let reverseButtonStartTime: number
let reverseButtonEndTime: number
async function Crunchyroll_Intro_Outro(video: HTMLVideoElement, time: number) {
	// If skips at second 0 it cancels previous watch time
	if (video.paused || video.currentTime <= 2) return
	// check if intro or outro
	const isOutro = time > video.duration / 2
	if (!settings.value.Crunchyroll?.skipIntro && !isOutro) return
	if (!settings.value.Crunchyroll?.skipCredits && isOutro) return
	// saves the audio language to settings
	if (!reverseButtonClicked) {
		const button = document.querySelector('button:has(svg[data-testid="skip-intro-icon"])') as HTMLElement
		if (
			button &&
			button.checkVisibility({ opacityProperty: true }) &&
			!skipped &&
			!button?.getAttribute("aria-label")?.toLowerCase()?.includes("recap")
		) {
			skipped = true
			setTimeout(function () {
				if (isOutro && settings.value.Crunchyroll?.skipAfterCredits) {
					const nextEpButton = document.querySelector('[data-testid="next-episode-button"]') as HTMLElement
					if (nextEpButton) {
						nextEpButton.click()
						console.log("Outro skipped", nextEpButton)
					} else {
						button?.click()
						console.log("Outro skipped", button)
					}
				} else {
					button?.click()
					console.log("Intro skipped", button, settings.value.General.Crunchyroll_skipTimeout)
					setTimeout(function () {
						CrunchyrollGobackbutton(time, video?.currentTime)
						addSkippedTime(time, video?.currentTime, "IntroTimeSkipped")
					}, 600)
				}
				setTimeout(function () {
					skipped = false
				}, 2000)
			}, settings.value.General.Crunchyroll_skipTimeout)
		}
	} else if (!document.querySelector(".reverse-button")) {
		addButton(reverseButtonStartTime, reverseButtonEndTime)
	}
}

function addButton(startTime: number, endTime: number) {
	if (reverseButtonClicked) return
	const button = document.createElement("div")
	button.setAttribute(
		"class",
		"reverse-button kat:inline-flex kat:items-center kat:justify-center kat:rounded-full kat:border kat:border-solid kat:ps-24 kat:pe-24 kat:pt-12 kat:pb-12 kat:text-sm kat:font-semibold kat:leading-none kat:transition-colors kat:duration-200 kat:outline-none kat:cursor-pointer kat:disabled:cursor-not-allowed kat:bg-neutral-50 kat:border-transparent kat:text-neutral-900 kat:hover:bg-neutral-200 kat:active:bg-neutral-300 kat:focus-visible:ring-4 kat:focus-visible:ring-taupe-600 kat:disabled:bg-neutral-600 kat:disabled:text-neutral-400 kat:z-1001 kat:gap-4 kat:min-w-161 kat:h-44 kat:shadow-lg kat:self-end kat:mr-40 kat:pointer-events-auto",
	)
	button.textContent = "Rewind?"

	const buttonTimeout = setTimeout(() => {
		button.remove()
	}, 5000)
	button.onclick = function () {
		reverseButtonClicked = true
		const reverseButton = document.querySelector('[data-testid="jump-backward-button"]') as HTMLElement
		// each click rewinds 10 seconds, so click multiple times if the skipped time is more than 10 seconds
		const clicksNeeded = Math.ceil((endTime - startTime) / 10)
		for (let i = 0; i < clicksNeeded; i++) {
			reverseButton?.click()
		}
		button.remove()
		clearTimeout(buttonTimeout)
		const waitTime = endTime - startTime + 2
		setTimeout(function () {
			reverseButtonClicked = false
		}, waitTime * 1000)
	}
	const position = document
		.querySelector('[data-testid="player-controls-root"]')
		?.querySelector('[data-testid="bottom-controls-autohide"]') as HTMLElement
	if (position) {
		position.before(button)
	}
}

async function CrunchyrollGobackbutton(startTime: number, endTime: number) {
	reverseButtonStartTime = startTime
	reverseButtonEndTime = endTime
	addButton(startTime, endTime)
}

const videoSpeed: Ref<number> = ref(1)
const CrunchyrollSliderStyle = "display: none;margin: auto;width:200px;"
const CrunchyrollSpeedStyle = "color: white;margin: auto;padding: 0 5px;width: 40px;"
async function Crunchyroll_SpeedSlider(video: HTMLVideoElement) {
	if (video) {
		const alreadySlider = document.querySelector("#videoSpeedSlider")
		if (!alreadySlider) {
			const position = document.querySelector('[data-testid="bottom-right-controls-stack"]') as HTMLElement
			if (position) {
				createSlider(video, videoSpeed, position, CrunchyrollSliderStyle, CrunchyrollSpeedStyle)
				document.querySelector('button[data-testid="playback-speed-button"]')?.remove()
			}
		} else {
			video.playbackRate = videoSpeed.value
		}
	}
}

async function Crunchyroll_SpeedKeyboard() {
	const steps = settings.value.General.sliderSteps / 10
	document.addEventListener("keydown", (event: KeyboardEvent) => {
		const video = document.querySelector("video") as HTMLVideoElement
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

async function startdoubleClick() {
	// event listener for double click
	document.ondblclick = function () {
		const fullScreenButton = document.querySelector('button[data-testid="fullscreen-button"]') as HTMLElement
		fullScreenButton?.click()
	}
}

// #region Release Calendar
function setReleaseRemoved(element: HTMLElement) {
	element.classList.add("removed")
	element.style.display = "none"
}
function showAllElements() {
	const list = document.querySelectorAll("li article.release.js-release")
	list.forEach((element) => {
		if (!element.parentElement) return
		element.parentElement.classList.remove("removed")
		element.parentElement.style.display = "block"
	})
}

const langs = [
	"English",
	"Deutsch",
	"Français",
	"Japanese",
	"French",
	"German",
	"América Latina",
	"Portuguese",
	"Português",
	"Spanish",
	"Indonesian",
	"Italian",
	"Castilian",
	"Russian",
	"España",
	"Italiano",
	"Brasil",
	"普通话",
	"Русский",
]
const filterNoDubs = "all"
const filterAllDubs = "none"
const dubLanguageRegex = /\(([^()\d]+?)(?:\s+Dub)?\)(?!.*\([^()]*\))/
function titleContainsDub(title: string) {
	const isDub =
		title?.includes("Dub") ||
		/[^(]*\(\D*\)[^(]*/g.test(title) ||
		// Array.from(langs).some((lang) => element?.textContent?.includes(lang)) ||
		title?.includes("Audio")
	if (isDub) {
		const dubLanguage = dubLanguageRegex.exec(title)?.[1]?.trim()
		if (dubLanguage && !langs.includes(dubLanguage)) {
			langs.push(dubLanguage)
		}
	}
	return isDub
}

function titleContainsAllowedDub(title: string) {
	const selectedDubLanguage = settings.value.Crunchyroll.dubLanguage
	if (selectedDubLanguage === filterNoDubs) return true
	else if (selectedDubLanguage === filterAllDubs) return false
	return title?.includes(selectedDubLanguage)
}

const getTitle = (el: Element | null) => el?.textContent?.trim() ?? ""
type show = {
	index: number
	episode: number
}
export const getEpisodeRegex = /(\d+)(?!.*\d)/
function filterFunctions() {
	const showsByTitle = new Map<string, Array<show>>()
	const list = document.querySelectorAll("li article.release.js-release")
	list.forEach((element, index) => {
		if (!element.parentElement) return
		if (!element?.checkVisibility()) {
			element.parentElement.classList.add("removed")
			return
		}
		const titleElement = element?.querySelector("cite[itemprop='name']")
		const title = getTitle(titleElement)
		if (titleElement?.textContent) titleElement.textContent = title.replace(/Season \d*/, "")
		const queuedFlag = element.querySelector("div.queue-flag:not(.queued)")
		const premiereFlag = element.querySelector("div.premiere-flag")
		const episodeNumber = Number.parseInt(
			element.querySelector("a.available-episode-link")?.textContent?.match(getEpisodeRegex)?.[1] ?? "-1",
		)
		if (titleContainsDub(title) && !titleContainsAllowedDub(title)) {
			setReleaseRemoved(element.parentElement)
		} else if (settings.value.Crunchyroll.filterQueued && queuedFlag && !premiereFlag) {
			setReleaseRemoved(element.parentElement)
		} else if (settings.value.Crunchyroll.filterDuplicates) {
			if (showsByTitle.has(title)) {
				showsByTitle.get(title)?.push({ index, episode: episodeNumber })
			} else {
				showsByTitle.set(title, [{ index, episode: episodeNumber }])
			}
		}
	})
	// if there are multiple shows with the same title, only show the one with the highest episode number or the first index
	showsByTitle.forEach((shows) => {
		if (shows.length > 1) {
			shows.sort((a, b) => {
				const episodeDiff = b.episode - a.episode
				if (episodeDiff !== 0) return episodeDiff
				return a.index - b.index
			})
			shows.slice(1).forEach((show) => {
				const element = list[show.index]
				if (element.parentElement) setReleaseRemoved(element.parentElement)
			})
		}
	})
}

function createFilterElement(
	filterType: "filterQueued" | "filterDuplicates",
	filterText: string,
	settingsValue: boolean,
) {
	const label = document.createElement("label")
	const span = document.createElement("span")
	span.style.display = "flex"
	span.style.alignItems = "center"
	const input = document.createElement("input")
	input.type = "checkbox"
	input.checked = settingsValue
	input.id = filterType
	input.onclick = function () {
		settings.value.Crunchyroll[filterType] = input.checked
		showAllElements()
		filterFunctions()
	}
	const p = document.createElement("p")
	p.style.width = "100px"
	p.textContent = filterText
	label.appendChild(span)
	span.appendChild(input)
	span.appendChild(p)
	return label
}

function createDubLanguageSelectElement() {
	const label = document.createElement("label")
	const span = document.createElement("span")
	span.style.display = "flex"
	span.style.alignItems = "start"
	span.style.flexDirection = "column"

	const select = document.createElement("select")
	select.id = "filterDubLanguage"
	const selectedDubLanguage = settings.value.Crunchyroll.dubLanguage || filterAllDubs

	const options = [filterAllDubs, filterNoDubs, ...langs]
	options.forEach((lang) => {
		const option = document.createElement("option")
		option.value = lang
		option.textContent = lang
		select.appendChild(option)
	})

	select.value = selectedDubLanguage

	if (!options.includes(selectedDubLanguage)) {
		select.value = filterAllDubs
		settings.value.Crunchyroll.dubLanguage = filterAllDubs
	}

	select.onchange = function () {
		settings.value.Crunchyroll.dubLanguage = select.value
		showAllElements()
		filterFunctions()
	}

	const p = document.createElement("p")
	p.textContent = "Show these dubs:"

	label.appendChild(span)
	span.appendChild(p)
	span.appendChild(select)
	return label
}

function addButtons() {
	const toggleForm = document.querySelector("#filter_toggle_form") as HTMLElement
	if (!toggleForm?.firstElementChild) return
	toggleForm.style.display = "flex"
	toggleForm.firstElementChild.appendChild(createDubLanguageSelectElement())
	toggleForm.firstElementChild.appendChild(
		createFilterElement("filterQueued", "Show Playlist only", settings.value.Crunchyroll.filterQueued),
	)
	toggleForm.firstElementChild.appendChild(
		createFilterElement("filterDuplicates", "Filter Duplicates", settings.value.Crunchyroll.filterDuplicates),
	)
}
// start of add CrunchyList to Crunchyroll
function addShowsToList(position: HTMLElement, list: CrunchyList) {
	list.forEach((element) => {
		const article = document.createElement("article")
		article.className = "release js-release"

		const time = document.createElement("time")
		time.className = "available-time"
		time.textContent = new Date(element.time).toLocaleString([], { hour: "2-digit", minute: "2-digit" })

		const div1 = document.createElement("div")
		const div2 = document.createElement("div")
		div2.className = "queue-flag queued"

		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
		svg.setAttribute("viewBox", "0 0 48 48")

		const use = document.createElementNS("http://www.w3.org/2000/svg", "use")
		use.setAttributeNS(
			"http://www.w3.org/1999/xlink",
			"xlink:href",
			"/i/svg/simulcastcalendar/calendar_icons.svg#cr_bookmark",
		)

		svg.appendChild(use)
		div2.appendChild(svg)

		const h1 = document.createElement("h1")
		h1.className = "season-name"

		const a = document.createElement("a")
		a.className = "js-season-name-link"
		a.href = element?.href || ""
		a.setAttribute("itemprop", "url")

		const cite = document.createElement("cite")
		cite.setAttribute("itemprop", "name")
		cite.textContent = element?.name || ""

		a.appendChild(cite)
		h1.appendChild(a)

		div1.appendChild(div2)
		div1.appendChild(h1)

		article.appendChild(time)
		article.appendChild(div1)
		position.appendChild(article)
	})
}
function clickOnCurrentDay() {
	const days = document.querySelectorAll(".specific-date [datetime]")
	for (const day of days) {
		const dateOnPage = new Date(day?.getAttribute("datetime") ?? "")
		// if the day of the week is the same as today click on it, like if its Monday click on Monday
		if (date.getDay() == dateOnPage.getDay()) {
			day.closest("li.day")?.classList.add("active")
			// isCurrentWeek
			return date.toLocaleDateString() == dateOnPage.toLocaleDateString()
		}
	}
	return false
}
function createLocalList() {
	const localList: CrunchyList = []
	document.querySelectorAll("ol.releases li:not(.removed) article.release.js-release").forEach((element) => {
		const queuedFlag = element.querySelector("div.queue-flag:not(.queued)")
		const premiereFlag = element.querySelector("div.premiere-flag")
		if (premiereFlag && !queuedFlag) return
		const h1 = element.querySelector("h1.season-name a") as HTMLAnchorElement
		const name = h1?.firstChild?.nextSibling?.textContent
		const href = h1?.href
		const time = element.firstElementChild?.getAttribute("datetime") ?? ""
		localList.push({ href, name, time })
	})
	return localList
}
function filterOldList(isCurrentWeek: boolean, localList: CrunchyList) {
	let oldList = toRaw(crunchyList.value)
	const lastElement = localList.at(-1)
	if (!lastElement?.time) return oldList
	const lastTime = new Date(lastElement.time)
	const [lastDay, lastHr, lastMin] = [lastTime.getDay(), lastTime.getHours(), lastTime.getMinutes()]
	// delete all previous weekdays from oldList
	if (!isCurrentWeek) {
		oldList = []
	} else {
		// delete all items from weekday before today
		oldList = oldList
			.filter((item) => {
				return item && shiftSunday(date.getDay()) - shiftSunday(new Date(item.time).getDay()) <= 0
			})
			// delete all items from same weekday before lastElement time
			.filter((item) => {
				const itemTime = new Date(item.time)
				const itemHr = itemTime.getHours()
				// no shows today yet
				const itemDay = itemTime.getDay()
				return (
					lastDay != itemDay ||
					itemDay != date.getDay() ||
					itemHr > lastHr ||
					(itemHr == lastHr && itemTime.getMinutes() > lastMin)
				)
			})
	}
	return oldList
}
const shiftSunday = (a: number) => (a + 6) % 7
function addSavedCrunchyList() {
	const localList = createLocalList()
	const isCurrentWeek = clickOnCurrentDay()
	const oldList = localList.length > 0 ? filterOldList(isCurrentWeek, localList) : toRaw(crunchyList.value)
	crunchyList.value = localList.concat(oldList)
	if (isCurrentWeek) {
		// now add the old list to the website list
		document.querySelectorAll("section.calendar-day").forEach((element) => {
			const datetime = element.querySelector("time")?.getAttribute("datetime") ?? ""
			const weekday = new Date(datetime).getDay()
			// remove Schedule Coming Soon text
			if (shiftSunday(date.getDay()) - shiftSunday(weekday) < 0)
				element?.children?.[1]?.firstChild?.nextSibling?.remove()
			addShowsToList(
				element.children[1] as HTMLElement,
				oldList.filter((item) => new Date(item.time).getDay() == weekday),
			)
		})
	}
}
async function Crunchyroll_ReleaseCalendar() {
	if (url.includes("simulcastcalendar")) {
		filterFunctions()
		if (!document.querySelector("#filterQueued")) addButtons()
		// add saved CrunchyList and click on current day
		addSavedCrunchyList()
	}
}
// #endregion
// #endregion
startCrunchyroll()
