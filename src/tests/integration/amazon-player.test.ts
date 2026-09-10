import { knownBug } from "../helpers/known-bug"
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
import { ref } from "vue"
import { sendMessage } from "webext-bridge/content-script"
import { makeSettings, playerEnvironment, settle, videoFixture } from "../helpers/player"
let settings: ReturnType<typeof makeSettings>
let env: ReturnType<typeof playerEnvironment>
vi.mock("../../composables/useBrowserStorage", () => ({
	useBrowserSyncStorage: () => ({ data: settings, promise: Promise.resolve() }),
	useBrowserLocalStorage: () => ({ data: ref({}), promise: Promise.resolve() }),
}))
async function start(flags: Record<string, boolean> = {}, videoFlags: Record<string, boolean> = {}) {
	Object.assign(settings.value.Amazon, flags)
	Object.assign(settings.value.Video, videoFlags)
	const api = await import("../../content-script/amazon")
	await settle()
	return api
}
const click = (selector: string) => vi.spyOn(document.querySelector(selector) as HTMLElement, "click")
beforeEach(() => {
	vi.resetModules()
	vi.clearAllMocks()
	settings = makeSettings()
	env = playerEnvironment()
})
afterEach(() => env.cleanup())

describe("Prime Video playback through the content-script entrypoint", () => {
	it("keeps a carousel card with an entitlement icon that has no label", async () => {
		document.body.innerHTML =
			'<section data-testid="carousel"><ul><li><article><div data-testid="entitlement-icon"><svg></svg></div></article></li></ul></section>'
		await start({ filterPaid: true })
		await env.mutate()
		expect(document.querySelector("article")).not.toBeNull()
		expect(settings.value.Statistics.SegmentsSkipped).toBe(0)
	})
	it("waits for the speed controls when the video exists first", async () => {
		videoFixture()
		await start({ speedSlider: true })
		await env.mutate()
		expect(document.querySelector("#videoSpeedSlider")).toBeNull()
	})
	it("handles an intro button removed by the site during the seek", async () => {
		const video = videoFixture('<button class="skipelement">Skip intro</button>')
		click("button").mockImplementation(() => {
			video.currentTime = 20
			document.querySelector("button")!.remove()
		})
		await start({ skipIntro: true })
		await env.mutate()
		await vi.advanceTimersByTimeAsync(50)
		expect(settings.value.Statistics.IntroTimeSkipped).toBe(10)
		expect(document.querySelector('[data-uia="reverse-button"]')).toBeNull()
	})
	it("does not treat an unlabelled entitlement icon as a store link", async () => {
		document.body.innerHTML = '<section><article><svg class="NbhXwl"></svg></article></section>'
		await start({ filterPaid: true })
		await env.mutate()
		expect(document.querySelector("article")).not.toBeNull()
	})
	it("can cancel ad detection before its initial startup delay", async () => {
		const video = videoFixture('<span class="atvwebplayersdk-ad-timer-remaining-time">0:30</span>')
		await start({ skipAd: true })
		settings.value.Amazon.skipAd = false
		await vi.advanceTimersByTimeAsync(1500)
		expect(video.currentTime).toBe(10)
		expect(settings.value.Statistics.AmazonAdTimeSkipped).toBe(0)
	})
	it("disabling visual improvements cancels pending scroll locks and removes its styles", async () => {
		await start({ improveUI: true })
		document.dispatchEvent(new Event("scroll"))
		expect(document.body.style.pointerEvents).toBe("none")
		settings.value.Amazon.improveUI = false
		await settle()
		expect(document.body.style.pointerEvents).toBe("")
		expect(document.head.textContent).not.toContain(".atvwebplayersdk-playpause-button")
		document.dispatchEvent(new Event("scroll"))
		expect(document.body.style.pointerEvents).toBe("")
		settings.value.Amazon.improveUI = true
		await settle()
		document.dispatchEvent(new Event("scroll"))
		await vi.advanceTimersByTimeAsync(400)
		expect(document.body.style.pointerEvents).toBe("")
	})
	it.each(["remove video", "disable intro"])("cancels delayed intro accounting on %s", async (action) => {
		const video = videoFixture('<button class="skipelement">Skip intro</button>')
		await start({ skipIntro: true })
		await env.mutate()
		if (action === "remove video") video.remove()
		else settings.value.Amazon.skipIntro = false
		await vi.advanceTimersByTimeAsync(50)
		expect(settings.value.Statistics.IntroTimeSkipped).toBe(0)
		expect(document.querySelector('[data-uia="reverse-button"]')).toBeNull()
	})
	it.each(["remove button", "remove video", "disable"])("cancels a pending promo skip on %s", async (action) => {
		const video = videoFixture('<button class="fu4rd6c f1cw2swo"></button>')
		const button = document.querySelector("button")!
		const spy = vi.spyOn(button, "click")
		await start({ selfAd: true })
		await vi.advanceTimersByTimeAsync(100)
		if (action === "remove button") button.remove()
		else if (action === "remove video") video.remove()
		else settings.value.Amazon.selfAd = false
		await vi.advanceTimersByTimeAsync(200)
		expect(spy).not.toHaveBeenCalled()
		expect(settings.value.Statistics.SegmentsSkipped).toBe(0)
	})
	it("handles a reused promo button once per visible appearance", async () => {
		videoFixture('<button class="fu4rd6c f1cw2swo"></button>')
		const button = document.querySelector("button")!
		const spy = vi.spyOn(button, "click")
		await start({ selfAd: true })
		await vi.advanceTimersByTimeAsync(400)
		expect(spy).toHaveBeenCalledTimes(1)
		button.hidden = true
		await vi.advanceTimersByTimeAsync(100)
		button.hidden = false
		await vi.advanceTimersByTimeAsync(300)
		expect(spy).toHaveBeenCalledTimes(2)
	})
	it("does nothing when settings are off, and tolerates an empty document", async () => {
		await start()
		await env.mutate()
		expect(sendMessage).not.toHaveBeenCalled()
	})
	it("handles a missing player with all observer features enabled", async () => {
		await start(
			{ skipIntro: true, skipCredits: true, watchCredits: true, speedSlider: true, filterPaid: true, xray: true },
			{ scrollVolume: true },
		)
		await env.mutate()
		expect(sendMessage).not.toHaveBeenCalled()
	})
	it.each([
		"Salta intro",
		"Skip Intro",
		"Vorspann überspringen",
		"pular abertura",
		"イントロをスキップ",
		"pomiń wstęp",
		"소개 건너뛰기",
		"jeneriği atla",
		"laktawan ang intro",
	])("skips a visible localized intro (%s) and records the actual seek", async (label) => {
		const video = videoFixture(`<div><div><div><button>${label}</button></div></div></div>`)
		const button = document.querySelector("button")!
		const spy = vi.spyOn(button, "click").mockImplementation(() => {
			video.currentTime = 40
		})
		await start({ skipIntro: true })
		await env.mutate()
		await vi.advanceTimersByTimeAsync(50)
		expect(spy).toHaveBeenCalledTimes(1)
		expect(settings.value.Statistics.IntroTimeSkipped).toBe(30)
		expect(document.querySelector('[data-uia="reverse-button"]')).not.toBeNull()
		await env.mutate()
		expect(spy).toHaveBeenCalledTimes(1)
	})
	it("does not click hidden intros, unrelated controls, first-episode intros or next-up cards", async () => {
		videoFixture(
			'<button hidden class="skipelement">Skip intro</button><span data-testid="dp-atf-play-button">S1 E1</span>',
		)
		const spy = click("button")
		await start({ skipIntro: true })
		await env.mutate()
		document.querySelector("span")!.textContent = "S1 E2"
		await env.mutate()
		document.querySelector("button")!.removeAttribute("hidden")
		document.body.insertAdjacentHTML("beforeend", '<button class="nextupcard-button"></button>')
		await env.mutate()
		expect(spy).not.toHaveBeenCalled()
	})
	it("rewinds a skipped intro and suppresses another skip until replay finishes", async () => {
		const video = videoFixture('<div><div><div><button class="skipelement">Skip</button></div></div></div>')
		const spy = click("button").mockImplementation(() => {
			video.currentTime = 40
		})
		await start({ skipIntro: true })
		await env.mutate()
		await vi.advanceTimersByTimeAsync(50)
		;(document.querySelector('[data-uia="reverse-button"]') as HTMLElement).click()
		expect(video.currentTime).toBe(10)
		await vi.advanceTimersByTimeAsync(5000)
		await env.mutate()
		expect(spy).toHaveBeenCalledTimes(1)
		await vi.advanceTimersByTimeAsync(28000)
		await env.mutate()
		expect(spy).toHaveBeenCalledTimes(2)
		await vi.advanceTimersByTimeAsync(5100)
		expect(document.querySelector('[data-uia="reverse-button"]')).toBeNull()
	})
	it("counts no intro time when the site does not actually seek", async () => {
		videoFixture('<button class="skipelement">Skip</button>')
		await start({ skipIntro: true })
		await env.mutate()
		await vi.advanceTimersByTimeAsync(50)
		expect(settings.value.Statistics.IntroTimeSkipped).toBe(0)
	})
	knownBug("BUG A01: an intro button arriving before the video must not crash its delayed callback", async () => {
		document.body.innerHTML = '<button class="skipelement">Skip</button>'
		await start({ skipIntro: true })
		await env.mutate()
		await vi.advanceTimersByTimeAsync(50)
	})
	it("skips only a later episode and throttles repeated credit mutations", async () => {
		videoFixture('<button class="nextupcard-button"></button><span class="nextupcard-episode">Episode 2</span>')
		const spy = click("button")
		await start({ skipCredits: true })
		await env.mutate()
		await env.mutate()
		expect(spy).toHaveBeenCalledTimes(1)
		await vi.advanceTimersByTimeAsync(1000)
		await env.mutate()
		expect(spy).toHaveBeenCalledTimes(2)
		document.querySelector("span")!.textContent = "Episode 1"
		await env.mutate()
		expect(spy).toHaveBeenCalledTimes(2)
		document.querySelector("span")!.remove()
		await env.mutate()
		expect(spy).toHaveBeenCalledTimes(2)
	})
	it("dismisses next-up when watch credits is selected", async () => {
		videoFixture('<button class="nextupcardhide-button"></button>')
		const spy = click("button")
		await start({ watchCredits: true })
		await env.mutate()
		expect(spy).toHaveBeenCalledOnce()
	})
	it("adds a speed slider and applies keyboard limits", async () => {
		const video = videoFixture('<div class="infobar-container"><div><div id="position"></div></div></div>')
		await start({ speedSlider: true })
		await env.mutate()
		expect(document.querySelectorAll("#videoSpeedSlider")).toHaveLength(1)
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }))
		await settle()
		expect(video.playbackRate).toBeCloseTo(1.2)
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }))
		await settle()
		expect(video.playbackRate).toBeCloseTo(1)
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "x" }))
		expect(video.playbackRate).toBeCloseTo(1)
		await env.mutate()
		const slider = document.querySelector("#videoSpeedSlider") as HTMLInputElement
		slider.value = "15"
		slider.dispatchEvent(new Event("input"))
		expect(video.playbackRate).toBe(1.5)
		const speed = document.querySelector("#videoSpeed") as HTMLElement
		speed.click()
		expect(slider.style.display).toBe("block")
		speed.click()
		expect(slider.style.display).toBe("none")
		video.playbackRate = 5
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }))
		expect(video.playbackRate).toBe(2)
		video.playbackRate = 0.6
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }))
		expect(video.playbackRate).toBe(0.6)
		video.remove()
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }))
	})
	it("reserves speed shortcuts before Prime's subtitle handler consumes them", async () => {
		const video = videoFixture('<button id="player-control">Player</button>')
		const control = document.querySelector("#player-control")!
		const openSubtitles = vi.fn((event: Event) => event.preventDefault())
		control.addEventListener("keydown", openSubtitles)
		await start({ speedSlider: true })
		const key = new KeyboardEvent("keydown", { key: "s", bubbles: true, cancelable: true })
		control.dispatchEvent(key)
		expect(video.playbackRate).toBeCloseTo(0.8)
		expect(openSubtitles).not.toHaveBeenCalled()
		expect(key.defaultPrevented).toBe(true)
	})
	it("leaves Prime's shortcuts available when speed controls are disabled or no video exists", async () => {
		const video = videoFixture('<button id="player-control">Player</button>')
		const control = document.querySelector("#player-control")!
		const nativeShortcut = vi.fn()
		control.addEventListener("keydown", nativeShortcut)
		await start({ speedSlider: false })
		const disabledKey = new KeyboardEvent("keydown", { key: "s", bubbles: true, cancelable: true })
		control.dispatchEvent(disabledKey)
		expect(disabledKey.defaultPrevented).toBe(false)
		expect(nativeShortcut).toHaveBeenCalledOnce()
		expect(video.playbackRate).toBe(1)
		settings.value.Amazon.speedSlider = true
		video.remove()
		const noVideoKey = new KeyboardEvent("keydown", { key: "s", bubbles: true, cancelable: true })
		control.dispatchEvent(noVideoKey)
		expect(noVideoKey.defaultPrevented).toBe(false)
		expect(nativeShortcut).toHaveBeenCalledTimes(2)
	})
	it("adds the speed slider with alternate play/pause control markup", async () => {
		videoFixture(
			'<div><div><div><button id="atvwebplayersdk-play-pause-button"></button></div></div><div id="position"></div></div>',
		)
		await start({ speedSlider: true })
		await env.mutate()
		expect(document.querySelector("#videoSpeedSlider")).not.toBeNull()
	})
	knownBug("BUG A02: typing s/d into a search input must not change playback speed", async () => {
		const video = videoFixture('<input type="search">')
		await start({ speedSlider: true })
		document.querySelector("input")!.dispatchEvent(new KeyboardEvent("keydown", { key: "d", bubbles: true }))
		expect(video.playbackRate).toBe(1)
	})
	knownBug("BUG A03: keyboard controls must stop after their setting is disabled", async () => {
		const video = videoFixture()
		await start({ speedSlider: true })
		settings.value.Amazon.speedSlider = false
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }))
		expect(video.playbackRate).toBe(1)
	})
	it("adjusts volume, clamps its range and attaches only once", async () => {
		const video = videoFixture('<button aria-label="Volume"></button>')
		await start({}, { scrollVolume: true })
		await env.mutate()
		await env.mutate()
		const control = document.querySelector("button")!
		video.volume = 0.5
		control.dispatchEvent(new WheelEvent("wheel", { deltaY: -1 }))
		expect(video.volume).toBeCloseTo(0.6)
		control.dispatchEvent(new WheelEvent("wheel", { deltaY: 1 }))
		expect(video.volume).toBeCloseTo(0.5)
		video.volume = 1
		control.dispatchEvent(new WheelEvent("wheel", { deltaY: -1 }))
		expect(video.volume).toBe(1)
		video.volume = 0
		control.dispatchEvent(new WheelEvent("wheel", { deltaY: 1 }))
		expect(video.volume).toBe(0)
		video.remove()
		control.dispatchEvent(new WheelEvent("wheel", { deltaY: 1 }))
	})
	knownBug("BUG A04: a localized volume label must still support scroll volume", async () => {
		const video = videoFixture('<button aria-label="Lautstärke"></button>')
		video.volume = 0.5
		await start({}, { scrollVolume: true })
		await env.mutate()
		document.querySelector("button")!.dispatchEvent(new WheelEvent("wheel", { deltaY: -1 }))
		expect(video.volume).toBeCloseTo(0.6)
	})
	it("closes X-Ray once per URL", async () => {
		videoFixture('<div class="xrayVodHeaderTitle expanded"><button class="arrow show"></button></div>')
		const spy = click("button")
		await start({ xray: true })
		await env.mutate()
		await env.mutate()
		expect(spy).toHaveBeenCalledOnce()
	})
	it("handles fullscreen double-click with and without the site control", async () => {
		videoFixture('<button class="fullscreen-button"></button>')
		const spy = click("button")
		await start({}, { doubleClick: true })
		document.dispatchEvent(new MouseEvent("dblclick"))
		expect(spy).toHaveBeenCalledOnce()
		document.querySelector("button")!.remove()
		document.dispatchEvent(new MouseEvent("dblclick"))
	})
	knownBug("BUG A05: scroll must not leave the page unclickable if scrollend is absent", async () => {
		await start({ improveUI: true })
		document.dispatchEvent(new Event("scroll"))
		await vi.advanceTimersByTimeAsync(1000)
		expect(document.body.style.pointerEvents).not.toBe("none")
	})
	it("restores pointer events after scrollend in supporting browsers", async () => {
		await start({ improveUI: true })
		expect(document.head.querySelector("style")).not.toBeNull()
		document.dispatchEvent(new Event("scroll"))
		expect(document.body.style.pointerEvents).toBe("none")
		document.dispatchEvent(new Event("scrollend"))
		await vi.advanceTimersByTimeAsync(400)
		expect(document.body.style.pointerEvents).toBe("")
	})
})

describe("Prime Video advertising", () => {
	it.each([
		[30, 29],
		[91, 90],
		[120, 90],
	])("seeks a %s second ad by %s seconds", async (seconds, seek) => {
		const video = videoFixture(
			`<span class="atvwebplayersdk-ad-timer-remaining-time">${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}</span>`,
		)
		await start({ skipAd: true })
		await vi.advanceTimersByTimeAsync(1100)
		expect(video.currentTime).toBe(10 + seek)
		expect(settings.value.Statistics.AmazonAdTimeSkipped).toBe(seek)
		await vi.advanceTimersByTimeAsync(100)
		expect(settings.value.Statistics.SegmentsSkipped).toBe(1)
		settings.value.Amazon.skipAd = false
		await vi.advanceTimersByTimeAsync(4000)
		expect(settings.value.Statistics.SegmentsSkipped).toBe(1)
	})
	it.each(["0:01", "invalid", ""])("does not seek an invalid/finished ad (%s)", async (text) => {
		const video = videoFixture(`<span class="atvwebplayersdk-ad-timer-remaining-time">${text}</span>`)
		await start({ skipAd: true })
		await vi.advanceTimersByTimeAsync(1500)
		expect(video.currentTime).toBe(10)
	})
	it("reads a timer in the second child node, then resets the cooldown", async () => {
		const video = videoFixture('<span class="atvwebplayersdk-ad-timer-remaining-time"><i>Ad</i><b>0:05</b></span>')
		await start({ skipAd: true })
		await vi.advanceTimersByTimeAsync(1100)
		expect(video.currentTime).toBe(14)
		await vi.advanceTimersByTimeAsync(1100)
		expect(video.currentTime).toBe(18)
	})
	it("ignores hidden ads, paused or unstarted videos, and self-promotion", async () => {
		const video = videoFixture(
			'<span hidden class="atvwebplayersdk-ad-timer-remaining-time">0:30</span><button class="fu4rd6c f1cw2swo"></button>',
		)
		await start({ skipAd: true })
		await vi.advanceTimersByTimeAsync(1100)
		document.querySelector("span")!.removeAttribute("hidden")
		await vi.advanceTimersByTimeAsync(100)
		document.querySelector("button")!.remove()
		Object.defineProperty(video, "paused", { configurable: true, value: true })
		await vi.advanceTimersByTimeAsync(100)
		Object.defineProperty(video, "paused", { configurable: true, value: false })
		video.currentTime = 0
		await vi.advanceTimersByTimeAsync(100)
		expect(settings.value.Statistics.SegmentsSkipped).toBe(0)
		video.remove()
		await vi.advanceTimersByTimeAsync(100)
	})
	it("skips a promotional ad on play and stops its polling when disabled", async () => {
		const video = videoFixture(
			'<button class="fu4rd6c f1cw2swo"></button><span class="atvwebplayersdk-adtimeindicator-text">0:08</span>',
		)
		const spy = click("button")
		await start({ selfAd: true })
		await vi.advanceTimersByTimeAsync(100)
		video.dispatchEvent(new Event("play"))
		await vi.advanceTimersByTimeAsync(150)
		expect(spy).toHaveBeenCalledOnce()
		expect(settings.value.Statistics.AmazonAdTimeSkipped).toBe(8)
		settings.value.Amazon.selfAd = false
		await vi.advanceTimersByTimeAsync(100)
	})
	knownBug("BUG A06: missing promotion timer must not poison statistics with NaN", async () => {
		const video = videoFixture('<button class="fu4rd6c f1cw2swo"></button>')
		await start({ selfAd: true })
		await vi.advanceTimersByTimeAsync(100)
		video.dispatchEvent(new Event("play"))
		await vi.advanceTimersByTimeAsync(150)
		expect(Number.isFinite(settings.value.Statistics.AmazonAdTimeSkipped)).toBe(true)
	})
	knownBug("BUG A07: a 1:30 promotion must record 90 seconds, not 30", async () => {
		const video = videoFixture(
			'<button class="fu4rd6c f1cw2swo"></button><span class="atvwebplayersdk-adtimeindicator-text">1:30</span>',
		)
		await start({ selfAd: true })
		await vi.advanceTimersByTimeAsync(100)
		video.dispatchEvent(new Event("play"))
		await vi.advanceTimersByTimeAsync(150)
		expect(settings.value.Statistics.AmazonAdTimeSkipped).toBe(90)
	})
	knownBug("BUG A08: enabling skipAd after load must start detecting ads", async () => {
		const video = videoFixture('<span class="atvwebplayersdk-ad-timer-remaining-time">0:30</span>')
		await start()
		settings.value.Amazon.skipAd = true
		await env.mutate()
		await vi.advanceTimersByTimeAsync(1500)
		expect(video.currentTime).toBe(39)
	})
	knownBug("BUG A09: promotion appearing during playback must not require another play event", async () => {
		videoFixture()
		await start({ selfAd: true })
		await vi.advanceTimersByTimeAsync(100)
		document
			.querySelector("#dv-web-player")!
			.insertAdjacentHTML("beforeend", '<button class="fu4rd6c f1cw2swo"></button>')
		const spy = click("button")
		await vi.advanceTimersByTimeAsync(1000)
		expect(spy).toHaveBeenCalled()
	})
})

describe("Prime Video paid-content filter", () => {
	const row = (paid: number, free: number) => {
		document.body.innerHTML = `<section data-testid="carousel"><ul>${'<li><article data-card-entitlement="Unentitled"></article></li>'.repeat(paid)}${'<li><article data-card-entitlement="Entitled"></article></li>'.repeat(free)}</ul></section>`
	}
	it("removes an entirely paid section", async () => {
		row(4, 0)
		await start({ filterPaid: true })
		await env.mutate()
		expect(document.querySelector("section")).toBeNull()
		expect(settings.value.Statistics.SegmentsSkipped).toBe(1)
	})
	it("preserves free cards in a row below the whole-section threshold", async () => {
		row(1, 4)
		await start({ filterPaid: true })
		await env.mutate()
		expect(document.querySelectorAll("li")).toHaveLength(4)
		expect(settings.value.Statistics.SegmentsSkipped).toBe(1)
	})
	knownBug("BUG A10: a mixed row with two included Prime titles must preserve both", async () => {
		row(1, 2)
		await start({ filterPaid: true })
		await env.mutate()
		expect(document.querySelectorAll('[data-card-entitlement="Entitled"]')).toHaveLength(2)
	})
	it("recognizes a Store icon but leaves Prime icons alone", async () => {
		document.body.innerHTML = `<section data-testid="carousel"><ul><li><span data-testid="entitlement-icon"><svg><title>Store Filled</title></svg></span></li>${'<li><span data-testid="entitlement-icon"><svg><title>Prime</title></svg></span></li>'.repeat(4)}</ul></section>`
		await start({ filterPaid: true })
		await env.mutate()
		expect(document.querySelectorAll("li")).toHaveLength(4)
	})
	it("ignores hidden and non-list children when counting paid cards", async () => {
		row(0, 4)
		document
			.querySelector("ul")!
			.insertAdjacentHTML(
				"beforeend",
				'<li data-hidden="true"><article data-card-entitlement="Unentitled"></article></li><div><article data-card-entitlement="Unentitled"></article></div>',
			)
		await start({ filterPaid: true })
		await env.mutate()
		expect(settings.value.Statistics.SegmentsSkipped).toBe(0)
	})
	knownBug("BUG A11: URL query words must not enable the filter on detail pages", async () => {
		const api = await start()
		expect(api.shouldRunAmazonPaidFilter("https://www.primevideo.com/detail/title?ref=storefront")).toBe(false)
	})
})

describe("Prime Video mobile layout and replacement controls", () => {
	it("adds a mobile viewport and reshapes Amazon navigation", async () => {
		vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Firefox mobile")
		document.body.innerHTML = '<div id="nav-belt"></div><div id="nav-main"></div>'
		await start({}, { userAgent: true })
		expect(document.head.querySelector("meta[name=viewport]")?.getAttribute("content")).toBe(
			"width=device-width, initial-scale=1",
		)
		expect((document.querySelector("#nav-main") as HTMLElement).style.display).toBe("none")
		expect((document.querySelector("#nav-belt") as HTMLElement).style.width).toBe("100vw")
	})
	it("keeps mobile Amazon detail layout intact", async () => {
		vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Firefox mobile")
		vi.stubGlobal("location", new URL("https://www.amazon.com/gp/video/detail/a"))
		await start({}, { userAgent: true })
		expect(document.querySelector("meta[name=viewport]")).toBeNull()
	})
	it("handles mobile layout without navigation elements", async () => {
		vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Firefox mobile")
		await start({}, { userAgent: true })
		expect(document.querySelector("meta[name=viewport]")).not.toBeNull()
	})
	it("resynchronizes a replacement video with the existing slider", async () => {
		const video = videoFixture(
			'<input id="videoSpeedSlider" type="range" min="5" max="20" value="15"><p id="videoSpeed"></p>',
		)
		await start({ speedSlider: true })
		await env.mutate()
		expect(video.playbackRate).toBe(1.5)
		document.querySelector("#videoSpeed")!.remove()
		await env.mutate()
		const slider = document.querySelector("#videoSpeedSlider") as HTMLInputElement
		slider.value = "18"
		slider.dispatchEvent(new Event("input"))
		expect(video.playbackRate).toBe(1.8)
	})
	it("does not run on unrelated websites", async () => {
		vi.stubGlobal("location", new URL("https://example.test/"))
		await start({ skipIntro: true })
		expect(sendMessage).not.toHaveBeenCalled()
	})
	it("recognizes a paid legacy icon and leaves a row containing only Prime icons", async () => {
		document.body.innerHTML = '<section data-testid="carousel"><ul><li><svg class="NbhXwl"></svg></li></ul></section>'
		await start({ filterPaid: true })
		await env.mutate()
		expect(document.querySelector("section")).toBeNull()
		document.body.innerHTML =
			'<section data-testid="carousel"><ul><li><span data-testid="entitlement-icon"><svg><title>Prime</title></svg></span></li></ul></section>'
		await env.mutate()
		expect(document.querySelector("section")).not.toBeNull()
	})
	it("does not run the paid filter on a plain detail URL", async () => {
		vi.stubGlobal("location", new URL("https://www.primevideo.com/detail/a"))
		videoFixture()
		await start({ filterPaid: true })
		await env.mutate()
		expect(sendMessage).not.toHaveBeenCalled()
	})
	it("ignores promotional play events when the player is hidden or button missing", async () => {
		const video = videoFixture()
		await start({ selfAd: true })
		await vi.advanceTimersByTimeAsync(100)
		video.dispatchEvent(new Event("play"))
		;(document.querySelector("#dv-web-player") as HTMLElement).style.display = "none"
		video.dispatchEvent(new Event("play"))
		await vi.advanceTimersByTimeAsync(200)
		expect(settings.value.Statistics.SegmentsSkipped).toBe(0)
		document.querySelector("#dv-web-player")!.remove()
		video.dispatchEvent(new Event("play"))
		await vi.advanceTimersByTimeAsync(100)
	})
})
