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
	date,
} from "@/utils/helper"
logStartOfAddon(Platforms.Amazon)
// Global Variables

const { settings, DBCache } = storeToRefs(optionsStore)
const today = date.toISOString().split("T")[0]

const ua = navigator.userAgent
const isMobile = /mobile|streamingEnhanced/i.test(ua)
let url = window.location.href
const hostname = window.location.hostname
const title = document.title
const isPrimeVideo = /amazon|primevideo/i.test(hostname) && (/video/i.test(title) || /video/i.test(url))
const isNetflix = /netflix/i.test(hostname)
const isDisney = /disneyplus|starplus/i.test(hostname)
const isHotstar = /hotstar/i.test(hostname)
const isHBO = /max.com/i.test(hostname)

const AmazonVideoClass = ".dv-player-fullscreen video"

export async function startSharedFunctions() {
	await checkStoreReady(settings)
	if (settings.value.Video.playOnFullScreen) startPlayOnFullScreen()
	await checkStoreReady(DBCache)
	if (isNetflix && settings.value.Netflix?.showRating) startShowRatingInterval()
	else if (isDisney || isHotstar) {
		if (settings.value.Disney?.showRating) startShowRatingInterval()
	} else if (isPrimeVideo && settings.value.Amazon?.showRating) startShowRatingInterval()
	else if (isHBO && settings.value.HBO?.showRating) startShowRatingInterval()
	if (getDiffInDays(settings.value.General.GCdate, date) >= GCdiff) garbageCollection()
}

// how long a record should be kept in the cache
const GCdiff = 30
async function garbageCollection() {
	// clear every rating older than 30 days
	// clear every rating where db != tmdb
	log("garbageCollection started, deleting old ratings:")
	const keys = Object.keys(DBCache)
	for (const key of keys) {
		if (getDiffInDays(DBCache.value[key].date, date) >= GCdiff || DBCache.value[key].db != "tmdb") {
			console.log(DBCache.value[key].date, key)
			delete DBCache.value[key]
		}
	}
	settings.value.General.GCdate = today
}

// #region Shared funcs
// shared functions
// show rating depending on page
const uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/g
function showRating() {
	if (isDisney) {
		url = window.location.href
		// disable search and suggested movies
		if (url.includes("search")) return false
		if (url.includes("entity")) {
			const SelectedTab = document.querySelector('[aria-selected="true"]')
			return uuidRegex.test(SelectedTab?.id.split("_control")[0]) && SelectedTab?.getAttribute("aria-label") != "EXTRAS"
		}
		return true
	} else if (isPrimeVideo) {
		// suggested movies
		if (window.location.href.includes("detail")) {
			return document.querySelector('[data-testid="btf-related-tab"]')?.tabIndex == 0
		}
		return true
	} else return true
}
async function startShowRatingInterval() {
	if (showRating()) addRating()
	const RatingInterval = setInterval(function () {
		if (
			(isNetflix && !settings.value.Netflix?.showRating) ||
			(isPrimeVideo && !settings.value.Amazon?.showRating) ||
			((isDisney || isHotstar) && !settings.value.Disney?.showRating) ||
			(isHBO && !settings.value.HBO?.showRating)
		) {
			log("stopped adding Rating")
			clearInterval(RatingInterval)
			return
		}
		if (showRating()) addRating()
	}, 1000)
}
function getDiffInDays(firstDate: string, secondDate: string) {
	if (!firstDate || !secondDate) return 31
	return Math.round(Math.abs(new Date(secondDate).getTime() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24))
}
function useDBCache(title, card, media_type) {
	if (!DBCache.value[title]?.date) DBCache.value[title].date = today
	const vote_count = DBCache.value[title]?.vote_count || 100
	const diffInReleaseDate =
		// vote count is under 80 inaccurate rating
		vote_count < 100 &&
		// did not refresh rating in the last 0 days
		getDiffInDays(DBCache.value[title].date, date) > 0 &&
		// release date is in the last 50 days after not many people will
		getDiffInDays(DBCache.value[title]?.release_date, date) <= 50

	// refresh rating if older than 30 days or release date is in last month and vote count is under 100
	if (getDiffInDays(DBCache.value[title].date, date) >= GCdiff || diffInReleaseDate) {
		if (diffInReleaseDate)
			log(
				"update recent movie:",
				title,
				",Age:",
				getDiffInDays(DBCache.value[title]?.release_date, date),
				"Vote count:",
				vote_count,
			)
		else log("update old rating:", title, ",Age:", getDiffInDays(DBCache.value[title].date, date))
		getMovieInfo(title, card, media_type)
		// log("no info today", title);
	} else {
		setRatingOnCard(card, DBCache.value[title], title)
	}
}
function getMediaType(type) {
	if (!type) return null
	if (type.toLowerCase().includes("tv")) return "tv"
	if (type.toLowerCase().includes("movie")) return "movie"
	return null
}
async function addRating() {
	url = window.location.href
	let AllTitleCardsTypes
	if (isNetflix) AllTitleCardsTypes = [document.querySelectorAll(".title-card .boxart-container:not(.imdb)")]
	else if (isDisney) AllTitleCardsTypes = [document.querySelectorAll("a[data-testid='set-item']:not(.imdb)")]
	else if (isHotstar) AllTitleCardsTypes = [document.querySelectorAll(".swiper-slide img:not(.imdb)")]
	else if (isHBO)
		AllTitleCardsTypes = [document.querySelectorAll("a[class*='StyledTileLinkNormal-Beam-Web-Ent']:not(.imdb)")]
	else if (isPrimeVideo)
		AllTitleCardsTypes = [
			document.querySelectorAll(
				"li:not(.imdb) article[data-card-title]:not([data-card-entity-type='EVENT']):not([data-card-title='Live-TV'])",
			),
			document.querySelectorAll("article[data-testid*='-card']:not(.imdb):not(:has(a#rating))"),
		]
	// on disney there are multiple images for the same title so only use the first one
	let lastTitle = ""
	// for each is not going in order on chrome
	let updateDBCache = false
	for (let type = 0; type < AllTitleCardsTypes.length; type++) {
		const titleCards = AllTitleCardsTypes[type]
		let media_type = null
		for (let i = 0; i < titleCards.length; i++) {
			let card = titleCards[i]
			// add seen class
			if (isNetflix || isDisney || isHotstar || isHBO) card.classList.add("imdb")
			else if (isPrimeVideo) {
				if (type == 0) card?.closest("li")?.classList.add("imdb")
				else if (type == 1) card?.classList.add("imdb")
			}
			let title
			if (isNetflix) {
				title = card?.parentElement?.getAttribute("aria-label")?.split(" (")[0]
				if (url.includes("genre/83")) media_type = "tv"
				else if (url.includes("genre/34399")) media_type = "movie"
			} else if (isDisney) {
				title = card?.getAttribute("aria-label")?.replace(" Disney+ Original", "")?.replace(" STAR Original", "")
				// no section Extras on disney shows
				if (url.includes("entity")) {
					const SelectedTabId = document.querySelector('[aria-selected="true"]')?.id.split("_control")[0]
					if (SelectedTabId != card.closest('div[role="tabpanel"]')?.id) title = ""
				}
				if (url.includes("browse/series")) media_type = "tv"
				else if (url.includes("browse/movies")) media_type = "movie"
				else if (/(Staffel)|(Nummer)|(Season)|(Episod)|(Number)/g.test(title)) media_type = "tv"
				// german translation
				if (htmlLang == "de") {
					title = title
						?.replace(/Nummer \d* /, "")
						.split(" Für Details")[0]
						.split(" Staffel")[0]
						.split("Staffel")[0]
						.split(" Neue")[0]
						.split(" Alle")[0]
						.split(" Demnächst")[0]
						.split(" Altersfreigabe")[0]
						.split(" Mach dich bereit")[0] // deadpool
						//did not find translation
						.split(" Jeden")[0]
						.split(" Noch")[0]
						.split(" Premiere")[0]
				} else if (htmlLang == "en") {
					title = title
						?.replace(/Number \d* /, "")
						.replace(" Select for details on this title.", "")
						.split(" Season")[0]
						.split("Season")[0]
						.split(" New ")[0]
						.split(" All Episodes")[0]
						.split(" Coming")[0]
						.split(" Two-Episode")[0]
						.split(" Rated")[0]
						.split(" Prepare for")[0] // deadpool
						//did not find translation
						.split(" Streaming ")[0]
						//did not find translation
						.replace(/ \d+ minutes remaining/g, "")
				}
			} else if (isHotstar) title = card?.getAttribute("alt")?.replace(/(S\d+\sE\d+)/g, "")
			else if (isPrimeVideo) {
				function fixTitle(title) {
					return (
						title
							?.split(" - ")[0]
							?.split(" – ")[0]
							?.replace(/(S\d+)/g, "")
							?.replace(/ \[.*\]/g, "")
							?.replace(/\s\(.*\)/g, "")
							?.replace(/:?\sStaffel-?\s\d+/g, "")
							?.replace(/:?\sSeason-?\s\d+/g, "")
							?.replace(/ \/ \d/g, "")
							?.split(": Die komplette")[0]
							// nicht sicher
							?.split(": The complete")[0]
					)
				}
				// detail means not live shows
				if (card.querySelector("a").href.includes("detail")) {
					if (type == 0) title = fixTitle(card.getAttribute("data-card-title"))
					else if (type == 1) title = fixTitle(card.querySelector("a")?.getAttribute("aria-label"))
				}
				if (url.includes("video/tv")) media_type = "tv"
				else if (url.includes("video/movie")) media_type = "movie"
				else media_type = getMediaType(card.getAttribute("data-card-entity-type"))
			} else if (isHBO) title = card.querySelector("p[class*='md_strong-Beam-Web-Ent']")?.textContent
			// for the static Pixar Disney, Starplus etc. cards
			if (!isDisney || !card?.classList.contains("_1p76x1y4")) {
				// sometimes more than one image is loaded for the same title
				if (title && lastTitle != title && !title.includes("Netflix") && !title.includes("Prime Video")) {
					lastTitle = title
					console.log("Title:", title, media_type)
					if (
						(DBCache.value[title]?.score || getDiffInDays(DBCache.value[title]?.date, date) <= 7) &&
						(!media_type || DBCache.value[title]?.media_type == media_type)
					) {
						useDBCache(title, card, media_type)
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
function getColorForRating(rating, lowVoteCount) {
	// I want a color gradient from red to green with yellow in the middle
	// the ratings are between 0 and 10
	// the average rating is 6.5
	// https://distributionofthings.com/imdb-movie-ratings/
	if (!rating || lowVoteCount) return "grey"
	if (rating <= 5.5) return "red"
	if (rating <= 7) return "rgb(245, 197, 24)" //#f5c518
	return "rgb(0, 166, 0)"
}
function getTMDBUrl(id, media_type) {
	return `https://www.themoviedb.org/${media_type}/${id}`
}

async function setRatingOnCard(card, data, title) {
	let div = document.createElement(data?.id ? "a" : "div")
	if (data?.id) {
		div.href = getTMDBUrl(data.id, data.media_type)
		div.target = "_blank"
	}
	const vote_count = data?.vote_count || 100
	// right: 1.5vw;
	div.id = "rating"
	Object.assign(div.style, {
		position: "absolute",
		bottom: "0",
		color: "black",
		textDecoration: "none",
		background: getColorForRating(data?.score, vote_count < 50),
		borderRadius: "5px",
		padding: "0 2px 0 2px",
		right: isNetflix ? "0.2vw" : "0",
		zIndex: isDisney ? "" : "9999",
		fontSize: isMobile ? "4vw" : "1vw",
	})

	// div.id = "imdb";
	if (data?.score >= 0) {
		let releaseDate = ""
		if (settings.value.Video?.showYear && data?.release_date) {
			releaseDate = new Date(data?.release_date)?.getFullYear() + "-"
			// const year = new Date(data?.release_date)?.getYear();
			// releaseDate = year >= 100 ? (year + " ").substring(1) : year + " ";
		}
		div.textContent = releaseDate + data.score?.toFixed(1)
		div.setAttribute("alt", data?.title + ", OG title: " + title + ", Vote count: " + vote_count)
	} else {
		div.textContent = "?"
		div.setAttribute("alt", title)
		log("no score found:", title, data)
	}
	if (isNetflix) {
		card.closest(".title-card-container")?.appendChild(div)
	} else if (isHBO) card.appendChild(div)
	else if (isDisney) {
		const parentDiv = card?.closest("div")
		if (parentDiv) {
			if (card.nextElementSibling) {
				div.style.top = card.offsetHeight + "px"
				div.style.bottom = ""
			}
			parentDiv.style.position = "relative"
			parentDiv.appendChild(div)
		}
	} else if (isHotstar) card.parentElement.appendChild(div)
	else if (isPrimeVideo) {
		if (card.getAttribute("data-card-title")) card.firstChild.firstChild.appendChild(div)
		else if (card.querySelector('div[data-testid="title-metadata-main"]')) {
			card.querySelector('div[data-testid="title-metadata-main"]').appendChild(div)
		} else card.appendChild(div)
	}
}
function OnFullScreenChange() {
	let video: HTMLVideoElement
	if (isNetflix || isDisney || isHotstar || isHBO) video = document.querySelector("video") as HTMLVideoElement
	else video = document.querySelector(AmazonVideoClass) as HTMLVideoElement
	//TODO: window.fullScreen
	if (document.fullscreenElement && video) {
		video.play()
		log("auto-played on fullscreen")
		increaseBadge()
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
