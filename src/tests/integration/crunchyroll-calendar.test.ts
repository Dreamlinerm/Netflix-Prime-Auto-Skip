import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
import { ref } from "vue"
import * as browser from "webextension-polyfill"
import { sendMessage } from "webext-bridge/content-script"
import { makeSettings, playerEnvironment, settle, videoFixture } from "../helpers/player"
let settings: ReturnType<typeof makeSettings>, env: ReturnType<typeof playerEnvironment>
const list = ref<any[]>([])
vi.mock("../../composables/useBrowserStorage", () => ({
	useBrowserSyncStorage: (key: string) => ({ data: key === "settings" ? settings : list, promise: Promise.resolve() }),
	useBrowserLocalStorage: () => ({ data: ref({}), promise: Promise.resolve() }),
}))
beforeEach(() => {
	vi.resetModules()
	vi.clearAllMocks()
	settings = makeSettings()
	list.value = []
	env = playerEnvironment("https://www.crunchyroll.com/simulcastcalendar")
	vi.setSystemTime(new Date("2026-09-10T12:00:00Z"))
	vi.mocked(browser.storage.local.get).mockResolvedValue({ MALCache: {} })
	vi.mocked(sendMessage).mockResolvedValue(undefined)
})
afterEach(() => env.cleanup())
async function start() {
	await import("../../content-script/crunchyroll")
	await settle()
}
const release = (title: string, episode = 1, queued = true, premiere = false, hidden = false) =>
	`<li><article class="release js-release" ${hidden ? "hidden" : ""}><time datetime="2026-09-10T09:00:00Z"></time><h1 class="season-name"><a href="https://www.crunchyroll.com/series/a"><b></b><cite itemprop="name">${title}</cite></a></h1><div class="queue-flag ${queued ? "queued" : ""}"></div>${premiere ? '<div class="premiere-flag"></div>' : ""}<a class="available-episode-link">Episode ${episode}</a></article></li>`
function calendar(html: string) {
	document.body.innerHTML = `<form id="filter_toggle_form"><div></div></form><ol class="releases">${html}</ol>`
}
const visibleTitles = () => Array.from(document.querySelectorAll("li:not(.removed) cite")).map((x) => x.textContent)

describe("Crunchyroll release calendar", () => {
	it("handles incomplete release metadata and keeps the saved schedule", async () => {
		calendar('<li><article class="release js-release"></article></li>')
		list.value = [{ href: "", name: "Saved", time: "2026-09-11T10:00:00Z" }]
		settings.value.Crunchyroll.releaseCalendar = true
		settings.value.Crunchyroll.dubLanguage = ""
		await start()
		expect(document.querySelector<HTMLSelectElement>("#filterDubLanguage")!.value).toBe("none")
		expect(list.value.map((item) => item.name)).toContain("Saved")
	})
	it("does not duplicate an existing filter toolbar and keeps queued premieres out of the saved list", async () => {
		calendar(release("Premiere", 1, true, true))
		document.querySelector("form")!.insertAdjacentHTML("beforeend", '<input id="filterQueued">')
		settings.value.Crunchyroll.releaseCalendar = true
		await start()
		expect(document.querySelectorAll("#filterQueued")).toHaveLength(1)
		expect(list.value).toEqual([])
	})
	it("merges only saved times later than the last listed release", async () => {
		calendar(release("Today"))
		document.body.insertAdjacentHTML(
			"beforeend",
			'<li class="day"><div class="specific-date"><time datetime="2026-09-09"></time></div></li><li class="day"><div class="specific-date"><time datetime="2026-09-10"></time></div></li><section class="calendar-day"><time datetime="2026-09-10"></time><div><span></span></div></section><section class="calendar-day"><div></div><div></div></section>',
		)
		list.value = [
			{ name: "Before", href: "", time: "2026-09-10T08:00:00Z" },
			{ name: "Same", href: "", time: "2026-09-10T09:00:00Z" },
			{ name: "Minute later", href: "", time: "2026-09-10T09:01:00Z" },
			{ name: null, href: null, time: "2026-09-10T10:00:00Z" },
		]
		settings.value.Crunchyroll.releaseCalendar = true
		await start()
		expect(list.value.map((item) => item.name)).toEqual(["Today", "Minute later", null])
	})
	it("retains saved releases on another future day already present in the calendar", async () => {
		calendar(release("Friday").replace("2026-09-10T09:00:00Z", "2026-09-11T09:00:00Z"))
		document.body.insertAdjacentHTML(
			"beforeend",
			'<li class="day"><div class="specific-date"><time datetime="2026-09-10"></time></div></li>',
		)
		list.value = [{ name: "Later Friday", href: "", time: "2026-09-11T08:00:00Z" }]
		settings.value.Crunchyroll.releaseCalendar = true
		await start()
		expect(list.value).toHaveLength(2)
	})
	it("filters duplicates by newest episode, retaining the first tie", async () => {
		calendar(release("Show", 1) + release("Show", 3) + release("Show", 3) + release("Other", 2))
		settings.value.Crunchyroll.releaseCalendar = true
		settings.value.Crunchyroll.filterDuplicates = true
		await start()
		expect(visibleTitles()).toEqual(["Show", "Other"])
		expect(document.querySelectorAll("li.removed")).toHaveLength(2)
		const input = document.querySelector("#filterDuplicates") as HTMLInputElement
		input.click()
		expect(visibleTitles()).toHaveLength(4)
	})
	it("filters unqueued shows but preserves premieres", async () => {
		calendar(release("Queued", 1, true) + release("Not queued", 1, false) + release("Premiere", 1, false, true))
		settings.value.Crunchyroll.releaseCalendar = true
		settings.value.Crunchyroll.filterQueued = true
		await start()
		expect(visibleTitles()).toEqual(["Queued", "Premiere"])
		;(document.querySelector("#filterQueued") as HTMLInputElement).click()
		expect(visibleTitles()).toHaveLength(3)
	})
	it.each([
		["none", ["Original"]],
		["all", ["Original", "Show (English Dub)", "Show (Italiano Dub)"]],
		["Italiano", ["Original", "Show (Italiano Dub)"]],
	])("filters dubs using %s", async (lang, expected) => {
		calendar(release("Original") + release("Show (English Dub)") + release("Show (Italiano Dub)"))
		settings.value.Crunchyroll.releaseCalendar = true
		settings.value.Crunchyroll.dubLanguage = lang as string
		await start()
		expect(visibleTitles()).toEqual(expected)
		const select = document.querySelector("#filterDubLanguage") as HTMLSelectElement
		select.value = "all"
		select.dispatchEvent(new Event("change"))
		expect(visibleTitles()).toHaveLength(3)
	})
	it("adds discovered dub languages and resets an unknown saved language", async () => {
		calendar(release("Show (Klingon Dub)") + release("Hidden", 1, true, false, true))
		settings.value.Crunchyroll.releaseCalendar = true
		settings.value.Crunchyroll.dubLanguage = "Unknown"
		await start()
		expect(document.querySelector('option[value="Klingon"]')).not.toBeNull()
		expect(settings.value.Crunchyroll.dubLanguage).toBe("none")
		expect(document.querySelectorAll(".removed")).toHaveLength(2)
	})
	it("keeps working when the filter toolbar is absent", async () => {
		calendar(release("Show"))
		document.querySelector("form")!.remove()
		settings.value.Crunchyroll.releaseCalendar = true
		await start()
		expect(visibleTitles()).toEqual(["Show"])
	})
	it("preserves saved future releases and adds them to the current week", async () => {
		calendar(release("Today"))
		document.body.insertAdjacentHTML(
			"beforeend",
			'<li class="day"><div class="specific-date"><time datetime="2026-09-10"></time></div></li><section class="calendar-day"><time datetime="2026-09-11"></time><div><span></span>Schedule coming soon</div></section>',
		)
		list.value = [
			{ href: "https://www.crunchyroll.com/series/f", name: "Future", time: "2026-09-11T15:00:00Z" },
			{ href: "", name: "Old", time: "2026-09-09T15:00:00Z" },
		]
		settings.value.Crunchyroll.releaseCalendar = true
		await start()
		expect(list.value.map((x) => x.name)).toEqual(["Today", "Future"])
		expect(document.querySelector("section.calendar-day")?.textContent).toContain("Future")
		expect(document.querySelector("li.day.active")).not.toBeNull()
	})
	it("discards prior cached releases while browsing a different week", async () => {
		calendar(release("Archive"))
		document.body.insertAdjacentHTML(
			"beforeend",
			'<li class="day"><div class="specific-date"><time datetime="2026-09-03"></time></div></li>',
		)
		list.value = [{ href: "", name: "Old", time: "2026-09-11T15:00:00Z" }]
		settings.value.Crunchyroll.releaseCalendar = true
		await start()
		expect(list.value.map((x) => x.name)).toEqual(["Archive"])
	})
})

describe("Crunchyroll MAL ratings", () => {
	it("does not duplicate a badge on a card that lost its marker", async () => {
		card()
		vi.mocked(browser.storage.local.get).mockResolvedValue({ MALCache: { "Show: Subtitle": entry() } })
		await start()
		document.querySelector('[data-t~="series-card"]')!.classList.remove("mal-rated")
		await vi.advanceTimersByTimeAsync(1000)
		expect(document.querySelectorAll("#mal-rating")).toHaveLength(1)
	})
	const card = () => {
		document.body.innerHTML = '<div data-t="series-card"><h3 data-t="title"><a>Show: Subtitle</a></h3></div>'
		settings.value.Crunchyroll.showRating = true
	}
	const entry = (extra: Record<string, any> = {}) => ({
		id: 7,
		title: "Show",
		score: 8,
		num_scoring_users: 200,
		media_type: "tv",
		start_date: "2020-01-01",
		poster: "/p",
		date: "2026-09-10",
		...extra,
	})
	it("uses a cached rating without a request", async () => {
		card()
		vi.mocked(browser.storage.local.get).mockResolvedValue({ MALCache: { "Show: Subtitle": entry() } })
		await start()
		expect(document.querySelector("#mal-rating")?.textContent).toBe("8.0")
		expect(sendMessage).not.toHaveBeenCalled()
		settings.value.Crunchyroll.showRating = false
		await vi.advanceTimersByTimeAsync(1000)
	})
	it("fetches using the title without subtitle and saves the result", async () => {
		card()
		vi.mocked(sendMessage).mockResolvedValue({
			data: [
				{
					node: {
						id: 7,
						title: "Show",
						mean: 8,
						num_scoring_users: 200,
						media_type: "tv",
						start_date: "2020-01-01",
						main_picture: { medium: "/p" },
					},
				},
			],
		})
		await start()
		expect(sendMessage).toHaveBeenCalledWith(
			"fetch",
			{ url: expect.stringContaining("q=Show&"), type: "mal" },
			"background",
		)
		expect(document.querySelector("#mal-rating")?.textContent).toBe("8.0")
		expect(browser.storage.local.set).toHaveBeenCalledWith({ MALCache: { "Show: Subtitle": entry() } })
	})
	it("renders no-match results and retries stale misses", async () => {
		card()
		vi.mocked(browser.storage.local.get).mockResolvedValue({
			MALCache: { "Show: Subtitle": entry({ id: 0, date: "2026-09-08" }) },
		})
		await start()
		expect(sendMessage).toHaveBeenCalled()
		expect(document.querySelector("#mal-rating")?.textContent).toBe("?")
		expect(document.querySelector("#mal-rating")?.tagName).toBe("DIV")
	})
	it("adds release year and dims low ratings", async () => {
		card()
		settings.value.Video.showYear = true
		settings.value.Video.dimLowRatings = true
		vi.mocked(browser.storage.local.get).mockResolvedValue({ MALCache: { "Show: Subtitle": entry({ score: 3 }) } })
		await start()
		expect(document.querySelector("#mal-rating")?.textContent).toBe("2020-3.0")
		expect(document.querySelector('[style*="rgba(40, 40, 40"]')).not.toBeNull()
	})
	it("handles a card whose title is not loaded yet", async () => {
		card()
		document.querySelector("h3")!.remove()
		await start()
		expect(sendMessage).not.toHaveBeenCalled()
	})
	it("garbage-collects expired entries and handles storage broadcasts", async () => {
		settings.value.General.MALGCdate = "2000-01-01"
		vi.mocked(browser.storage.local.get).mockResolvedValue({
			MALCache: { Old: entry({ date: "2000-01-01" }), Fresh: entry() },
		})
		await start()
		expect(browser.storage.local.set).toHaveBeenCalledWith({ MALCache: { Fresh: entry() } })
		const cb = vi.mocked(browser.storage.onChanged.addListener).mock.calls.at(-1)![0]
		cb({}, "local")
		cb({ MALCache: { newValue: {} } }, "sync")
		cb({ MALCache: { newValue: {} } }, "local")
	})
	it("handles the first cache write failing", async () => {
		vi.mocked(browser.storage.local.get).mockResolvedValue({ DBCache: {} })
		vi.mocked(browser.storage.local.set).mockRejectedValueOnce(new Error("quota"))
		await start()
		expect(browser.storage.local.set).toHaveBeenCalledWith({ MALCache: {} })
	})
})

it("clears a MAL cache exceeding five megabytes", async () => {
	settings.value.General.MALGCdate = "2000-01-01"
	vi.mocked(browser.storage.local.get).mockResolvedValue({
		MALCache: { large: { date: "2026-09-10", title: "x".repeat(5 * 1024 * 1024) } },
	})
	await start()
	expect(browser.storage.local.set).toHaveBeenCalledWith({ MALCache: {} })
})
