import { sendMessage } from "webext-bridge/content-script"
console.log("shared-functions loaded")
// Global Variables

// Set to true to re-enable the verbose "[RatingDebug]" logging added while diagnosing the Netflix
// 2026 UI redesign (broken rating/hideTitles/removeGames selectors). Kept as a one-line toggle in
// case similar selector breakage needs debugging again in the future.
const DEBUG = false
const { data: settings, promise } = useBrowserSyncStorage<settingsType>("settings", defaultSettings)
const { data: hideTitles, promise: hideTitlesPromise } = useBrowserSyncStorage<BooleanObject>("hideTitles", {}, false)
export const date = new Date()
const today = date.toISOString().split("T")[0]

const ua = navigator.userAgent
const isMobile = /mobile|streamingEnhanced/i.test(ua)
let url = globalThis.location.href
const hostname = globalThis.location.hostname
const title = document.title
let isPrimeVideo = /amazon|primevideo/i.test(hostname) && (/video/i.test(title) || /video/i.test(url))
let isNetflix = /netflix/i.test(hostname)
let isDisney = /disneyplus|starplus/i.test(hostname)
let isHotstar = /hotstar|jiostar|jiocinema/i.test(hostname)
let isHBO = /max.com/i.test(hostname)
let isParamount = /paramount/i.test(hostname) || /paramountplus/i.test(hostname)
const htmlLang = document.documentElement.lang

const AmazonVideoClass = ".dv-player-fullscreen video"
let DBCache: DBCacheType = {}

export enum Platforms {
	Netflix = "netflix",
	Amazon = "amazon",
	StarPlus = "starplus",
	Disney = "disney",
	Hotstar = "hotstar",
	Crunchyroll = "crunchyroll",
	HBO = "hbo",
	Paramount = "paramount",
}

export async function startSharedFunctions(platform: Platforms) {
	if (platform == Platforms.Amazon) isPrimeVideo = true
	if (platform == Platforms.Netflix) isNetflix = true
	if (platform == Platforms.Disney) isDisney = true
	if (platform == Platforms.Hotstar) isHotstar = true
	if (platform == Platforms.HBO) isHBO = true
	if (platform == Platforms.Paramount) isParamount = true

	await promise
	if (isNetflix) {
		await hideTitlesPromise
		console.log("hideTitles", hideTitles.value)
	}
	if (settings.value.Video.playOnFullScreen) startPlayOnFullScreen()
	getDBCache()
}
export function getCurrentEpisodeNumber(title: string | null | undefined) {
	if (!title) return null

	// Works across "Season 2, Ep. 1", "Staffel 2, F. 1", etc.
	const nums = title.match(/\d+/g)?.map(Number) ?? []
	if (nums.length === 0) return null
	// usually [season, episode] -> take last number
	return nums.at(-1)
}

type MovieInfo = {
	id: number
	title: string
	score: number
	vote_count: number
	release_date: string
	media_type: string
	date: string
	db: string
}
type DBCacheType = {
	[title: string]: MovieInfo
}
async function getDBCache() {
	const result = await browser.storage.local.get("DBCache")
	DBCache = result?.DBCache as DBCacheType
	if (typeof DBCache !== "object") {
		console.log("DBCache not found, creating new one", DBCache)
		try {
			await browser.storage.local.set({ DBCache: {} })
		} catch (error) {
			console.log(error)
		}
		DBCache = {}
	} else {
		// One-time repair: entries with no "id" mean the TMDB lookup failed outright when they were cached
		// (e.g. missing/invalid TMDB_TOKEN, rate limiting, network error at the time). Keep them around so
		// they display "?" for now, but never let the "fresh cache" 7-day shortcut trust them - that check
		// lives in addRating() and requires an "id" to be present. Here we just log how many are affected
		// so it's clear in the console why some ratings were stuck on "?" before this fix.
		const failedLookups = Object.keys(DBCache).filter((key) => !DBCache[key]?.id && !DBCache[key]?.score)
		if (DEBUG && failedLookups.length > 0) {
			console.log(
				`[RatingDebug] ${failedLookups.length} cached title(s) had no TMDB match recorded (likely from a previous run without a valid TMDB_TOKEN). They will be retried automatically instead of staying stuck on "?".`,
				failedLookups,
			)
		}
	}
	if (isNetflix) {
		if (settings.value.Netflix?.showRating || settings.value.Netflix?.hideTitles)
			startShowRatingInterval(settings.value.Netflix?.showRating, settings.value.Netflix?.hideTitles)
	} else if (isDisney || isHotstar) {
		if (settings.value.Disney?.showRating || settings.value.Disney?.hideTitles)
			startShowRatingInterval(settings.value.Disney?.showRating, settings.value.Disney?.hideTitles)
	} else if (isPrimeVideo && settings.value.Amazon?.showRating) startShowRatingInterval()
	else if (isHBO && settings.value.HBO?.showRating) startShowRatingInterval()
	else if (isParamount && settings.value.Paramount?.showRating) startShowRatingInterval()
	if (getDiffInDays(settings.value.General.GCdate, date) >= GCdiff) garbageCollection()

	browser.storage.onChanged.addListener(function (changes, areaName) {
		if (areaName === "local" && changes?.DBCache) DBCache = changes.DBCache.newValue as DBCacheType
	})
}
// set DB Cache if cache size under 5MB
async function setDBCache() {
	const size = new TextEncoder().encode(JSON.stringify(DBCache)).length
	const kiloBytes = size / 1024
	const megaBytes = kiloBytes / 1024
	if (megaBytes < 5) {
		console.log("updateDBCache size:", megaBytes.toFixed(4) + " MB")
		await browser.storage.local.set({ DBCache })
	} else {
		console.log("DBCache cleared", megaBytes)
		DBCache = {}
		await browser.storage.local.set({ DBCache })
	}
}

// how long a record should be kept in the cache
const GCdiff = 30
async function garbageCollection() {
	// clear every rating older than 30 days
	// clear every rating where db != tmdb
	console.log("garbageCollection started, deleting old ratings:")
	const keys = Object.keys(DBCache)
	for (const key of keys) {
		if (getDiffInDays(DBCache[key].date, date) >= GCdiff || DBCache[key].db != "tmdb") {
			console.log(DBCache[key].date, key)
			delete DBCache[key]
		}
	}
	settings.value.General.GCdate = today
	setDBCache()
}
// #region exported functions
// parse string time to seconds e.g. 1:30 -> 90
export function parseAdTime(adTimeText: string | null) {
	if (!adTimeText) return false
	const adTime: number =
		Number.parseInt(/:\d+/.exec(adTimeText ?? "")?.[0].substring(1) ?? "") +
		Number.parseInt(/\d+/.exec(adTimeText ?? "")?.[0] ?? "") * 60
	if (Number.isNaN(adTime)) return false
	return adTime
}

export function createSlider(
	video: HTMLVideoElement,
	videoSpeed: Ref<number>,
	position: HTMLElement,
	sliderStyle: string,
	speedStyle: string,
	divStyle = "",
	cleanupTarget: HTMLElement | null | undefined = null,
) {
	videoSpeed.value = videoSpeed.value || video.playbackRate

	const slider = document.createElement("input")
	slider.id = "videoSpeedSlider"
	slider.type = "range"
	slider.min = settings.value.General.sliderMin.toString()
	slider.max = settings.value.General.sliderMax.toString()
	slider.value = (videoSpeed.value * 10).toString()
	slider.step = settings.value.General.sliderSteps.toString()
	slider.style.cssText = sliderStyle

	const speed = document.createElement("p")
	speed.id = "videoSpeed"
	speed.textContent = videoSpeed.value ? videoSpeed.value.toFixed(1) + "x" : "1.0x"
	watch(videoSpeed, (newValue) => {
		speed.textContent = newValue.toFixed(1) + "x"
		slider.value = (newValue * 10).toString()
	})
	speed.style.cssText = speedStyle
	if (divStyle) {
		const div = document.createElement("div")
		div.style.cssText = divStyle
		div.appendChild(slider)
		div.appendChild(speed)
		position.prepend(div)
	} else position.prepend(slider, speed)

	// removes slider if the target element is removed from the DOM
	if (cleanupTarget) {
		const cleanup = () => {
			if (divStyle) {
				slider.parentElement?.remove()
			} else {
				slider.remove()
				speed.remove()
			}
		}
		const cleanupObserver = new MutationObserver(() => {
			if (!cleanupTarget.isConnected) {
				cleanup()
				cleanupObserver.disconnect()
			}
		})
		cleanupObserver.observe(document.body ?? document.documentElement, { childList: true, subtree: true })
		if (!cleanupTarget.isConnected) {
			cleanup()
			cleanupObserver.disconnect()
		}
	}

	if (videoSpeed.value) video.playbackRate = videoSpeed.value
	speed.onclick = function (event) {
		event.stopPropagation()
		event.preventDefault()
		event.stopImmediatePropagation()
		slider.style.display = slider.style.display === "block" ? "none" : "block"
	}
	slider.onclick = function (event) {
		event.stopPropagation()
		event.preventDefault()
		event.stopImmediatePropagation()
	}
	slider.oninput = function (event) {
		event.stopPropagation()
		event.preventDefault()
		event.stopImmediatePropagation()
		const sliderValue = Number.parseFloat(slider.value)
		speed.textContent = (sliderValue / 10).toFixed(1) + "x"
		video.playbackRate = sliderValue / 10
		videoSpeed.value = sliderValue / 10
	}

	return { slider, speed }
}
// #endregion

// #region startSharedFuncs
type TMDBMovie = {
	adult: boolean
	backdrop_path: string
	genre_ids: Array<number>
	id: number
	original_language: string
	original_title: string
	original_name: string
	overview: string
	popularity: number
	poster_path: string
	release_date: string
	first_air_date: string
	title: string
	name: string
	video: boolean
	vote_average: number
	vote_count: number
	media_type: string
}
type TMDBResponse = {
	page: number
	results: Array<TMDBMovie>
	total_pages: number
	total_results: number
}

async function getMovieInfo(
	title: string,
	card: HTMLElement,
	media_type: string | null = null,
	year: string | null = null,
) {
	const locale = htmlLang || navigator?.language || "en-US"
	const queryType = media_type ?? "multi"
	let url = `https://api.themoviedb.org/3/search/${queryType}?query=${encodeURIComponent(title)}&include_adult=false&language=${locale}&page=1`
	if (year) url += `&year=${year}`
	const data: TMDBResponse = await sendMessage("fetch", { url }, "background")
	// TMDB returns { success: false, status_code, status_message } on auth errors (e.g. missing/invalid TMDB_TOKEN)
	// instead of throwing, so we need to detect that shape explicitly to tell it apart from "no results found".
	const errorData = data as unknown as { success?: boolean; status_code?: number; status_message?: string }
	if (errorData?.success === false) {
		if (DEBUG) {
			console.error(
				"%c[RatingDebug] TMDB API error - ratings will show '?' until this is fixed:",
				"color:red;font-weight:bold;",
				errorData.status_message,
				"(status_code:",
				errorData.status_code,
				"). This usually means TMDB_TOKEN is missing/invalid in your local build. Add a valid token to a .env file at the project root (TMDB_TOKEN=...), then rebuild with 'npm run build:chrome'.",
			)
		}
		return
	}
	if (data != undefined) {
		if (data?.results) data.results = data.results?.filter((item) => item.media_type?.toLowerCase() !== "person")
		// themoviedb
		const movie = data?.results?.[0]
		const compiledData: MovieInfo = {
			id: movie?.id,
			media_type: queryType == "multi" ? movie?.media_type : queryType,
			score: movie?.vote_average,
			vote_count: movie?.vote_count,
			release_date: movie?.release_date || movie?.first_air_date,
			title: movie?.title || movie?.original_title || movie?.name || movie?.original_name,
			date: today,
			db: "tmdb",
		}
		DBCache[title] = compiledData
		setRatingOnCard(card, compiledData, title)
	}
}

// show rating depending on page
const uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/g
function showRating() {
	if (isDisney) {
		url = globalThis.location.href
		// disable search and suggested movies
		if (url.includes("search")) return false
		if (url.includes("entity")) {
			const SelectedTab = document.querySelector('[aria-selected="true"]')
			return (
				uuidRegex.test(SelectedTab?.id?.split("_control")?.[0] ?? "") &&
				SelectedTab?.getAttribute("aria-label") != "EXTRAS"
			)
		}
		return true
	} else if (isPrimeVideo) {
		// suggested movies
		if (globalThis.location.href.includes("detail")) {
			return document.querySelector('[data-testid="btf-related-tab"]')?.getAttribute("tabIndex") == "0"
		}
		return true
	} else return true
}
// hideTitles is used to manually hide shows from the page
async function startShowRatingInterval(optionShowRating = true, optionHideTitles = false) {
	if (showRating()) addRating(optionShowRating, optionHideTitles)
	const RatingInterval = setInterval(function () {
		if (isNetflix) {
			optionShowRating = settings.value.Netflix?.showRating
			optionHideTitles = settings.value.Netflix?.hideTitles
		} else if (isDisney || isHotstar) {
			optionShowRating = settings.value.Disney?.showRating
			optionHideTitles = settings.value.Disney?.hideTitles
		}

		if (
			(isNetflix && !(settings.value.Netflix?.showRating || settings.value.Netflix?.hideTitles)) ||
			(isPrimeVideo && !settings.value.Amazon?.showRating) ||
			((isDisney || isHotstar) && !(settings.value.Disney?.showRating || settings.value.Disney?.hideTitles)) ||
			(isHBO && !settings.value.HBO?.showRating) ||
			(isParamount && !settings.value.Paramount?.showRating)
		) {
			console.log("stopped adding Rating")
			clearInterval(RatingInterval)
			return
		}
		if (showRating()) addRating(optionShowRating, optionHideTitles)
	}, 1000)
}
function getDiffInDays(firstDate: string, secondDate: Date) {
	if (!firstDate || !secondDate) return 31
	return Math.round(Math.abs(new Date(secondDate).getTime() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24))
}

// DBCache logic
// 1. Condition No Cached Rating -> Fetch Rating
// 2. Condition No Rating but in Cache if cache older than 7 days -> Fetch Rating
// 3. Condition Cached Rating older than 30 days -> Fetch Rating
// 4. Condition Cached Rating older than 1 day, Vote count under 100 and Release date in the last 50 days -> Fetch Rating
// 5. Condition if media_type is not matching -> Fetch Rating
function useDBCache(title: string, card: HTMLElement, media_type: string | null) {
	if (!DBCache[title]?.date) DBCache[title].date = today
	const vote_count = DBCache[title]?.vote_count || 100
	const diffInReleaseDate =
		// vote count is under 80 inaccurate rating
		vote_count < 100 &&
		// did not refresh rating in the last 0 days
		getDiffInDays(DBCache[title].date, date) > 1 &&
		// release date is in the last 50 days after not many people will
		getDiffInDays(DBCache[title]?.release_date, date) <= 50

	// refresh rating if older than 30 days or release date is in last month and vote count is under 100
	if (getDiffInDays(DBCache[title].date, date) >= GCdiff || diffInReleaseDate) {
		if (diffInReleaseDate)
			console.log(
				"update recent movie:",
				title,
				",refresh:",
				getDiffInDays(DBCache[title].date, date),
				",Age:",
				getDiffInDays(DBCache[title]?.release_date, date),
				"Vote count:",
				vote_count,
			)
		else console.log("update old rating:", title, ",Age:", getDiffInDays(DBCache[title].date, date))
		getMovieInfo(title, card, media_type)
	} else {
		setRatingOnCard(card, DBCache[title], title)
	}
}
export type MediaType = "tv" | "movie" | null
function Amazon_getMediaType(type: string): MediaType {
	if (!type) return null
	if (type.toLowerCase().includes("tv")) return "tv"
	if (type.toLowerCase().includes("movie")) return "movie"
	return null
}
function getAllTitleCardsTypes(): Array<NodeListOf<Element>> {
	let AllTitleCardsTypes: Array<NodeListOf<Element>> = []
	if (isNetflix) {
		// Netflix 2026 UI redesign: cards are now anchors with a stable data-uia attribute
		// (e.g. <a data-uia="standard-card" aria-label="Title" href="/browse?jbv=ID">), the old
		// ".title-card .boxart-container" classes are gone. "cloud-game-card" is excluded here
		// since games are handled separately by removeGames.
		const modernCards = document.querySelectorAll(
			'a[data-uia="standard-card"]:not(.imdb), a[data-uia="progress-card"]:not(.imdb)',
		)
		if (modernCards.length > 0) {
			AllTitleCardsTypes = [modernCards]
		} else {
			// legacy fallback (older Netflix builds)
			AllTitleCardsTypes = [document.querySelectorAll(".title-card .boxart-container:not(.imdb)")]
		}
	} else if (isDisney)
		AllTitleCardsTypes = [document.querySelectorAll("a[data-testid='set-item']:not([href^='/browse/page']):not(.imdb)")]
	else if (isHotstar)
		AllTitleCardsTypes = [
			document.querySelectorAll(
				"[data-testid='tray-card-default']:not(.imdb), [data-testid='tray-horizontal-card-hover']:not(.imdb)",
			),
		]
	else if (isHBO) AllTitleCardsTypes = [document.querySelectorAll("a[class*='StyledTileLinkNormal-']:not(.imdb)")]
	else if (isParamount)
		AllTitleCardsTypes = [document.querySelectorAll("a[href*='/shows']:not(.imdb), a[href*='/movies']:not(.imdb)")]
	else if (isPrimeVideo)
		AllTitleCardsTypes = [
			document.querySelectorAll(
				"li article[data-card-title]:not([data-card-entity-type='EVENT']):not([data-card-title='Live-TV']):not(:has(#rating))",
			),
			document.querySelectorAll("article[data-testid*='-card']:not(:has(#rating))"),
		]
	return AllTitleCardsTypes
}
function isElementVisible(el: HTMLElement): boolean {
	// return true
	if (!el) return false
	const rect = el.getBoundingClientRect()
	const visible =
		// el.checkVisibility({ checkOpacity: true, visibilityProperty: true, contentVisibilityAuto: true }) &&
		rect.bottom > 0 &&
		rect.right > 0 &&
		rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
		rect.left < (window.innerWidth || document.documentElement.clientWidth)
	return visible
}

// throttle noisy debug logs so we don't flood the console on every 1s interval tick
let lastAddRatingDebugLog = 0
let cardSelectorDiscoveryLastUrl = ""
// One-shot(per url) discovery helper: when the normal selectors find 0 cards, walk up from more
// resilient anchors (links to /title/, /watch/, or elements with aria-label + img) so we can read
// the *current* class names / data attributes Netflix (or another site) is using, straight from the console,
// without needing to manually open devtools and inspect an element.
function discoverNetflixCardSelectors() {
	if (cardSelectorDiscoveryLastUrl === url) return
	cardSelectorDiscoveryLastUrl = url
	const anchors = Array.from(document.querySelectorAll('a[href*="/title/"], a[href*="/watch/"]')) as HTMLElement[]
	console.log("%c[RatingDebug][Discover][Netflix] anchors linking to /title/ or /watch/ found:", "color:#ff9800;font-weight:bold;", anchors.length)
	const seen = new Set<string>()
	for (const a of anchors.slice(0, 40)) {
		let el: HTMLElement | null = a
		const chain: Array<string> = []
		for (let depth = 0; depth < 6 && el; depth++) {
			const cls = typeof el.className === "string" && el.className ? ` class="${el.className}"` : ""
			const testId = el.getAttribute?.("data-testid")
			const dataUia = el.getAttribute?.("data-uia")
			const extra = (testId ? ` data-testid="${testId}"` : "") + (dataUia ? ` data-uia="${dataUia}"` : "")
			chain.push(`<${el.tagName.toLowerCase()}${cls}${extra}>`)
			el = el.parentElement
		}
		const key = chain.join(" > ")
		if (!seen.has(key)) {
			seen.add(key)
			console.log(
				"[RatingDebug][Discover][Netflix] ancestor chain (closest -> up 6 levels):",
				chain.join(" > "),
				"| aria-label on anchor or parent:",
				a.getAttribute("aria-label") || a.parentElement?.getAttribute("aria-label") || null,
			)
		}
	}
	if (anchors.length === 0) {
		console.log(
			"[RatingDebug][Discover][Netflix] no anchors with /title/ or /watch/ found either. Trying broader search for elements with aria-label + img",
		)
		const candidates = Array.from(document.querySelectorAll("[aria-label] img, img[alt]")).slice(0, 20)
		for (const img of candidates) {
			const container = img.closest("[aria-label]") || img.parentElement
			console.log("[RatingDebug][Discover][Netflix] candidate card element:", container, "img alt:", img.getAttribute("alt"))
		}
	}
}
async function addRating(showRating: boolean, optionHideTitles: boolean) {
	url = globalThis.location.href
	const AllTitleCardsTypes = getAllTitleCardsTypes()
	if (DEBUG && Date.now() - lastAddRatingDebugLog > 5000) {
		lastAddRatingDebugLog = Date.now()
		console.log("%c[RatingDebug] cards found per selector", "color:#00aeef;font-weight:bold;", {
			url,
			showRating,
			optionHideTitles,
			cardCounts: AllTitleCardsTypes.map((list) => list.length),
		})
		if (AllTitleCardsTypes.every((list) => list.length === 0)) {
			console.warn(
				"[RatingDebug] no title cards matched any selector. The site's HTML/CSS classes for cards have likely changed, see getAllTitleCardsTypes()",
			)
			if (isNetflix) discoverNetflixCardSelectors()
		}
	}
	// on disney there are multiple images for the same title so only use the first one
	let lastTitle = ""
	// for each is not going in order on chrome
	let updateDBCache = false
	for (let type = 0; type < AllTitleCardsTypes.length; type++) {
		const titleCards = AllTitleCardsTypes[type]
		for (let i = 0; i < titleCards.length; i++) {
			const card = titleCards[i] as HTMLElement
			// add seen class
			if (isNetflix || isDisney || isHotstar || isHBO || isParamount) card.classList.add("imdb")
			else if (isPrimeVideo) {
				if (type == 0) card?.closest("li")?.classList.add("imdb")
				else if (type == 1) card?.classList.add("imdb")
			}
			const media_type = getMediaType(card)
			const title = getCleanTitle(card, type)
			if (!title) {
				if (DEBUG && isNetflix)
					console.log(
						"[RatingDebug][Netflix] could not extract title (parentElement aria-label missing/empty) for card",
						card,
					)
				continue
			}
			if (optionHideTitles) {
				if (hideTitles.value[title]) {
					if (isNetflix) {
						// legacy UI used ".slider-item"; the 2026 redesign wraps each card in a
						// "[data-virtual-slot]" cell, which is the one we need to hide
						const item = (card.closest(".slider-item") ||
							card.closest("[data-virtual-slot]") ||
							card.parentElement) as HTMLElement
						if (item) item.style.display = "none"
						else if (DEBUG)
							console.warn(
								"[RatingDebug][Netflix] hideTitles: no suitable ancestor found, cannot hide card for title",
								title,
							)
					} else if (isDisney) {
						const item = card.parentElement as HTMLElement
						if (item) item.style.display = "none"
					} else if (isHotstar) {
						const item = (card.closest("[data-testid='tray-card-default']") ||
							card.closest("a") ||
							card.parentElement) as HTMLElement
						if (item) item.style.display = "none"
					}
					settings.value.Statistics.SegmentsSkipped++
					sendMessage("increaseBadge", {}, "background")
					console.log("hideTitle", title)
					continue
				}
				if (isDisney || isHotstar) addHideTitleButton(card, title)
			}

			// for the static Pixar Disney, Starplus etc. cards
			if (showRating && (!isDisney || !card?.classList.contains("_1p76x1y4"))) {
				// sometimes more than one image is loaded for the same title
				if (lastTitle != title && !title.includes("Netflix") && !title.includes("Prime Video")) {
					lastTitle = title
					// Only trust a "fresh cache, no score yet" entry if TMDB actually matched a title (has an id).
					// Entries with no id at all mean the lookup failed outright (e.g. missing/invalid TMDB_TOKEN,
					// rate limiting, network error) and must always be retried, otherwise they'd be stuck showing
					// "?" forever once cached, even after the underlying problem (like a missing token) is fixed.
					if (
						(DBCache[title]?.score ||
							(DBCache[title]?.id && getDiffInDays(DBCache[title]?.date, date) <= 7)) &&
						(!media_type || DBCache[title]?.media_type == media_type)
					) {
						useDBCache(title, card, media_type)
					}
					// if element is not visible skip it
					else if (!isElementVisible(card)) {
						if (isNetflix || isDisney || isHotstar || isHBO || isParamount) card.classList.remove("imdb")
						else if (isPrimeVideo) {
							if (type == 0) card?.closest("li")?.classList.remove("imdb")
							else if (type == 1) card?.classList.remove("imdb")
						}
						continue
					} else {
						getMovieInfo(title, card, media_type)
						updateDBCache = true
					}
				}
			}
		}
	}
	if (updateDBCache) {
		setTimeout(function () {
			setDBCache()
		}, 5000)
	}
}
function addHideTitleButton(card: HTMLElement, title: string) {
	let target: HTMLElement
	if (isHotstar) {
		// For Hotstar, always target the outermost card container to avoid breaking internal layout
		target = (card.closest("[data-testid='tray-card-default']") ||
			card.closest("[data-testid='tray-horizontal-card-hover']") ||
			card) as HTMLElement
	} else {
		target = card.parentElement as HTMLElement
	}
	if (!target || target.querySelector("#hideTitleButton")) return

	const button = document.createElement("button")
	button.id = "hideTitleButton"
	button.textContent = "X"
	button.style.cssText =
		"position: absolute; top: 0; right: 0; background: transparent; color: white; border: none; font-size: 12px;text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black; z-index: 10;"
	button.onclick = function (event) {
		// stop propagation
		event.stopPropagation()
		event.preventDefault()
		const item = target
		if (item) item.style.display = "none"
		hideTitles.value[title] = true
		console.log("hideTitles", hideTitles.value)
	}
	target.appendChild(button)
}
function getMediaType(card: HTMLElement): MediaType {
	let media_type: MediaType = null
	if (isNetflix) {
		if (url.includes("genre/83")) media_type = "tv"
		else if (url.includes("genre/34399")) media_type = "movie"
	} else if (isDisney) {
		if (url.includes("browse/series")) media_type = "tv"
		else if (url.includes("browse/movies")) media_type = "movie"
		else if (/(Staffel)|(Nummer)|(Season)|(Episod)|(Number)/g.test(title ?? "")) media_type = "tv"
	} else if (isParamount) {
		const href = card.getAttribute("href") || ""
		if (href.includes("/shows/")) media_type = "tv"
		else if (href.includes("/movies/")) media_type = "movie"
	} else if (isHBO) {
		const href = card.getAttribute("href") || ""
		if (href.includes("show") || href.includes("series")) media_type = "tv"
		else if (href.includes("movie")) media_type = "movie"
	} else if (isPrimeVideo) {
		if (url.includes("video/tv")) media_type = "tv"
		else if (url.includes("video/movie")) media_type = "movie"
		else media_type = Amazon_getMediaType(card.dataset.cardEntityType ?? "")
	} else if (isHotstar) {
		if (url.includes("/movies/")) media_type = "movie"
		else if (url.includes("/tv-shows/")) media_type = "tv"
	}
	return media_type
}

function getCleanTitle(card: HTMLElement, type: number): string | undefined {
	let title: string | undefined
	if (isNetflix) {
		// Netflix 2026 UI: aria-label is on the card <a> itself (data-uia="standard-card"/"progress-card")
		const ownAriaLabel = card?.getAttribute("aria-label")
		if (ownAriaLabel) {
			title = ownAriaLabel.split(" (")[0]
		} else {
			// legacy fallback: aria-label was on the parent element in the older UI
			const parentAriaLabel = card?.parentElement?.getAttribute("aria-label")
			title = parentAriaLabel?.split(" (")[0]
			if (DEBUG && !parentAriaLabel)
				console.log(
					"[RatingDebug][Netflix] getCleanTitle: no aria-label found on card or its parent, DOM structure may have changed",
					card,
				)
		}
	} else if (isDisney) {
		const prompt = card.querySelector('div[data-testid="hero-carousel-prompt"]')
		if (prompt?.textContent)
			title = Disney_fixTitle(card?.getAttribute("aria-label")?.replace(" " + prompt.textContent, ""))
		else title = Disney_fixTitle(card?.getAttribute("aria-label") ?? undefined)
		// no section Extras on disney shows
		if (url.includes("entity")) {
			const SelectedTabId = document.querySelector('[aria-selected="true"]')?.id.split("_control")[0]
			if (SelectedTabId != card.closest('div[role="tabpanel"]')?.id) title = ""
		}
	} else if (isHotstar) {
		const rawTitle =
			card?.querySelector("[data-testid='action']")?.getAttribute("aria-label") ||
			card?.querySelector("a")?.getAttribute("aria-label") ||
			card?.getAttribute("aria-label") ||
			card?.getAttribute("alt") ||
			card.querySelector("img")?.getAttribute("alt") ||
			card.querySelector("[data-testid='card-hover-title-cutout'] img")?.getAttribute("alt") ||
			card.querySelector("span")?.textContent ||
			""
		// Cleaning: Remove "S1 E1", trailing numbers like " 2", and split by comma
		title = rawTitle
			.replaceAll(/(S\d+\sE\d+)/g, "")
			.split(",")[0]
			.replace(/\s\d+$/, "") // Remove trailing number (e.g., "Harry Potter 2" -> "Harry Potter")
			.trim()

		if (!title || ["show", "movie", "live", "episode", "special", "free"].includes(title.toLowerCase()))
			title = undefined
	} else if (isPrimeVideo) {
		// detail means not live shows
		if (card.querySelector("a")?.href?.includes("detail")) {
			if (type == 0) title = Amazon_fixTitle(card.dataset.cardTitle ?? "")
			else if (type == 1) title = Amazon_fixTitle(card.querySelector("a")?.getAttribute("aria-label") ?? "")
		}
	} else if (isHBO) {
		const href = card.getAttribute("href") || ""
		if (
			href.includes("show") ||
			href.includes("series") ||
			href.includes("movie") ||
			href.includes("topical") ||
			href.includes("standalone")
		) {
			title = card.querySelector("p[class*='md_strong-']")?.textContent ?? ""
		}
	} else if (isParamount) title = card.getAttribute("title") ?? ""
	return title
}
const Brands = String.raw`Hulu Original Series|Disney\+ Original|STAR (?:Original|Generic)|ZDF Enterprises`
const Badge = String.raw`New(?: (?:Episode|Movie|Series))? Badge|`
export const DISNEY_TITLE_RE_EN = new RegExp(
	[
		String.raw`^`,
		// sometimes there is a "Number 1 " or "Number 2 " badge in the title, but it is not consistent
		String.raw`(?:Number\s+\d+\s+)?`,
		// sometimes there is a "Disney+ Original" or "STAR Original" badge in the title, but it is not consistent
		// starting the non capturing group
		String.raw`(?:(?:`,
		String.raw`Catch Up on the Series|`,
		Badge,
		Brands,
		String.raw`)\s+)*`,
		// ending the non capturing group
		String.raw`\s*`,
		// The title is captured in a non-greedy way until we reach one of the following keywords that indicate additional info, or the end of the string
		String.raw`(?<title>[\s\S]+?)`,
		// lookahead for keywords that indicate end of title and start of additional info, e.g. Season
		String.raw`(?=`,
		// these keywords indicate that the title has ended and additional info has started, such as season number, release date, rating, etc.
		String.raw`\s+(?:`,
		String.raw`Season\b|New Episode\b|Rated\b|Released\b|Coming\b|Prepare\b|Catch Up on the Series|`,
		Badge,
		String.raw`Select for details on this title\.|`,
		String.raw`\d+\s+hour\b|\d+\s+minutes remaining\b|`,
		Brands,
		// or the end of the string
		String.raw`)`,
		String.raw`|$`,
		String.raw`)`,
	].join(""),
)

export const DISNEY_TITLE_RE_DE = new RegExp(
	[
		String.raw`^`,
		// ranking badge
		String.raw`(?:Nummer\s+\d+\s+)?`,
		// provider / brand badges (can appear multiple times, sometimes both before and after "Label: ...")
		String.raw`(?:(?:${Brands})\s+)*`,
		// label badge (can appear multiple times, and may appear before the actual title)
		String.raw`(?:Label:\s+(?:Neuer Film|Neue Serie|Neue Folge|Neu)\s+)*`,
		String.raw`\s*`,
		// Sometimes the UI contains countdown-only tiles like "Nur noch 60 Sekunden ...".
		String.raw`(?!Nur\s+noch\s+\d+\s+Sekunden\b)`,
		// capture the title until we reach one of the known metadata / CTA markers
		String.raw`(?<title>[\s\S]+?)`,
		String.raw`(?=`,
		String.raw`\s+(?:`,
		// typical UI strings
		String.raw`Jetzt\s+aufholen\b|Altersfreigabe:|Erscheinungsjahr:|Genre:|Label:|`,
		String.raw`Ab\b|ab\b|Neue Folge\b|Mach\s+dich\s+bereit\b|`,
		String.raw`Für\s+Details\s+zu\s+diesem\s+Titel\s+auswählen\.|`,
		String.raw`Staffel\b|Folge\b|Noch\b|\d+\s*Stunde\b|\d+\s*Stunden\b|\d+\s*Minuten\b|`,
		Brands,
		String.raw`)`,
		String.raw`|$`,
		String.raw`)`,
	].join(""),
	"u",
)
export function Disney_fixTitle(title: string | undefined): string | undefined {
	// else (htmlLang == "en" || htmlLang == "en-US" || htmlLang == "en-GB")
	const regex = htmlLang == "de" ? DISNEY_TITLE_RE_DE : DISNEY_TITLE_RE_EN
	return title?.match(regex)?.groups?.title?.trim()
}
function Amazon_fixTitle(title: string | undefined) {
	return (
		title
			?.split(" - ")[0]
			?.split(" – ")[0]
			?.replaceAll(/(S\d+)/g, "")
			?.replaceAll(/ \[.*\]/g, "")
			?.replaceAll(/\s\(.*\)/g, "")
			?.replaceAll(/:?\sStaffel-?\s\d+/g, "")
			?.replaceAll(/:?\sSeason-?\s\d+/g, "")
			?.replaceAll(/ \/ \d/g, "")
			?.split(": Die komplette")[0]
			// nicht sicher
			?.split(": The complete")[0]
	)
}

function getColorForRating(rating: number, lowVoteCount: boolean) {
	// I want a color gradient from red to green with yellow in the middle
	// the ratings are between 0 and 10
	// the average rating is 6.5
	// https://distributionofthings.com/imdb-movie-ratings/
	if (!rating || lowVoteCount) return "grey"
	for (const threshold of settings.value.General.RatingThresholds) {
		if (rating <= threshold.value) {
			return threshold.color
		}
	}
}
function getIsTransparent(rating: number, lowVoteCount: boolean) {
	if (!settings.value.Video?.dimLowRatings) return false
	if ((!rating || rating <= settings.value.General.RatingThresholds[0].value) && !lowVoteCount) return true
	return false
}
function getTMDBUrl(id: string | number, media_type: string) {
	return `https://www.themoviedb.org/${media_type}/${id}`
}

async function setRatingOnCard(card: HTMLElement, data: MovieInfo, title: string) {
	let div: HTMLElement
	if (data?.id) {
		if (isHotstar) {
			div = document.createElement("div")
			div.style.cursor = "pointer"
			div.onclick = (event) => {
				event.stopPropagation()
				event.preventDefault()
				window.open(getTMDBUrl(data.id, data.media_type), "_blank")
			}
		} else {
			const a = document.createElement("a")
			a.href = getTMDBUrl(data.id, data.media_type)
			a.target = "_blank"
			div = a
		}
	} else div = document.createElement("div")
	const vote_count = data?.vote_count || 0
	// right: 1.5vw;
	div.id = "rating"
	let zIndexValue = "2"
	if (isDisney) zIndexValue = ""
	else if (isPrimeVideo) zIndexValue = "3"
	Object.assign(div.style, {
		position: "absolute",
		bottom: "0",
		color: "black",
		textDecoration: "none",
		background: getColorForRating(data?.score, vote_count < 50),
		borderRadius: "5px",
		padding: "0 2px 0 2px",
		right: isNetflix ? "0.2vw" : "0",
		zIndex: zIndexValue,
		fontSize: isMobile ? "4vw" : "1vw",
	})

	if (data?.score >= 0) {
		let releaseDate = ""
		if (settings.value.Video?.showYear && data?.release_date) {
			releaseDate = new Date(data?.release_date)?.getFullYear() + "-"
		}
		div.textContent = releaseDate + data.score?.toFixed(1)
		div.setAttribute(
			"alt",
			"Filtered title: " +
				title +
				", Fetched title: " +
				data?.title +
				", media_type: " +
				data?.media_type +
				", Vote count: " +
				vote_count,
		)
	} else {
		div.textContent = "?"
		div.setAttribute(
			"alt",
			"Filtered title: " +
				title +
				(data?.title ? ", Fetched title: " + data?.title : "") +
				(data?.media_type ? ", media_type: " + data?.media_type : ""),
		)
		console.log("no score found:", title, data, card)
	}
	const greyOverlay = document.createElement("div")
	Object.assign(greyOverlay.style, {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		background: "rgba(40, 40, 40, 0.7)" /* grey with 70% opacity */,
		pointerEvents: "none" /* allows clicks to pass through */,
		zIndex: 2,
	})
	if (isNetflix) {
		// legacy UI used a distinct ".title-card-container" ancestor; the 2026 redesign has no such
		// wrapper class anymore, so we fall back to the card <a> element itself (data-uia="standard-card"/"progress-card")
		const titleCardContainer = (card.closest(".title-card-container") as HTMLElement) || card
		if (titleCardContainer) {
			if (getComputedStyle(titleCardContainer).position === "static") titleCardContainer.style.position = "relative"
			titleCardContainer.appendChild(div)
			if (getIsTransparent(data?.score, vote_count < 50)) titleCardContainer.appendChild(greyOverlay)
			// titleCardContainer.style.opacity = getTransparencyForRating(data?.score, vote_count < 50)
		} else if (DEBUG) {
			console.warn(
				"[RatingDebug][Netflix] setRatingOnCard: no suitable ancestor found, rating badge cannot be inserted for title",
				title,
				card,
			)
		}
	} else if (isHBO) {
		card.appendChild(div)
		if (getIsTransparent(data?.score, vote_count < 50)) card.appendChild(greyOverlay)
		// card.style.opacity = getTransparencyForRating(data?.score, vote_count < 50)
	} else if (isParamount) {
		card.style.position = "unset"
		card.appendChild(div)
		if (getIsTransparent(data?.score, vote_count < 50)) card.appendChild(greyOverlay)
		// card.style.opacity = getTransparencyForRating(data?.score, vote_count < 50)
	} else if (isDisney) {
		const parentDiv = card?.closest("div")
		if (parentDiv) {
			if (card.nextElementSibling && card.nextElementSibling.id != "hideTitleButton") {
				div.style.top = card.offsetHeight + "px"
				div.style.bottom = ""
			}
			parentDiv.style.position = "relative"
			parentDiv.appendChild(div)
			if (getIsTransparent(data?.score, vote_count < 50)) parentDiv.appendChild(greyOverlay)
			// parentDiv.style.opacity = getTransparencyForRating(data?.score, vote_count < 50)
		}
	} else if (isHotstar) {
		const targetContainer = card // card is the outermost container from getAllTitleCardsTypes
		if (targetContainer && !targetContainer.querySelector("#rating")) {
			div.style.zIndex = "10"
			targetContainer.appendChild(div)
			if (getIsTransparent(data?.score, vote_count < 50)) targetContainer.appendChild(greyOverlay)
		}
	} else if (isPrimeVideo) {
		let position: HTMLElement = card
		if (card.dataset.cardTitle) position = card?.firstChild?.firstChild as HTMLElement
		else if (card.querySelector('div[data-testid="title-metadata-main"]'))
			position = card.querySelector('div[data-testid="title-metadata-main"]') as HTMLElement
		position?.appendChild(div)
		if (getIsTransparent(data?.score, vote_count < 50)) position?.appendChild(greyOverlay)
		// card.closest("li")?.style.setProperty("opacity", getTransparencyForRating(data?.score, vote_count < 50))
	}
}
function OnFullScreenChange() {
	let video: HTMLVideoElement
	if (isDisney)
		video = Array.from(document.querySelectorAll("video")).find((v) => v.checkVisibility()) as HTMLVideoElement
	else if (isNetflix || isHotstar || isHBO || isParamount) video = document.querySelector("video") as HTMLVideoElement
	else video = document.querySelector(AmazonVideoClass) as HTMLVideoElement
	if (document.fullscreenElement && video) {
		video.play()
		console.log("auto-played on fullscreen")
		settings.value.Statistics.SegmentsSkipped++
		sendMessage("increaseBadge", {}, "background")
	}
}
async function startPlayOnFullScreen() {
	if (settings.value.Video?.playOnFullScreen) {
		addEventListener("fullscreenchange", OnFullScreenChange)
	} else {
		removeEventListener("fullscreenchange", OnFullScreenChange)
	}
}
// #endregion
