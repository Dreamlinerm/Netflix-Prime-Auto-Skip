import { sendMessage } from "webext-bridge/content-script"
import { startSharedFunctions, Platforms } from "@/content-script/shared-functions"
startSharedFunctions(Platforms.Crunchyroll)
// Global Variables

const { data: settings, promise } = useBrowserSyncStorage<settingsType>("settings", defaultSettings)
const { data: crunchyList, promise: crunchyListPromise } = useBrowserSyncStorage<CrunchyList>("crunchyList", [], false)
const url = window.location.href
const date = new Date()
const config = { attributes: true, childList: true, subtree: true }
async function logStartOfAddon() {
	console.log("%cStreaming enhanced", "color: #00aeef;font-size: 2em;")
	console.log("Settings", settings.value)
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
		setTimeout(function () {
			if (settings.value.Crunchyroll?.bigPlayer) Crunchyroll_bigPlayerStyle()
		}, 1000)
		// only click on profile on page load not when switching profiles
		setTimeout(function () {
			clearInterval(pickInterval)
		}, 2000)
		CrunchyrollObserver.observe(document, config)
	}
}
// #region Crunchyroll
// Crunchyroll functions
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
	"English",
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
]
function titleContainsDub(title: string) {
	return (
		title?.includes("Dub") ||
		/[^(]*\(\D*\)[^(]*/g.test(title) ||
		// Array.from(langs).some((lang) => element?.textContent?.includes(lang)) ||
		title?.includes("Audio")
	)
}

const getTitle = (el: Element | null) => el?.textContent?.trim() ?? ""
type show = {
	index: number
	episode: number
}
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
			element.querySelector("a.available-episode-link")?.textContent?.match(/Episodes? (\d+)/)?.[1] ?? "-1",
		)
		if (settings.value.General.filterDub && titleContainsDub(title)) {
			setReleaseRemoved(element.parentElement)
		} else if (settings.value.General.filterQueued && queuedFlag && !premiereFlag) {
			setReleaseRemoved(element.parentElement)
		} else if (settings.value.General.filterDuplicates) {
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
	filterType: "filterQueued" | "filterDub" | "filterDuplicates",
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
		settings.value.General[filterType] = input.checked
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
function addButtons() {
	const toggleForm = document.querySelector("#filter_toggle_form") as HTMLElement
	if (!toggleForm?.firstElementChild) return
	toggleForm.style.display = "flex"
	toggleForm.firstElementChild.appendChild(
		createFilterElement("filterQueued", "Show Playlist only", settings.value.General.filterQueued),
	)
	toggleForm.firstElementChild.appendChild(
		createFilterElement("filterDub", "Filter Dub", settings.value.General.filterDub),
	)
	toggleForm.firstElementChild.appendChild(
		createFilterElement("filterDuplicates", "Filter Duplicates", settings.value.General.filterDuplicates),
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
	const days = document.querySelectorAll(".specific-date [datetime]") as NodeListOf<HTMLTimeElement>
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
	const lastElement = localList[localList.length - 1]
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
const CrunchyrollObserver = new MutationObserver(Crunchyroll)
async function Crunchyroll() {
	if (settings.value.Crunchyroll?.profile) Crunchyroll_profile()
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
async function Crunchyroll_bigPlayerStyle() {
	const wrapper = await waitForElement(".video-player-wrapper")
	if (wrapper) {
		// show header on hover
		const style = document.createElement("style")
		const parentDiv = document.querySelector('[class^="app-layout__header"]')?.classList?.[0]
		const styles = /*css*/ `
      .video-player-wrapper{
          max-Height: calc(100vw / 1.7777);
          height: 100vh;
      }
			.${parentDiv} {
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
		style.appendChild(document.createTextNode(styles))
		document.head.appendChild(style)
	}
}

async function waitForElement(selector: string, timeout = 10000): Promise<Element | null> {
	return new Promise((resolve) => {
		const element = document.querySelector(selector)
		if (element) return resolve(element)
		const observer = new MutationObserver(() => {
			const el = document.querySelector(selector)
			if (el) {
				observer.disconnect()
				resolve(el)
			}
		})
		observer.observe(document.body, { childList: true, subtree: true })
		setTimeout(() => {
			observer.disconnect()
			resolve(null)
		}, timeout)
	})
}
// #endregion
startCrunchyroll()
