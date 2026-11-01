import { sendMessage } from "webext-bridge/content-script"
import extensionLogo from "@/assets/Logo/NetflixAmazon Auto-Skip.svg?inline"
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
	const data: MALSearchResponse = await sendMessage("fetch", { url: searchUrl, type: "mal" }, "background")
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

export function shouldBlockPreviewSkip(ariaLabel: string | null | undefined, skipAfterCredits: boolean): boolean {
	return !skipAfterCredits && (ariaLabel?.toLowerCase().includes("preview") ?? false)
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
		const ariaLabel = button?.getAttribute("aria-label")
		if (
			button &&
			button.checkVisibility({ opacityProperty: true }) &&
			!skipped &&
			!ariaLabel?.toLowerCase()?.includes("recap")
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
				} else if (shouldBlockPreviewSkip(ariaLabel, !!settings.value.Crunchyroll?.skipAfterCredits)) {
					console.log("After-credits preview left alone (skipAfterCredits disabled)", button)
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

export const getEpisodeRegex = /(\d+)(?!.*\d)/

const calendarHiddenClass = "streaming-enhanced-calendar-hidden"
const savedCalendarAttribute = "data-enhanced-saved-calendar"

function normalizeCalendarText(value: string, locale: string) {
	return value.toLocaleLowerCase(locale).replace(/[\p{P}\p{Z}\s]/gu, "")
}

export function parseCalendarReleaseTimestamp(
	weekdayLabel: string,
	timeLabel: string,
	locale: string,
	referenceDate = new Date(),
): string | null {
	const weekday = getCalendarWeekdayIndex(weekdayLabel, locale)
	const timeMatch = timeLabel.match(/(\d{1,2}):(\d{2})(?:\s*([ap])\.?m\.?)?/i)
	if (weekday === null || !timeMatch) return null

	let hours = Number(timeMatch[1])
	const minutes = Number(timeMatch[2])
	const meridiem = timeMatch[3]?.toLowerCase()
	if (minutes > 59 || (meridiem ? hours < 1 || hours > 12 : hours > 23)) return null
	if (meridiem === "p" && hours < 12) hours += 12
	if (meridiem === "a" && hours === 12) hours = 0
	const releaseDate = new Date(referenceDate)
	const daysUntilRelease = (weekday - referenceDate.getDay() + 7) % 7
	releaseDate.setDate(releaseDate.getDate() + daysUntilRelease)
	releaseDate.setHours(hours, minutes, 0, 0)
	return releaseDate.toISOString()
}

export function isCalendarReleaseQueued(card: ParentNode) {
	return card.querySelector('[data-t="remove-from-watchlist-btn"]') !== null
}

function getCalendarWeekdayIndex(label: string, locale: string) {
	const formatter = new Intl.DateTimeFormat(locale, { weekday: "long" })
	const referenceSunday = new Date(2026, 0, 4)
	for (let weekday = 0; weekday < 7; weekday++) {
		if (
			normalizeCalendarText(
				formatter.format(
					new Date(referenceSunday.getFullYear(), referenceSunday.getMonth(), referenceSunday.getDate() + weekday),
				),
				locale,
			) === normalizeCalendarText(label, locale)
		) {
			return weekday
		}
	}
	return null
}

export function isCalendarReleaseUpcoming(time: string, now = new Date()) {
	const release = new Date(time)
	if (Number.isNaN(release.getTime())) return false
	const daysUntilRelease = (release.getDay() - now.getDay() + 7) % 7
	if (daysUntilRelease !== 0) return true
	return release.getHours() * 60 + release.getMinutes() > now.getHours() * 60 + now.getMinutes()
}

export function isCalendarReleaseAlreadyShown(
	title: string | null | undefined,
	shownTitles: ReadonlySet<string>,
	locale: string,
) {
	if (!title) return false
	const normalizedTitle = normalizeCalendarText(title, locale)
	return Array.from(shownTitles).some((shownTitle) => normalizeCalendarText(shownTitle, locale) === normalizedTitle)
}

export function formatCalendarReleaseTime(time: string, locale: string, use24Hour?: boolean) {
	const options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" }
	if (use24Hour !== undefined) options.hourCycle = use24Hour ? "h23" : "h12"
	return new Date(time).toLocaleTimeString(locale, options)
}

export function shouldHideCalendarRelease(card: ParentNode, filterQueued: boolean) {
	const isPremiere = card.querySelector('[data-t="premiere-tag"]') !== null
	return filterQueued && !isCalendarReleaseQueued(card) && !isPremiere
}

function getCalendarItemKey(item: CrunchyList[number]) {
	if (item.href?.includes("/watch/")) return item.href
	const release = new Date(item.time)
	return `${item.href ?? ""}|${release.getDay()}|${release.getHours()}:${release.getMinutes()}`
}

export function getCalendarItemsFromPage(
	columns: HTMLElement[],
	locale: string,
): { items: CrunchyList; shownTitles: Set<string> } {
	const items: CrunchyList = []
	const shownTitles = new Set<string>()
	columns.forEach((column) => {
		const weekdayLabel = column.querySelector(".day-weekday")?.textContent?.trim() ?? ""
		column
			.querySelectorAll<HTMLElement>('[data-t="release-calendar-card"]:not([data-enhanced-saved-calendar])')
			.forEach((card) => {
				const seriesLink = card.querySelector<HTMLAnchorElement>('[data-t="series-page-link"]')
				const name = seriesLink?.textContent?.trim()
				if (name) shownTitles.add(name)
				if (!isCalendarReleaseQueued(card)) return
				const timeLabel = card.querySelector('[data-t="publish-time"]')?.textContent ?? ""
				const time = parseCalendarReleaseTimestamp(weekdayLabel, timeLabel, locale)
				if (!seriesLink?.href || !name || !time) return
				items.push({ href: seriesLink.href, name, time })
			})
	})
	return { items, shownTitles }
}

export function createSavedCalendarCell(item: CrunchyList[number], locale: string, use24Hour: boolean) {
	const cell = document.createElement("div")
	cell.className = "grid-cell enhanced-saved-calendar-cell"
	cell.setAttribute(savedCalendarAttribute, getCalendarItemKey(item))

	const card = document.createElement("div")
	card.className = "release-calendar-card--Aj27Z erc-release-card"
	const imageLink = document.createElement("a")
	imageLink.className = "release-calendar-card__thumbnail-wrapper--AYnvY"
	imageLink.href = item.href ?? ""
	imageLink.setAttribute("data-t", "series-page-link")
	const thumbnail = document.createElement("div")
	thumbnail.className = "release-calendar-card__thumbnail--2l0P2"
	const image = document.createElement("img")
	image.src = extensionLogo
	image.alt = ""
	image.loading = "lazy"
	image.style.width = "100%"
	image.style.aspectRatio = "16 / 9"
	image.style.objectFit = "contain"
	thumbnail.appendChild(image)
	imageLink.appendChild(thumbnail)
	card.appendChild(imageLink)

	const body = document.createElement("div")
	body.className = "release-calendar-card__body--qWW18"
	const time = document.createElement("span")
	time.className = "text--gq6o- text--is-bold--yth2a text--is-s--JP2oa release-calendar-card__publish-time--ERS32"
	time.setAttribute("data-t", "publish-time")
	time.textContent = formatCalendarReleaseTime(item.time, locale, use24Hour)
	body.appendChild(time)

	const title = document.createElement("h4")
	title.className = "text--gq6o- text--is-bold--yth2a text--is-m--pqiL- release-calendar-card__title--qU4s8"
	const titleLink = document.createElement("a")
	titleLink.className = "release-calendar-card__title-link--49V7a"
	titleLink.href = item.href ?? ""
	titleLink.setAttribute("data-t", "series-page-link")
	titleLink.textContent = item.name ?? ""
	title.appendChild(titleLink)
	body.appendChild(title)
	card.appendChild(body)
	cell.appendChild(card)
	return cell
}

function syncSavedCalendar(columns: HTMLElement[], locale: string) {
	const currentDate = new Date()
	const use24Hour =
		document.querySelector<HTMLInputElement>('input[name="release-calendar-time-format"]')?.checked ?? false
	const { items: liveItems, shownTitles } = getCalendarItemsFromPage(columns, locale)
	const upcomingLiveItems = liveItems.filter((item) => isCalendarReleaseUpcoming(item.time, currentDate))
	const previousItems = toRaw(crunchyList.value).filter((item) => {
		if (!item.href || !item.name || !isCalendarReleaseUpcoming(item.time, currentDate)) return false
		return !isCalendarReleaseAlreadyShown(item.name, shownTitles, locale)
	})
	const itemsByKey = new Map<string, CrunchyList[number]>()
	;[...previousItems, ...upcomingLiveItems].forEach((item) => itemsByKey.set(getCalendarItemKey(item), item))
	const savedItems = [...itemsByKey.values()].sort((a, b) => Date.parse(a.time) - Date.parse(b.time))
	if (JSON.stringify(toRaw(crunchyList.value)) !== JSON.stringify(savedItems)) crunchyList.value = savedItems

	document.querySelectorAll('[data-t="day-empty-message"]').forEach((message) => message.remove())
	const displayedKeys = new Set(upcomingLiveItems.map(getCalendarItemKey))
	const savedItemsByKey = new Map(savedItems.map((item) => [getCalendarItemKey(item), item]))
	document.querySelectorAll<HTMLElement>(`[${savedCalendarAttribute}]`).forEach((cell) => {
		const key = cell.getAttribute(savedCalendarAttribute) ?? ""
		const item = savedItemsByKey.get(key)
		if (!item || !isCalendarReleaseUpcoming(item.time, currentDate)) cell.remove()
		else {
			const time = cell.querySelector("time")
			if (time) time.textContent = formatCalendarReleaseTime(item.time, locale, use24Hour)
		}
	})
	savedItems.forEach((item) => {
		if (
			!isCalendarReleaseUpcoming(item.time, currentDate) ||
			displayedKeys.has(getCalendarItemKey(item)) ||
			isCalendarReleaseAlreadyShown(item.name, shownTitles, locale)
		)
			return
		const itemWeekday = new Date(item.time).getDay()
		const column = columns.find((candidate) => {
			const weekdayLabel = candidate.querySelector(".day-weekday")?.textContent?.trim() ?? ""
			return getCalendarWeekdayIndex(weekdayLabel, locale) === itemWeekday
		})
		const dayBody = column?.querySelector<HTMLElement>(".day-body")
		const itemKey = getCalendarItemKey(item)
		const alreadySaved = Array.from(dayBody?.querySelectorAll<HTMLElement>(`[${savedCalendarAttribute}]`) ?? []).some(
			(cell) => cell.getAttribute(savedCalendarAttribute) === itemKey,
		)
		if (dayBody && !alreadySaved) dayBody.appendChild(createSavedCalendarCell(item, locale, use24Hour))
	})
}

function applyQueuedCalendarFilter() {
	const filter = document.querySelector<HTMLInputElement>("#enhanced-filter-queued")
	if (filter && filter.checked !== settings.value.Crunchyroll.filterQueued) {
		filter.checked = settings.value.Crunchyroll.filterQueued
	}
	document
		.querySelectorAll<HTMLElement>('[data-t="release-calendar-card"]:not([data-enhanced-saved-calendar])')
		.forEach((card) => {
			const cell = card.closest<HTMLElement>('[data-t="release-cell"]') ?? card
			const shouldHide = shouldHideCalendarRelease(card, settings.value.Crunchyroll.filterQueued)
			if (cell.classList.contains(calendarHiddenClass) !== shouldHide) {
				cell.classList.toggle(calendarHiddenClass, shouldHide)
			}
		})
}

function addCalendarStyles() {
	if (document.getElementById("enhanced-crunchyroll-calendar-style")) return
	const style = document.createElement("style")
	style.id = "enhanced-crunchyroll-calendar-style"
	style.textContent = `
		.${calendarHiddenClass} { display: none !important; }
		.enhanced-calendar-filter { display: inline-flex; align-items: center; gap: 0.5rem; }
	`
	document.head.appendChild(style)
}

function addQueuedCalendarFilter() {
	const titleGroup = document.querySelector<HTMLElement>(".title-group")
	if (!titleGroup || titleGroup.querySelector("#enhanced-filter-queued")) return
	const label = document.createElement("label")
	label.className = "enhanced-calendar-filter"
	label.htmlFor = "enhanced-filter-queued"
	const input = document.createElement("input")
	input.id = "enhanced-filter-queued"
	input.type = "checkbox"
	input.checked = settings.value.Crunchyroll.filterQueued
	input.addEventListener("change", () => {
		settings.value.Crunchyroll.filterQueued = input.checked
		applyQueuedCalendarFilter()
	})
	const text = document.createElement("span")
	text.textContent = "Show watchlist only"
	label.append(input, text)
	titleGroup.appendChild(label)
}

let calendarSyncTimeout: ReturnType<typeof setTimeout> | undefined
let calendarObserver: MutationObserver | undefined
function syncReleaseCalendar() {
	if (!location.pathname.includes("/releasecalendar")) return
	const columns = Array.from(document.querySelectorAll<HTMLElement>('section[data-t="day-column"]'))
	if (columns.length === 0) return
	addCalendarStyles()
	addQueuedCalendarFilter()
	applyQueuedCalendarFilter()
	syncSavedCalendar(columns, document.documentElement.lang || navigator.language)
}

function Crunchyroll_ReleaseCalendar() {
	if (calendarObserver) return
	calendarObserver = new MutationObserver(() => {
		clearTimeout(calendarSyncTimeout)
		calendarSyncTimeout = setTimeout(syncReleaseCalendar, 100)
	})
	calendarObserver.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["data-t", "aria-checked"],
		characterData: true,
		childList: true,
		subtree: true,
	})
	syncReleaseCalendar()
}
// #endregion
// #endregion
startCrunchyroll()
