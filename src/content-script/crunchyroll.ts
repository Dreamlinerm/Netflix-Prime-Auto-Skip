import { sendMessage } from "webext-bridge/content-script"
import { startSharedFunctions, Platforms } from "@/content-script/shared-functions"
startSharedFunctions(Platforms.Crunchyroll)
// Global Variables

const { data: settings, promise } = useBrowserSyncStorage<settingsType>("settings", defaultSettings)
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

type displayType = "block" | "none"
function filterQueued(display: displayType) {
	document.querySelectorAll("div.queue-flag:not(.queued)").forEach((element) => {
		// if not on premiere
		if (element?.parentElement?.parentElement?.parentElement) {
			element.parentElement.parentElement.parentElement.style.display = element.parentElement.parentElement
				.querySelector(".premiere-flag")
				?.checkVisibility()
				? "block"
				: display
		}
	})
	if (display == "block" && settings.value.General.filterDub) filterDub("none")
}

function filterDub(display: displayType) {
	const list = document.querySelectorAll("cite[itemprop='name']")
	list.forEach((element) => {
		if (
			(element?.textContent?.includes("Dub") || element?.textContent?.includes("Audio")) &&
			element?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement
		)
			element.parentElement.parentElement.parentElement.parentElement.parentElement.style.display = display
	})
	if (display == "block" && settings.value.General.filterQueued) filterQueued("none")
}
type FilterFunction = (display: displayType) => void
function createFilterElement(
	filterType: "filterQueued" | "filterDub",
	filterText: string,
	settingsValue: boolean,
	filterFunction: FilterFunction,
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
		console.log("input.checked", input.checked)
		filterFunction(input.checked ? "none" : "block")
		//setStorage()
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
		createFilterElement("filterQueued", "Show Playlist only", settings.value.General.filterQueued, filterQueued),
	)
	toggleForm.firstElementChild.appendChild(
		createFilterElement("filterDub", "Filter Dub", settings.value.General.filterDub, filterDub),
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
		div2.className = "queue-flag queued enhanced"

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
	// @ts-expect-error days is a NodeList
	for (const day of days) {
		const dateOnPage = new Date(day.getAttribute("datetime"))
		// if the day of the week is the same as today click on it, like if its Monday click on Monday
		if (date.getDay() == dateOnPage.getDay()) {
			// need timeout because the page is not fully loaded
			setTimeout(() => {
				day.click()
			}, 1000)
			// isCurrentWeek
			return date.toLocaleDateString() == dateOnPage.toLocaleDateString()
		}
	}
	return false
}
function createLocalList() {
	const localList: CrunchyList = []
	document.querySelectorAll("div.queue-flag.queued:not(.enhanced)").forEach((element) => {
		const h1 = element.nextElementSibling?.firstChild?.nextSibling as HTMLAnchorElement
		const name = h1?.firstChild?.nextSibling?.textContent
		if (!name?.includes("Dub")) {
			const href = h1?.href
			const time = element.parentElement?.parentElement?.firstElementChild?.getAttribute("datetime") ?? ""
			localList.push({ href, name, time })
		}
	})
	return localList
}
function filterOldList(isCurrentWeek: boolean, localList: CrunchyList) {
	let oldList = toRaw(settings.value.General.savedCrunchyList)
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
	const oldList =
		localList.length > 0 ? filterOldList(isCurrentWeek, localList) : toRaw(settings.value.General.savedCrunchyList)
	settings.value.General.savedCrunchyList = localList.concat(oldList)
	if (isCurrentWeek && !document.querySelector("div.queue-flag.queued.enhanced")) {
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
		// Show playlist only
		filterQueued(settings.value.General.filterQueued ? "none" : "block")
		filterDub(settings.value.General.filterDub ? "none" : "block")
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
	if (document.querySelector(".video-player-wrapper")) {
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
// #endregion
startCrunchyroll()
