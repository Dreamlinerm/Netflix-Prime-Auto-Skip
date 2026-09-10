import { knownBug } from "../helpers/known-bug"
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest"
import { ref } from "vue"
import * as browser from "webextension-polyfill"
import { sendMessage } from "webext-bridge/content-script"
import { makeSettings, playerEnvironment, settle, videoFixture } from "../helpers/player"
let settings: ReturnType<typeof makeSettings>, env: ReturnType<typeof playerEnvironment>
const hidden = ref<Record<string, any>>({})
vi.mock("../../composables/useBrowserStorage", () => ({
	useBrowserSyncStorage: () => ({ data: settings, promise: Promise.resolve() }),
	useBrowserLocalStorage: () => ({ data: hidden, promise: Promise.resolve() }),
}))
beforeEach(() => {
	vi.resetModules()
	vi.clearAllMocks()
	settings = makeSettings()
	hidden.value = {}
	env = playerEnvironment("https://example.test/")
	document.documentElement.lang = "en"
	vi.mocked(browser.storage.local.get).mockResolvedValue({ DBCache: {} })
	vi.mocked(sendMessage).mockResolvedValue(undefined)
})
afterEach(() => {
	env.cleanup()
	document.documentElement.lang = ""
})
const module = () => import("../../content-script/shared-functions")
const platforms = [
	["Netflix", "Netflix", '<div data-virtual-slot><a data-uia="standard-card" aria-label="A show"></a></div>'],
	[
		"Amazon",
		"Amazon",
		'<li><article data-card-title="A show" data-card-entity-type="TV"><div><div data-testid="packshot"><a href="/detail/a"></a></div></div></article></li>',
	],
	[
		"Disney",
		"Disney",
		'<div><a data-testid="set-item" aria-label="A show Select for details on this title."></a></div>',
	],
	["Hotstar", "Disney", '<div data-testid="tray-card-default" aria-label="A show"><img></div>'],
	["HBO", "HBO", '<a class="StyledTileLinkNormal-a" href="/show/a"><p class="md_strong-a">A show</p></a>'],
	["Paramount", "Paramount", '<a href="/shows/a" title="A show"></a>'],
] as const
const cached = (overrides: Record<string, any> = {}) => ({
	id: 123,
	title: "A show",
	score: 8,
	vote_count: 200,
	release_date: "2020-01-01",
	media_type: "tv",
	poster_path: "/p",
	date: new Date().toISOString().slice(0, 10),
	db: "tmdb",
	...overrides,
})
function visibleCards(visible = true) {
	vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
		bottom: visible ? 100 : 0,
		right: 100,
		top: 0,
		left: 0,
		width: 100,
		height: 100,
		x: 0,
		y: 0,
		toJSON() {},
	})
}
async function start(platform: string) {
	const m = await module()
	await m.startSharedFunctions(m.Platforms[platform as keyof typeof m.Platforms])
	await settle()
	return m
}

describe("shared parsing and playback controls", () => {
	it("releases slider subscriptions when controls are replaced, including shadow DOM", async () => {
		const m = await module()
		const host = document.createElement("div")
		document.body.append(host)
		const root = host.attachShadow({ mode: "open" })
		const position = document.createElement("div")
		root.append(position)
		const video = document.createElement("video")
		document.body.append(video)
		const rate = ref(1)
		const controls = m.createSlider(video, rate, position, "", "")
		rate.value = 1.5
		await settle()
		expect(controls.speed.textContent).toBe("1.5x")
		position.remove()
		await env.mutate()
		rate.value = 2
		await settle()
		expect(controls.speed.textContent).toBe("1.5x")
		expect(controls.slider.isConnected).toBe(false)
	})
	it("rejects an overflowing ad duration", async () => {
		expect((await module()).parseAdTime("999999999999999999999:59")).toBe(false)
	})
	it.each(["Disney", "StarPlus"])(
		"uses a stable selected-tab check across successive %s catalog updates",
		async (platform) => {
			vi.stubGlobal("location", new URL("https://www.disneyplus.com/entity/a"))
			const id = "12345678-1234-1234-1234-123456789abc"
			document.body.innerHTML = `<button aria-selected="true" id="${id}_control" aria-label="EPISODES"></button><div role="tabpanel" id="${id}"><a data-testid="set-item" aria-label="A show Watch now"><div data-testid="hero-carousel-prompt">Watch now</div></a></div>`
			settings.value.Disney.showRating = true
			visibleCards()
			await start(platform)
			expect(sendMessage).toHaveBeenCalledOnce()
			document.querySelector("a")!.classList.remove("imdb")
			await vi.advanceTimersByTimeAsync(1000)
			expect(sendMessage).toHaveBeenCalledTimes(2)
		},
	)
	it.each(["no selection", "invalid id", "extras", "other panel"])(
		"does not fetch Disney cards for %s",
		async (variant) => {
			vi.stubGlobal("location", new URL("https://www.disneyplus.com/entity/a"))
			const id = "12345678-1234-1234-1234-123456789abc"
			document.body.innerHTML = `<button aria-selected="true" id="${id}_control" aria-label="EPISODES"></button><div role="tabpanel" id="${id}"><a data-testid="set-item" aria-label="A show"></a></div>`
			if (variant === "no selection") document.querySelector("button")!.remove()
			if (variant === "invalid id") document.querySelector("button")!.id = "unrecognized"
			if (variant === "extras") document.querySelector("button")!.setAttribute("aria-label", "EXTRAS")
			if (variant === "other panel") document.querySelector("div")!.id = "another"
			settings.value.Disney.showRating = true
			visibleCards()
			await start("Disney")
			await vi.advanceTimersByTimeAsync(1000)
			expect(sendMessage).not.toHaveBeenCalled()
		},
	)
	it.each([null, [], "corrupt"])("recovers from an invalid ratings cache %j", async (value) => {
		vi.mocked(browser.storage.local.get).mockResolvedValue({ DBCache: value })
		await start("Amazon")
		expect(browser.storage.local.set).toHaveBeenCalledWith({ DBCache: {} })
	})
	it("continues after a cache read failure and a later cache deletion", async () => {
		vi.mocked(browser.storage.local.get).mockRejectedValueOnce(new Error("unavailable"))
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
		await start("Amazon")
		expect(warn).toHaveBeenCalled()
		const callback = vi.mocked(browser.storage.onChanged.addListener).mock.calls.at(-1)![0]
		callback({ DBCache: {} }, "local")
		document.body.innerHTML = platforms[1][2]
		settings.value.Amazon.showRating = true
		visibleCards()
		await settle()
		expect(sendMessage).toHaveBeenCalledWith("fetch", expect.anything(), "background")
	})
	it("can enable ratings after load, stop them and restart them", async () => {
		document.body.innerHTML = platforms[1][2]
		visibleCards()
		await start("Amazon")
		expect(sendMessage).not.toHaveBeenCalled()
		settings.value.Amazon.showRating = true
		await settle()
		expect(sendMessage).toHaveBeenCalledOnce()
		settings.value.Amazon.showRating = false
		await vi.advanceTimersByTimeAsync(2000)
		expect(sendMessage).toHaveBeenCalledOnce()
		settings.value.Amazon.showRating = true
		await settle()
		expect(sendMessage).toHaveBeenCalledTimes(2)
	})
	it.each([
		[null, null],
		["", null],
		["No episode", null],
		["Season 2 Ep. 3", 3],
		["Stagione 4 Episodio 12", 12],
		["S02E01", 1],
	])("parses episode metadata %s", async (text, result) => {
		expect((await module()).getCurrentEpisodeNumber(text)).toBe(result)
	})
	knownBug("BUG R01: a number in an episode title must not override the episode number", async () => {
		expect((await module()).getCurrentEpisodeNumber("S2 E1 Chapter 42")).toBe(1)
	})
	it.each([
		["1:30", 90],
		["0:00", 0],
		["no timer", false],
		[null, false],
		["", false],
	])("parses ad timer %s", async (text, result) => {
		expect((await module()).parseAdTime(text)).toBe(result)
	})
	knownBug("BUG R02: an invalid seconds field must not produce a valid seek duration", async () => {
		expect((await module()).parseAdTime("0:99")).toBe(false)
	})
	it.each([
		["2026-01-01", "2026-01-31", 30],
		["2026-01-31", "2026-01-01", 30],
		["", "2026-01-01", 31],
	])("calculates day difference %s to %s", async (a, b, result) => {
		expect((await module()).getDiffInDays(a, new Date(b))).toBe(result)
	})
	it("maps rating thresholds, low vote counts and optional dimming", async () => {
		const m = await module()
		expect(m.getColorForRating(0, false)).toBe("grey")
		expect(m.getColorForRating(8, true)).toBe("grey")
		expect(m.getColorForRating(5, false)).toBe("red")
		expect(m.getColorForRating(6, false)).toBe("rgb(245, 197, 24)")
		expect(m.getColorForRating(8, false)).toBe("rgb(0, 166, 0)")
		expect(m.getColorForRating(11, false)).toBeUndefined()
		expect(m.getIsTransparent(2, false)).toBe(false)
		settings.value.Video.dimLowRatings = true
		expect(m.getIsTransparent(2, false)).toBe(true)
		expect(m.getIsTransparent(0, false)).toBe(true)
		expect(m.getIsTransparent(2, true)).toBe(false)
		expect(m.getIsTransparent(8, false)).toBe(false)
	})
	it.each(["de", "en"])("cleans titles for %s", async (lang) => {
		document.documentElement.lang = lang
		const m = await module()
		expect(m.Disney_fixTitle(undefined)).toBeUndefined()
		expect(m.Disney_fixTitle("")).toBeUndefined()
		expect(
			m.Disney_fixTitle(
				lang === "de"
					? "Nummer 1 ZDF Enterprises Label: Neue Folge Heimat Staffel 1"
					: "Number 1 Hulu Original Series New Episode Badge Homeland Season 1",
			),
		).toBe(lang === "de" ? "Heimat" : "Homeland")
	})
	it.each([true, false])("slider input, toggle and cleanup with wrapper=%s", async (wrapper) => {
		const m = await module(),
			video = videoFixture('<div id="position"></div><button id="cleanup"></button>', false),
			speedRef = ref(0)
		video.playbackRate = 1.5
		const position = document.querySelector("#position") as HTMLElement,
			target = document.querySelector("#cleanup") as HTMLElement
		const { slider, speed } = m.createSlider(
			video,
			speedRef,
			position,
			"display:none",
			"",
			wrapper ? "display:flex" : "",
			target,
		)
		expect(video.playbackRate).toBe(1.5)
		expect(speed.textContent).toBe("1.5x")
		const spy = vi.fn()
		position.addEventListener("click", spy)
		speed.click()
		expect(slider.style.display).toBe("block")
		speed.click()
		expect(slider.style.display).toBe("none")
		slider.click()
		expect(spy).not.toHaveBeenCalled()
		slider.value = "18"
		slider.dispatchEvent(new Event("input", { bubbles: true }))
		expect(video.playbackRate).toBe(1.8)
		expect(speedRef.value).toBe(1.8)
		speedRef.value = 1.2
		await settle()
		expect(slider.value).toBe("12")
		await env.mutate()
		expect(slider.isConnected).toBe(true)
		target.remove()
		await env.mutate()
		expect(slider.isConnected).toBe(false)
		expect(speed.isConnected).toBe(false)
	})
	it("cleans up immediately if the player control has already detached", async () => {
		const m = await module()
		const video = videoFixture('<div id="position"></div>', false),
			target = document.createElement("button")
		const { slider } = m.createSlider(
			video,
			ref(1),
			document.querySelector("#position") as HTMLElement,
			"",
			"",
			"",
			target,
		)
		expect(slider.isConnected).toBe(false)
	})
	it.each(["Netflix", "Amazon", "Disney", "Hotstar", "HBO", "Paramount"])(
		"starts playback on fullscreen for %s",
		async (platform) => {
			const video = videoFixture("", platform === "Amazon")
			settings.value.Video.playOnFullScreen = true
			await start(platform)
			Object.defineProperty(document, "fullscreenElement", { configurable: true, value: document.body })
			window.dispatchEvent(new Event("fullscreenchange"))
			await settle()
			expect(video.play).toHaveBeenCalledOnce()
			Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null })
			window.dispatchEvent(new Event("fullscreenchange"))
			expect(video.play).toHaveBeenCalledOnce()
		},
	)
})

describe.each(platforms)("%s rating pipeline", (platform, section, html) => {
	it("displays a cached rating without a network request", async () => {
		document.body.innerHTML = html
		settings.value[section].showRating = true
		vi.mocked(browser.storage.local.get).mockResolvedValue({ DBCache: { "A show": cached() } })
		await start(platform)
		expect(document.querySelector("#rating")?.textContent).toBe("8.0")
		expect(sendMessage).not.toHaveBeenCalled()
		settings.value[section].showRating = false
		await vi.advanceTimersByTimeAsync(1000)
	})
	it("fetches a visible uncached title, excludes people, and saves the cache", async () => {
		document.body.innerHTML = html
		settings.value[section].showRating = true
		visibleCards()
		vi.mocked(sendMessage).mockResolvedValue({
			results: [
				{ media_type: "person", id: 1 },
				{
					id: 123,
					title: "A show",
					media_type: "tv",
					vote_average: 7.2,
					vote_count: 300,
					release_date: "2020-01-01",
					poster_path: "/p",
				},
			],
		})
		await start(platform)
		expect(sendMessage).toHaveBeenCalledWith(
			"fetch",
			expect.objectContaining({ url: expect.stringContaining("query=A%20show"), type: "tmdb" }),
			"background",
		)
		expect(document.querySelector("#rating")?.textContent).toBe("7.2")
		await vi.advanceTimersByTimeAsync(5000)
		expect(browser.storage.local.set).toHaveBeenCalledWith({
			DBCache: expect.objectContaining({ "A show": expect.objectContaining({ score: 7.2, id: 123 }) }),
		})
	})
	it("defers fetching when the title card is offscreen", async () => {
		document.body.innerHTML = html
		settings.value[section].showRating = true
		visibleCards(false)
		await start(platform)
		expect(sendMessage).not.toHaveBeenCalled()
		expect(document.querySelector("#rating")).toBeNull()
	})
	it("renders year, low-score dimming and unknown ratings safely", async () => {
		document.body.innerHTML = html
		settings.value[section].showRating = true
		settings.value.Video.showYear = true
		settings.value.Video.dimLowRatings = true
		vi.mocked(browser.storage.local.get).mockResolvedValue({ DBCache: { "A show": cached({ score: 3 }) } })
		await start(platform)
		expect(document.querySelector("#rating")?.textContent).toBe("2020-3.0")
		expect(document.querySelector('[style*="rgba(40, 40, 40"]')).not.toBeNull()
	})
})

describe("rating cache and hidden-title edge cases", () => {
	it("uses multi-search for a Paramount catalog link without a specific media path", async () => {
		document.body.innerHTML = '<a href="/movies" title="A show"></a>'
		settings.value.Paramount.showRating = true
		visibleCards()
		await start("Paramount")
		expect(sendMessage).toHaveBeenCalledWith(
			"fetch",
			expect.objectContaining({ url: expect.stringContaining("/search/multi?") }),
			"background",
		)
	})
	it("retains available media metadata on an unknown rating", async () => {
		document.body.innerHTML = platforms[0][2]
		settings.value.Netflix.showRating = true
		vi.mocked(browser.storage.local.get).mockResolvedValue({ DBCache: { "A show": cached({ score: undefined }) } })
		await start("Netflix")
		expect(document.querySelector("#rating")?.textContent).toBe("?")
		expect(document.querySelector("#rating")?.getAttribute("alt")).toContain("media_type: tv")
	})
	it.each([
		["Amazon", '<article data-testid="widget-card"><a href="/watch/a"></a></article>'],
		["Amazon", '<article data-testid="widget-card"><a href="/detail/a"></a></article>'],
		["Disney", '<a data-testid="set-item"></a>'],
		["HBO", '<a class="StyledTileLinkNormal-a"></a>'],
		["HBO", '<a class="StyledTileLinkNormal-a" href="/sports/a"></a>'],
		["HBO", '<a class="StyledTileLinkNormal-a" href="/movie/a"></a>'],
		["Paramount", '<a href="/movies/a"></a>'],
	] as const)("waits for complete title metadata on %s", async (platform, html) => {
		document.body.innerHTML = html
		settings.value[platform].showRating = true
		visibleCards()
		await start(platform)
		expect(sendMessage).not.toHaveBeenCalled()
	})
	it("does not hide an entire Hotstar row when one horizontal card is blocked", async () => {
		document.body.innerHTML =
			'<section><a><div data-testid="tray-horizontal-card-hover" aria-label="A show"></div></a><div data-testid="tray-horizontal-card-hover" aria-label="Other"></div></section>'
		settings.value.Disney.hideTitles = true
		hidden.value["A show"] = { platform: "Disney" }
		await start("Hotstar")
		expect(document.querySelector<HTMLElement>('[aria-label="A show"]')!.style.display).toBe("none")
		expect(document.querySelector<HTMLElement>("section")!.style.display).toBe("")
		document.querySelector<HTMLButtonElement>('[aria-label="Other"] button')!.click()
		expect(hidden.value.Other.platform).toBe("Disney")
	})
	it("uses a Netflix card's immediate parent when a virtual slot is absent", async () => {
		document.body.innerHTML = '<section><a data-uia="standard-card" aria-label="A show"></a></section>'
		settings.value.Netflix.hideTitles = true
		hidden.value["A show"] = { platform: "Netflix" }
		await start("Netflix")
		expect(document.querySelector<HTMLElement>("section")!.style.display).toBe("none")
	})
	it("leaves Netflix's own hiding controls to its content script", async () => {
		document.body.innerHTML = platforms[0][2]
		settings.value.Netflix.hideTitles = true
		await start("Netflix")
		expect(document.querySelector("#hideTitleButton")).toBeNull()
	})
	it("handles cached unknown results with no media type or vote count", async () => {
		document.body.innerHTML = platforms[0][2]
		settings.value.Netflix.showRating = true
		vi.mocked(browser.storage.local.get).mockResolvedValue({
			DBCache: {
				"A show": cached({ id: 0, score: undefined, title: undefined, media_type: undefined, vote_count: undefined }),
			},
		})
		await start("Netflix")
		expect(document.querySelector("#rating")?.textContent).toBe("?")
		expect(document.querySelector("#rating")?.getAttribute("alt")).not.toContain("undefined")
	})
	it.each(["Netflix", "Disney"] as const)(
		"handles a detached layout container while rating %s cards",
		async (platform) => {
			document.body.innerHTML =
				platform === "Netflix"
					? '<a data-uia="standard-card" aria-label="A show"></a>'
					: '<a data-testid="set-item" aria-label="A show"></a>'
			settings.value[platform].showRating = true
			vi.mocked(browser.storage.local.get).mockResolvedValue({ DBCache: { "A show": cached() } })
			await start(platform)
			expect(document.querySelector("#rating")).toBeNull()
		},
	)
	it("positions a Disney rating below an adjacent detail label", async () => {
		document.body.innerHTML = '<div><a data-testid="set-item" aria-label="A show"></a><span>Details</span></div>'
		document.title = "Season 2"
		settings.value.Disney.showRating = true
		vi.mocked(browser.storage.local.get).mockResolvedValue({ DBCache: { "A show": cached() } })
		await start("Disney")
		expect(document.querySelector<HTMLElement>("#rating")!.style.top).toBe("0px")
	})
	it("does not duplicate a Hotstar badge after a card loses its marker class", async () => {
		document.body.innerHTML = platforms[3][2]
		settings.value.Disney.showRating = true
		vi.mocked(browser.storage.local.get).mockResolvedValue({ DBCache: { "A show": cached() } })
		await start("Hotstar")
		document.querySelector("[data-testid]")!.classList.remove("imdb")
		await vi.advanceTimersByTimeAsync(1000)
		expect(document.querySelectorAll("#rating")).toHaveLength(1)
	})
	it("rejects a card outside the horizontal viewport when using fallback viewport dimensions", async () => {
		vi.stubGlobal("innerWidth", 0)
		document.body.innerHTML = platforms[1][2]
		settings.value.Amazon.showRating = true
		visibleCards()
		await start("Amazon")
		expect(sendMessage).not.toHaveBeenCalled()
	})
	it.each([true, false])("handles Prime widgets without a carousel list (visible=%s)", async (visible) => {
		document.body.innerHTML =
			'<article data-testid="widget-card"><a href="/detail/a" aria-label="A show"></a></article>'
		settings.value.Amazon.showRating = true
		visibleCards(visible)
		vi.mocked(sendMessage).mockResolvedValue({
			results: [{ id: 1, title: "A show", vote_average: 8, media_type: "tv" }],
		})
		await start("Amazon")
		expect(document.querySelector("#rating") !== null).toBe(visible)
		expect(document.querySelector("article")!.classList.contains("imdb")).toBe(visible)
	})
	it("hides standalone Prime widgets and does not add duplicate hide buttons", async () => {
		document.body.innerHTML =
			'<article data-testid="widget-card"><a href="/detail/a" aria-label="A show"></a></article>'
		settings.value.Amazon.hideTitles = true
		await start("Amazon")
		await vi.advanceTimersByTimeAsync(1000)
		expect(document.querySelectorAll("#hideTitleButton")).toHaveLength(1)
		document.querySelector<HTMLButtonElement>("#hideTitleButton")!.click()
		expect(document.querySelector<HTMLElement>("article")!.style.display).toBe("none")
		expect(hidden.value["A show"].platform).toBe("Amazon")
		await vi.advanceTimersByTimeAsync(2000)
		expect(settings.value.Statistics.SegmentsSkipped).toBe(0)
	})
	it("renders larger ratings on mobile and uses the browser language when HTML has no language", async () => {
		vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mobile")
		vi.spyOn(navigator, "language", "get").mockReturnValue("it-IT")
		document.documentElement.lang = ""
		document.body.innerHTML = platforms[1][2]
		settings.value.Amazon.showRating = true
		visibleCards()
		vi.mocked(sendMessage).mockResolvedValue({ results: [{ id: 1, title: "A show", vote_average: 8 }] })
		await start("Amazon")
		expect(document.querySelector<HTMLElement>("#rating")!.style.fontSize).toBe("4vw")
		expect(sendMessage).toHaveBeenCalledWith(
			"fetch",
			expect.objectContaining({ url: expect.stringContaining("language=it-IT") }),
			"background",
		)
	})
	it("uses the fallback language when neither browser nor document supplies one", async () => {
		vi.spyOn(navigator, "language", "get").mockReturnValue("")
		document.documentElement.lang = ""
		document.body.innerHTML = platforms[1][2]
		settings.value.Amazon.showRating = true
		visibleCards()
		await start("Amazon")
		expect(sendMessage).toHaveBeenCalledWith(
			"fetch",
			expect.objectContaining({ url: expect.stringContaining("language=en-US") }),
			"background",
		)
	})
	it.each(["topical", "standalone", "series"])("fetches HBO %s cards", async (kind) => {
		document.body.innerHTML = `<a class="StyledTileLinkNormal-a" href="/${kind}/a"><p class="md_strong-a">A show</p></a>`
		settings.value.HBO.showRating = true
		visibleCards()
		await start("HBO")
		expect(sendMessage).toHaveBeenCalledOnce()
	})
	it("skips cards with platform names instead of movie titles", async () => {
		document.body.innerHTML = '<li><article data-card-title="Prime Video"><a href="/detail/a"></a></article></li>'
		settings.value.Amazon.showRating = true
		visibleCards()
		await start("Amazon")
		expect(sendMessage).not.toHaveBeenCalled()
	})
	it("uses viewport element dimensions when window dimensions are unavailable", async () => {
		vi.stubGlobal("innerWidth", 0)
		vi.stubGlobal("innerHeight", 0)
		document.body.innerHTML = platforms[1][2]
		settings.value.Amazon.showRating = true
		visibleCards()
		await start("Amazon")
		expect(sendMessage).not.toHaveBeenCalled()
	})
	it.each([
		["Netflix", "Netflix", '<div data-virtual-slot><a data-uia="standard-card" aria-label="A show"></a></div>'],
		["Amazon", "Amazon", platforms[1][2]],
		["Disney", "Disney", platforms[2][2]],
		["Hotstar", "Disney", platforms[3][2]],
	])("hides stored titles on %s", async (platform, section, html) => {
		document.body.innerHTML = html
		;(settings.value as any)[section].hideTitles = true
		hidden.value = { "A show": { platform: section } }
		await start(platform)
		expect(document.querySelector('[style*="display: none"]')).not.toBeNull()
		expect(settings.value.Statistics.SegmentsSkipped).toBe(1)
	})
	it.each([
		["Amazon", "Amazon", platforms[1][2]],
		["Disney", "Disney", platforms[2][2]],
		["Hotstar", "Disney", platforms[3][2]],
	])("saves hidden-title metadata from a %s card", async (platform, section, html) => {
		document.body.innerHTML = html
		;(settings.value as any)[section].hideTitles = true
		await start(platform)
		const button = document.querySelector("#hideTitleButton") as HTMLElement
		expect(button).not.toBeNull()
		button.click()
		expect(hidden.value["A show"]).toEqual(
			expect.objectContaining({ platform: section, posterPath: null, dateAdded: expect.any(String) }),
		)
	})
	it("refreshes an old rating", async () => {
		document.body.innerHTML = platforms[0][2]
		settings.value.Netflix.showRating = true
		vi.mocked(browser.storage.local.get).mockResolvedValue({ DBCache: { "A show": cached({ date: "2000-01-01" }) } })
		await start("Netflix")
		expect(sendMessage).toHaveBeenCalledWith("fetch", expect.anything(), "background")
	})
	it("deletes expired and non-TMDB cache records", async () => {
		settings.value.General.GCdate = "2000-01-01"
		vi.mocked(browser.storage.local.get).mockResolvedValue({
			DBCache: { old: cached({ date: "2000-01-01" }), wrong: cached({ db: "other" }), keep: cached() },
		})
		await start("Netflix")
		expect(browser.storage.local.set).toHaveBeenCalledWith({ DBCache: { keep: cached() } })
	})
	it("creates missing cache and tolerates its initial persistence failure", async () => {
		vi.mocked(browser.storage.local.get).mockResolvedValue({})
		vi.mocked(browser.storage.local.set).mockRejectedValueOnce(new Error("quota"))
		await start("Netflix")
		expect(browser.storage.local.set).toHaveBeenCalledWith({ DBCache: {} })
	})
	it("accepts cache updates only from local storage", async () => {
		await start("Amazon")
		const cb = vi.mocked(browser.storage.onChanged.addListener).mock.calls.at(-1)![0]
		cb({ DBCache: { newValue: { "A show": cached() } } }, "sync")
		cb({}, "local")
		cb({ DBCache: { newValue: { "A show": cached() } } }, "local")
		document.body.innerHTML = platforms[1][2]
		settings.value.Amazon.showRating = true
		await start("Amazon")
	})
	it("does not request ratings on Disney search pages", async () => {
		vi.stubGlobal("location", new URL("https://www.disneyplus.com/search"))
		settings.value.Disney.showRating = true
		document.body.innerHTML = platforms[2][2]
		visibleCards()
		await start("Disney")
		expect(sendMessage).not.toHaveBeenCalled()
	})
})

describe("rating variants and recovery", () => {
	it.each([
		["Netflix", "/browse/genre/83", "tv"],
		["Netflix", "/browse/genre/34399", "movie"],
		["Disney", "/browse/series", "tv"],
		["Disney", "/browse/movies", "movie"],
		["Amazon", "/video/tv", "tv"],
		["Amazon", "/video/movie", "movie"],
		["Hotstar", "/movies/title", "movie"],
		["Hotstar", "/tv-shows/title", "tv"],
	])("uses %s category %s to select the %s search", async (platform, path, type) => {
		const row = platforms.find((p) => p[0] === platform)!
		document.body.innerHTML = row[2]
		;(settings.value as any)[row[1]].showRating = true
		vi.stubGlobal("location", new URL(`https://example.test${path}`))
		visibleCards()
		await start(platform)
		expect(sendMessage).toHaveBeenCalledWith(
			"fetch",
			expect.objectContaining({ url: expect.stringContaining(`/search/${type}?`) }),
			"background",
		)
	})
	it.each(["movie", "unknown", ""])("handles Amazon media metadata %s", async (type) => {
		document.body.innerHTML = platforms[1][2].replace('data-card-entity-type="TV"', `data-card-entity-type="${type}"`)
		settings.value.Amazon.showRating = true
		visibleCards()
		await start("Amazon")
		expect(sendMessage).toHaveBeenCalledWith(
			"fetch",
			expect.objectContaining({ url: expect.stringContaining(`/search/${type === "movie" ? "movie" : "multi"}?`) }),
			"background",
		)
	})
	it.each(["Paramount", "HBO"])("recognizes %s movie cards", async (platform) => {
		const row = platforms.find((p) => p[0] === platform)!
		document.body.innerHTML = row[2].replace("/shows/a", "/movies/a").replace("/show/a", "/movie/a")
		;(settings.value as any)[row[1]].showRating = true
		visibleCards()
		await start(platform)
		expect(sendMessage).toHaveBeenCalledWith(
			"fetch",
			expect.objectContaining({ url: expect.stringContaining("/search/movie?") }),
			"background",
		)
	})
	it.each([false, true])("handles alternative Prime cards (visible %s)", async (visible) => {
		document.body.innerHTML =
			'<article data-testid="movie-card"><a href="/detail/a" aria-label="A show"></a><div data-testid="title-metadata-main"></div></article>'
		settings.value.Amazon.showRating = true
		visibleCards(visible)
		vi.mocked(sendMessage).mockResolvedValue({ results: [{ id: 2, vote_average: 7 }] })
		await start("Amazon")
		expect(document.querySelector("#rating")?.textContent ?? null).toBe(visible ? "7.0" : null)
	})
	it.each([
		"<span>A show</span>",
		'<img alt="A show">',
		'<a aria-label="A show"></a>',
		'<button data-testid="action" aria-label="A show"></button>',
	])("reads alternative Hotstar metadata %s", async (html) => {
		document.body.innerHTML = `<div data-testid="tray-horizontal-card-hover">${html}</div>`
		settings.value.Disney.showRating = true
		visibleCards()
		await start("Hotstar")
		expect(sendMessage).toHaveBeenCalledWith(
			"fetch",
			expect.objectContaining({ url: expect.stringContaining("query=A%20show") }),
			"background",
		)
	})
	it.each(["", "movie"])("ignores generic Hotstar titles %s", async (title) => {
		document.body.innerHTML = `<div data-testid="tray-card-default" aria-label="${title}"></div>`
		settings.value.Disney.showRating = true
		visibleCards()
		await start("Hotstar")
		expect(sendMessage).not.toHaveBeenCalled()
	})
	it.each([{}, { results: [] }, { results: [{ original_name: "Original", first_air_date: "2025-01-01" }] }])(
		"renders an unknown rating for incomplete TMDB data %j",
		async (data) => {
			document.body.innerHTML = platforms[0][2]
			settings.value.Netflix.showRating = true
			visibleCards()
			vi.mocked(sendMessage).mockResolvedValue(data)
			await start("Netflix")
			expect(document.querySelector("#rating")?.textContent).toBe("?")
		},
	)
	it("initializes a missing cache date while preserving its score", async () => {
		document.body.innerHTML = platforms[0][2]
		settings.value.Netflix.showRating = true
		vi.mocked(browser.storage.local.get).mockResolvedValue({ DBCache: { "A show": cached({ date: undefined }) } })
		await start("Netflix")
		expect(document.querySelector("#rating")?.textContent).toBe("8.0")
	})
	it("refreshes recent releases with few votes", async () => {
		const date = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10)
		document.body.innerHTML = platforms[0][2]
		settings.value.Netflix.showRating = true
		vi.mocked(browser.storage.local.get).mockResolvedValue({
			DBCache: { "A show": cached({ date, release_date: date, vote_count: 10 }) },
		})
		await start("Netflix")
		expect(sendMessage).toHaveBeenCalledWith("fetch", expect.anything(), "background")
	})
	it("clears a cache that exceeds the five-megabyte limit", async () => {
		settings.value.General.GCdate = "2000-01-01"
		vi.mocked(browser.storage.local.get).mockResolvedValue({
			DBCache: { large: cached({ title: "x".repeat(5 * 1024 * 1024) }) },
		})
		await start("Netflix")
		expect(browser.storage.local.set).toHaveBeenCalledWith({ DBCache: {} })
	})
	it("opens Hotstar rating details without triggering its parent", async () => {
		document.body.innerHTML = platforms[3][2]
		settings.value.Disney.showRating = true
		vi.mocked(browser.storage.local.get).mockResolvedValue({ DBCache: { "A show": cached() } })
		const open = vi.spyOn(window, "open").mockReturnValue(null)
		await start("Hotstar")
		;(document.querySelector("#rating") as HTMLElement).click()
		expect(open).toHaveBeenCalledWith("https://www.themoviedb.org/tv/123", "_blank")
	})
	it.each([0, -1])("gates Prime detail ratings on related tabIndex %s", async (tabIndex) => {
		vi.stubGlobal("location", new URL("https://www.primevideo.com/detail/a"))
		document.body.innerHTML = platforms[1][2] + `<button data-testid="btf-related-tab" tabindex="${tabIndex}"></button>`
		settings.value.Amazon.showRating = true
		visibleCards()
		await start("Amazon")
		expect(vi.mocked(sendMessage).mock.calls.length).toBe(tabIndex === 0 ? 1 : 0)
	})
})
