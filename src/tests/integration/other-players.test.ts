import { knownBug } from "../helpers/known-bug"
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
import { ref } from "vue"
import * as browser from "webextension-polyfill"
import { sendMessage } from "webext-bridge/content-script"
import { makeSettings, playerEnvironment, settle, videoFixture } from "../helpers/player"
let settings: ReturnType<typeof makeSettings>
let env: ReturnType<typeof playerEnvironment>
const hidden = ref<Record<string, any>>({})
const list = ref<any[]>([])
vi.mock("../../composables/useBrowserStorage", () => ({
	useBrowserSyncStorage: (key: string) => ({ data: key === "settings" ? settings : list, promise: Promise.resolve() }),
	useBrowserLocalStorage: () => ({ data: hidden, promise: Promise.resolve() }),
}))
beforeEach(() => {
	vi.resetModules()
	vi.clearAllMocks()
	settings = makeSettings()
	hidden.value = {}
	list.value = []
	env = playerEnvironment("https://www.disneyplus.com/")
	vi.mocked(browser.storage.local.get).mockResolvedValue({})
})
afterEach(() => env.cleanup())
const loaders = {
	Netflix: () => import("../../content-script/netflix"),
	Disney: () => import("../../content-script/disney"),
	HBO: () => import("../../content-script/max"),
	Paramount: () => import("../../content-script/paramount"),
	Crunchyroll: () => import("../../content-script/crunchyroll"),
}
it("ignores other Crunchyroll profiles and a volume control already enhanced", async () => {
	settings.value.General.Crunchyroll_profilePicture = "https://example.test/me.png"
	const video = videoFixture(
		'<div class="profile-item-name"></div><div class="erc-profile-item"><img src="https://example.test/other.png"></div><div data-testid="bottom-left-controls-stack" class="enhanced"><div data-testid="volume-slider-container"></div></div>',
		false,
	)
	const profile = click("img")
	settings.value.Video.scrollVolume = true
	await start("Crunchyroll", { profile: true })
	await env.mutate()
	await vi.advanceTimersByTimeAsync(100)
	expect(profile).not.toHaveBeenCalled()
	expect(video.volume).toBe(1)
})
it("does not count a Crunchyroll seek that did not move the video", async () => {
	videoFixture(
		'<button aria-label="Skip intro"><svg data-testid="skip-intro-icon"></svg></button><div data-testid="player-controls-root"><div data-testid="bottom-controls-autohide"></div></div>',
		false,
	)
	await start("Crunchyroll", { skipIntro: true })
	await env.mutate()
	await vi.advanceTimersByTimeAsync(650)
	expect(settings.value.Statistics.IntroTimeSkipped).toBe(0)
	const rewind = document.querySelector<HTMLElement>(".reverse-button")!
	rewind.click()
	document.body.insertAdjacentHTML("beforeend", '<div class="reverse-button"></div>')
	await env.mutate()
	expect(document.querySelectorAll(".reverse-button")).toHaveLength(1)
})
async function start(service: keyof typeof loaders, flags: Record<string, boolean> = {}) {
	Object.assign(settings.value[service], flags)
	await loaders[service]()
	await settle()
}
const click = (s: string) => vi.spyOn(document.querySelector(s) as HTMLElement, "click")
function shadow(tag: string, html: string) {
	const el = document.createElement(tag)
	document.body.append(el)
	el.attachShadow({ mode: "open" }).innerHTML = html
	return el.shadowRoot!
}

it.each([
	["Netflix", '<div data-uia="control-volume"><div id="volume"></div></div>'],
	["Disney", '<div class="audio-control" id="volume"></div>'],
	[
		"Crunchyroll",
		'<div data-testid="bottom-left-controls-stack"><div data-testid="volume-slider-container" id="volume"></div></div>',
	],
] as const)("%s volume control follows video replacement and the live toggle", async (service, html) => {
	const video = videoFixture(html, false)
	settings.value.Video.scrollVolume = true
	await start(service)
	await env.mutate()
	const control = document.querySelector("#volume")!
	video.volume = 0.5
	control.dispatchEvent(new WheelEvent("wheel", { deltaY: -1 }))
	expect(video.volume).toBeCloseTo(0.6)
	video.remove()
	control.dispatchEvent(new WheelEvent("wheel", { deltaY: -1 }))
	const replacement = document.createElement("video")
	replacement.volume = 0.2
	document.body.append(replacement)
	control.dispatchEvent(new WheelEvent("wheel", { deltaY: -1 }))
	expect(replacement.volume).toBeCloseTo(0.3)
	settings.value.Video.scrollVolume = false
	control.dispatchEvent(new WheelEvent("wheel", { deltaY: 1 }))
	expect(replacement.volume).toBeCloseTo(0.3)
})

it("Crunchyroll fullscreen playback follows its setting after load", async () => {
	const video = videoFixture("", false)
	await start("Crunchyroll")
	Object.defineProperty(document, "fullscreenElement", { configurable: true, value: document.body })
	window.dispatchEvent(new Event("fullscreenchange"))
	expect(video.play).not.toHaveBeenCalled()
	settings.value.Video.playOnFullScreen = true
	await settle()
	window.dispatchEvent(new Event("fullscreenchange"))
	expect(video.play).toHaveBeenCalledOnce()
	Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null })
	window.dispatchEvent(new Event("fullscreenchange"))
	expect(video.play).toHaveBeenCalledOnce()
	settings.value.Video.playOnFullScreen = false
	await settle()
	Object.defineProperty(document, "fullscreenElement", { configurable: true, value: document.body })
	window.dispatchEvent(new Event("fullscreenchange"))
	expect(video.play).toHaveBeenCalledOnce()
	Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null })
})

describe.each(Object.keys(loaders) as (keyof typeof loaders)[])("%s shared playback contract", (service) => {
	it("tolerates controls that have not mounted yet with playback options enabled", async () => {
		settings.value.Video.scrollVolume = true
		await start(service, {
			skipIntro: true,
			skipRecap: true,
			skipCredits: true,
			watchCredits: true,
			skipAd: true,
			speedSlider: true,
			removeGames: true,
			profile: true,
		})
		await env.mutate()
		await vi.advanceTimersByTimeAsync(1000)
		expect(settings.value.Statistics.IntroTimeSkipped).toBe(0)
	})
	it("starts safely on an empty page", async () => {
		await start(service)
		await env.mutate()
		expect(settings.value.Statistics.SegmentsSkipped).toBe(0)
	})
	it("updates playback speed by keyboard and clamps to limits", async () => {
		const video = videoFixture("", false)
		await start(service, { speedSlider: true })
		await env.mutate()
		for (const [key, rate] of [
			["d", 1.2],
			["s", 1],
			["x", 1],
		] as const) {
			document.dispatchEvent(new KeyboardEvent("keydown", { key }))
			expect(video.playbackRate).toBeCloseTo(rate)
		}
		video.playbackRate = 2
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }))
		expect(video.playbackRate).toBe(2)
		video.playbackRate = 0.6
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }))
		expect(video.playbackRate).toBe(0.6)
		video.remove()
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }))
	})
	knownBug("BUG P01: typing in an editable field must not activate playback shortcuts", async () => {
		const video = videoFixture("<textarea></textarea>", false)
		await start(service, { speedSlider: true })
		document.querySelector("textarea")!.dispatchEvent(new KeyboardEvent("keydown", { key: "d", bubbles: true }))
		expect(video.playbackRate).toBe(1)
	})
})

describe("Netflix", () => {
	it("waits for the inner speed-control layout to finish mounting", async () => {
		videoFixture('<div data-uia="controls-standard"><div></div></div>', false)
		await start("Netflix", { speedSlider: true })
		await env.mutate()
		expect(document.querySelector("#videoSpeedSlider")).toBeNull()
	})
	it("waits for volume and speed controls and then leaves an existing slider in place", async () => {
		videoFixture("", false)
		settings.value.Video.scrollVolume = true
		await start("Netflix", { speedSlider: true })
		await env.mutate()
		expect(document.querySelector("#videoSpeedSlider")).toBeNull()
		document.body.insertAdjacentHTML("beforeend", '<input id="videoSpeedSlider">')
		await env.mutate()
		expect(document.querySelectorAll("#videoSpeedSlider")).toHaveLength(1)
	})
	it.each(["/ManageProfiles", "/profiles"])("preserves the user's profile choice on %s", async (path) => {
		vi.stubGlobal("location", new URL("https://netflix.com" + path))
		document.body.innerHTML = '<a href="/YourAccount"></a><div><span class="profile-name">Alice</span></div>'
		settings.value.General.profileName = "Alice"
		const profile = click(".profile-name")
		await start("Netflix", { profile: true })
		await env.mutate()
		expect(profile).not.toHaveBeenCalled()
		expect(settings.value.General.profileName).toBe("Alice")
	})
	it("ignores unmatched saved profiles", async () => {
		document.body.innerHTML = '<div><span class="profile-name">Alice</span></div>'
		settings.value.General.profileName = "Bob"
		const profile = click(".profile-name")
		await start("Netflix", { profile: true })
		expect(profile).not.toHaveBeenCalled()
	})
	it("can save a hidden expanded title without a virtual-slot wrapper", async () => {
		document.body.innerHTML =
			'<a href="/watch/123" aria-label="Example"><div><div class="buttonControls--expand-button"></div></div></a>'
		await start("Netflix", { hideTitles: true })
		await env.mutate()
		document.querySelector<HTMLButtonElement>("button")!.click()
		expect(hidden.value.Example.platform).toBe("Netflix")
	})
	it.each(["player-skip-intro", "player-skip-recap"])("handles %s before a video exists", async (uia) => {
		document.body.innerHTML = `<button data-uia="${uia}"></button>`
		await start("Netflix", { skipIntro: true, skipRecap: true })
		await env.mutate()
		await vi.advanceTimersByTimeAsync(600)
		expect(settings.value.Statistics.IntroTimeSkipped).toBe(0)
		expect(settings.value.Statistics.RecapTimeSkipped).toBe(0)
	})
	it("does not record a seek when the Netflix button leaves playback in place", async () => {
		videoFixture('<button data-uia="player-skip-intro"></button>', false)
		await start("Netflix", { skipIntro: true })
		await env.mutate()
		await vi.advanceTimersByTimeAsync(600)
		expect(settings.value.Statistics.IntroTimeSkipped).toBe(0)
	})
	it.each(["0:99", ":bad", "-1", "999999999999999999999", "2.5"])("ignores malformed ad timer %s", async (text) => {
		const video = videoFixture(`<span class="ltr-mmvz9h">${text}</span>`, false)
		await start("Netflix", { skipAd: true })
		await vi.advanceTimersByTimeAsync(200)
		expect(video.playbackRate).toBe(1)
		expect(video.muted).toBe(false)
	})
	it("dismisses a pause ad before the video mounts", async () => {
		document.body.innerHTML =
			'<div data-uia="pause-ad-title-display"></div><button data-uia="pause-ad-expand-button"></button>'
		const button = click("button")
		await start("Netflix", { skipAd: true })
		await vi.advanceTimersByTimeAsync(100)
		const video = document.createElement("video")
		document.body.append(video)
		await vi.advanceTimersByTimeAsync(100)
		expect(button).toHaveBeenCalled()
		expect(video.pause).toHaveBeenCalled()
	})
	it.each([
		["skipIntro", "player-skip-intro"],
		["skipRecap", "player-skip-recap"],
		["skipRecap", "player-skip-preplay"],
		["skipCredits", "next-episode-seamless-button-draining"],
		["watchCredits", "watch-credits-seamless-button"],
		["skipBlocked", "interrupt-autoplay-continue"],
	])("activates %s through %s", async (flag, selector) => {
		const video = videoFixture(`<button data-uia="${selector}"></button>`, false)
		const spy = click("button")
		await start("Netflix", { [flag]: true })
		await env.mutate()
		video.currentTime = 30
		await vi.advanceTimersByTimeAsync(600)
		expect(spy).toHaveBeenCalledOnce()
		expect(sendMessage).toHaveBeenCalled()
	})
	it("does not skip first-episode intro", async () => {
		videoFixture(
			'<div data-uia="video-title"><span>S1:E1</span></div><button data-uia="player-skip-intro"></button>',
			false,
		)
		const spy = click("button")
		await start("Netflix", { skipIntro: true })
		await env.mutate()
		expect(spy).not.toHaveBeenCalled()
	})
	it("removes both mobile and beta games sections", async () => {
		document.body.innerHTML =
			'<div class="mobile-games-row"></div><section><a data-uia="cloud-game-card"></a></section>'
		await start("Netflix", { removeGames: true })
		await env.mutate()
		expect(document.body.children).toHaveLength(0)
		expect(settings.value.Statistics.SegmentsSkipped).toBe(2)
	})
	it("chooses the saved profile and records a later profile switch", async () => {
		settings.value.General.profileName = "Alice"
		document.body.innerHTML =
			'<a><div><div style="background-image:url(https://example.test/p.png)"></div></div><span class="profile-name">Alice</span></a>'
		const spy = click("a")
		await start("Netflix", { profile: true })
		expect(spy).toHaveBeenCalledOnce()
		document.body.innerHTML =
			'<a href="/YourAccount" aria-label="Bob – Account"><span><img src="https://example.test/b.png"></span></a>'
		await env.mutate()
		expect(settings.value.General.profileName).toBe("Bob")
		expect(settings.value.General.profilePicture).toContain("b.png")
		await env.mutate()
	})
	it.each([
		["Edge Edg/130", 3],
		["Firefox", 8],
	])("accelerates ads on %s and restores speed afterwards", async (ua, rate) => {
		vi.spyOn(navigator, "userAgent", "get").mockReturnValue(ua as string)
		const video = videoFixture('<span class="ltr-mmvz9h">0:30</span>', false)
		settings.value.Video.epilepsy = true
		await start("Netflix", { skipAd: true })
		await vi.advanceTimersByTimeAsync(100)
		expect(video.playbackRate).toBe(rate)
		expect(video.muted).toBe(true)
		expect(video.style.opacity).toBe("0")
		document.querySelector("span")!.textContent = "2"
		await vi.advanceTimersByTimeAsync(100)
		expect(video.playbackRate).toBe(1)
		expect(video.muted).toBe(false)
		expect(video.style.opacity).toBe("")
		document.querySelector("span")!.textContent = "bad"
		await vi.advanceTimersByTimeAsync(100)
		settings.value.Netflix.skipAd = false
		await vi.advanceTimersByTimeAsync(1500)
	})
	knownBug("BUG N01: disabling ad skipping midway must restore mute and playback speed", async () => {
		const video = videoFixture('<span class="ltr-mmvz9h">30</span>', false)
		await start("Netflix", { skipAd: true })
		await vi.advanceTimersByTimeAsync(100)
		settings.value.Netflix.skipAd = false
		await vi.advanceTimersByTimeAsync(100)
		expect(video.muted).toBe(false)
		expect(video.playbackRate).toBe(1)
	})
	it("restores the user's mute, rate and inline opacity when the player is replaced", async () => {
		const video = videoFixture('<span class="ltr-mmvz9h">30</span>', false)
		video.muted = true
		video.playbackRate = 1.5
		video.style.opacity = ".7"
		settings.value.Video.epilepsy = true
		await start("Netflix", { skipAd: true })
		await vi.advanceTimersByTimeAsync(200)
		expect(settings.value.Statistics.SegmentsSkipped).toBe(1)
		video.remove()
		await vi.advanceTimersByTimeAsync(100)
		expect(video.muted).toBe(true)
		expect(video.playbackRate).toBe(1.5)
		expect(video.style.opacity).toBe("0.7")
	})
	it("starts ad skipping when enabled after page load and tolerates rejected autoplay", async () => {
		const video = videoFixture('<span class="ltr-mmvz9h">30</span>', false)
		Object.defineProperty(video, "paused", { configurable: true, value: true })
		vi.mocked(video.play).mockRejectedValueOnce(new Error("autoplay denied"))
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
		await start("Netflix")
		await vi.advanceTimersByTimeAsync(200)
		expect(video.playbackRate).toBe(1)
		settings.value.Netflix.skipAd = true
		await vi.advanceTimersByTimeAsync(100)
		expect(warn).toHaveBeenCalledWith("Could not resume ad playback", expect.any(Error))
		expect(video.playbackRate).toBe(8)
		await vi.advanceTimersByTimeAsync(100)
		expect(video.play).toHaveBeenCalledTimes(2)
	})
	it("cancels deferred pause handling when ad skipping is disabled", async () => {
		const video = videoFixture(
			'<div data-uia="pause-ad-title-display"></div><button data-uia="pause-ad-expand-button"></button>',
			false,
		)
		Object.defineProperty(video, "paused", { configurable: true, value: true })
		await start("Netflix", { skipAd: true })
		await vi.advanceTimersByTimeAsync(100)
		settings.value.Netflix.skipAd = false
		await vi.advanceTimersByTimeAsync(200)
		expect(video.pause).not.toHaveBeenCalled()
	})
	it("removes pause ads without continuing playback", async () => {
		const video = videoFixture(
			'<div data-uia="pause-ad-title-display"></div><button data-uia="pause-ad-expand-button"></button>',
			false,
		)
		Object.defineProperty(video, "paused", { configurable: true, value: true })
		const spy = click("button")
		await start("Netflix", { skipAd: true })
		await vi.advanceTimersByTimeAsync(200)
		expect(spy).toHaveBeenCalledOnce()
		expect(video.pause).toHaveBeenCalled()
		document.querySelector('[data-uia="pause-ad-title-display"]')!.remove()
		await vi.advanceTimersByTimeAsync(1200)
		expect(spy).toHaveBeenCalledOnce()
	})
	it("attaches scroll volume and custom slider to player controls", async () => {
		const video = videoFixture(
			'<div data-uia="control-volume"><div id="volume"></div></div><div data-uia="controls-standard"><div><div><div><div id="position"></div></div></div><div></div></div></div>',
			false,
		)
		settings.value.Video.scrollVolume = true
		await start("Netflix", { speedSlider: true })
		await env.mutate()
		expect(document.querySelector("#videoSpeedSlider")).not.toBeNull()
		video.volume = 0.5
		document.querySelector("#volume")!.dispatchEvent(new WheelEvent("wheel", { deltaY: -1 }))
		expect(video.volume).toBeCloseTo(0.6)
		document.querySelector("#volume")!.dispatchEvent(new WheelEvent("wheel", { deltaY: 1 }))
		expect(video.volume).toBeCloseTo(0.5)
	})
})

describe("HBO and Paramount", () => {
	it.each(["HBO", "Paramount"] as const)(
		"does not invent skipped seconds when a %s intro button does not seek",
		async (service) => {
			videoFixture(`<button class="${service === "HBO" ? "SkipButton-a" : "skip-button"}"></button>`, false)
			await start(service, { skipIntro: true })
			await env.mutate()
			await env.mutate()
			await vi.advanceTimersByTimeAsync(600)
			expect(settings.value.Statistics.IntroTimeSkipped).toBe(0)
		},
	)
	it.each(["", "true", "false"])("ignores a Paramount skip control with the disabled attribute %s", async (value) => {
		videoFixture(`<button class="skip-button" disabled="${value}"></button>`, false)
		const button = click("button")
		await start("Paramount", { skipIntro: true })
		await env.mutate()
		expect(button).not.toHaveBeenCalled()
	})
	it("handles Paramount intro controls before the media mounts and incomplete next-up metadata", async () => {
		document.body.innerHTML =
			'<button class="skip-button"></button><div class="end-card-panel-a"><button class="play-button"></button></div>'
		await start("Paramount", { skipIntro: true, skipCredits: true })
		await env.mutate()
		await vi.advanceTimersByTimeAsync(600)
		expect(settings.value.Statistics.IntroTimeSkipped).toBe(0)
		expect(settings.value.Statistics.SegmentsSkipped).toBe(0)
	})
	it.each([
		["HBO", "SkipButton-test"],
		["Paramount", "skip-button"],
	] as const)("skips %s intro and records seek", async (service, cls) => {
		const video = videoFixture(`<button class="${cls}"></button>`, false)
		const spy = click("button")
		await start(service, { skipIntro: true })
		await env.mutate()
		video.currentTime = 50
		await vi.advanceTimersByTimeAsync(600)
		expect(spy).toHaveBeenCalledOnce()
		expect(settings.value.Statistics.IntroTimeSkipped).toBe(40)
		await vi.advanceTimersByTimeAsync(5000)
	})
	it("does not skip HBO episode one or hidden intro", async () => {
		videoFixture(
			'<span data-testid="player-ux-season-episode">S2 E1</span><button class="SkipButton-a" hidden></button>',
			false,
		)
		const spy = click("button")
		await start("HBO", { skipIntro: true })
		await env.mutate()
		document.querySelector("span")!.textContent = "S2 E2"
		await env.mutate()
		expect(spy).not.toHaveBeenCalled()
	})
	it("supports HBO credits, dismiss controls and movie credits", async () => {
		const video = videoFixture(
			'<button class="UpNextButton-a"></button><button class="DismissButton-a"></button><div class="player-shrink-transition-enter-done"></div>',
			false,
		)
		const next = click(".UpNextButton-a"),
			dismiss = click(".DismissButton-a"),
			videoClick = vi.spyOn(video, "click")
		await start("HBO", { skipCredits: true, watchCredits: true })
		await env.mutate()
		await env.mutate()
		expect(next).toHaveBeenCalledOnce()
		expect(dismiss).toHaveBeenCalledTimes(2)
		expect(videoClick).toHaveBeenCalledTimes(2)
	})
	it("supports Paramount credits and dismiss controls", async () => {
		videoFixture(
			'<div class="end-card-panel-a"><button class="play-button"></button><h2 class="sub-title" title="Episode 2"></h2><button id="close-btn"></button></div>',
			false,
		)
		const next = click(".play-button"),
			dismiss = click("#close-btn")
		await start("Paramount", { skipCredits: true, watchCredits: true })
		await env.mutate()
		await env.mutate()
		expect(next).toHaveBeenCalledOnce()
		expect(dismiss).toHaveBeenCalledTimes(2)
		await vi.advanceTimersByTimeAsync(1000)
		await env.mutate()
		expect(next).toHaveBeenCalledTimes(2)
	})
	it.each([
		["HBO", "ControlsFooterBottomRight-a", 'data-testid="player-ux-fullscreen-button"'],
		["Paramount", "controls-bottom-right", 'class="btn-fullscreen"'],
	] as const)("adds %s speed and fullscreen controls", async (service, cls, attr) => {
		videoFixture(`<div class="${cls}"></div><button ${attr}></button>`, false)
		const spy = click("button")
		settings.value.Video.doubleClick = true
		await start(service, { speedSlider: true })
		await env.mutate()
		expect(document.querySelector("#videoSpeedSlider")).not.toBeNull()
		document.dispatchEvent(new MouseEvent("dblclick"))
		expect(spy).toHaveBeenCalledOnce()
		await env.mutate()
	})
	it("skips a Paramount ad with a cooldown and restores click-to-pause", async () => {
		const video = videoFixture(
			'<div class="ad-info-manager-circular-loader-copy">20</div><div class="ad-click-overlay"></div>',
			false,
		)
		await start("Paramount", { skipAd: true })
		await env.mutate()
		expect(video.currentTime).toBe(30)
		expect(document.querySelector(".ad-click-overlay")).toBeNull()
		video.click()
		expect(video.pause).toHaveBeenCalled()
		video.click()
		expect(video.play).toHaveBeenCalled()
		await env.mutate()
		expect(video.currentTime).toBe(30)
		await vi.advanceTimersByTimeAsync(3000)
		await env.mutate()
		expect(video.currentTime).toBe(50)
	})
})

describe("Disney and Hotstar shadow DOM", () => {
	it("handles missing video and timer metadata in end-credit controls", async () => {
		const root = shadow("up-next-lite-v1", "<button>Next episode 5</button>")
		await start("Disney", { watchCredits: true })
		await env.mutate()
		expect(settings.value.Statistics.SegmentsSkipped).toBe(0)
		root.querySelector("button")!.textContent = "Next episode"
		await env.mutate()
		expect(settings.value.Statistics.SegmentsSkipped).toBe(0)
	})
	it("does not repeat a credit action on unchanged playback time", async () => {
		videoFixture("", false)
		const root = shadow("up-next-lite-v1", "<button>Next episode 5</button>")
		const next = vi.spyOn(root.querySelector("button")!, "click")
		await start("Disney", { skipCredits: true })
		await env.mutate()
		await env.mutate()
		expect(next).toHaveBeenCalledOnce()
	})
	it("resynchronizes a slider whose label disappeared", async () => {
		const video = videoFixture("", false)
		const root = shadow("main-app-controls-overlay", '<div class="experience-controls"></div>')
		await start("Disney", { speedSlider: true })
		await env.mutate()
		root.querySelector("#videoSpeed")!.remove()
		await env.mutate()
		const slider = root.querySelector<HTMLInputElement>("input")!
		slider.value = "15"
		slider.dispatchEvent(new Event("input"))
		expect(video.playbackRate).toBe(1.5)
	})
	it("dismisses Hotstar credit overlays while preserving playback", async () => {
		vi.stubGlobal("location", new URL("https://www.hotstar.com/watch/a"))
		const video = videoFixture("<button><span>Next Episode</span></button>", false)
		const dismiss = vi.spyOn(video, "click")
		await start("Disney", { watchCredits: true })
		await env.mutate()
		expect(dismiss).toHaveBeenCalled()
	})
	it("ignores invalid ad timers and counts successive seeks in one break only once", async () => {
		const video = videoFixture("", false)
		const root = shadow("ad-badge-overlay", '<span class="ad-badge-overlay__content--time-display">bad</span>')
		await start("Disney", { skipAd: true })
		await vi.advanceTimersByTimeAsync(300)
		expect(video.currentTime).toBe(10)
		root.querySelector("span")!.textContent = "0:30"
		await vi.advanceTimersByTimeAsync(300)
		video.currentTime = 10
		await vi.advanceTimersByTimeAsync(300)
		expect(video.currentTime).toBe(10)
		video.currentTime = 11
		await vi.advanceTimersByTimeAsync(300)
		expect(settings.value.Statistics.DisneyAdTimeSkipped).toBe(30)
	})
	it("skips Disney intro in nested shadow roots", async () => {
		const video = videoFixture("", false)
		const root = shadow("skip-overlay", "<skip-button></skip-button>")
		const buttonRoot = root.querySelector("skip-button")!.attachShadow({ mode: "open" })
		buttonRoot.innerHTML = "<button>Skip intro</button>"
		const spy = vi.spyOn(buttonRoot.querySelector("button")!, "click")
		await start("Disney", { skipIntro: true })
		await env.mutate()
		video.currentTime = 40
		await vi.advanceTimersByTimeAsync(600)
		expect(spy).toHaveBeenCalledOnce()
		expect(settings.value.Statistics.IntroTimeSkipped).toBe(30)
	})
	it("respects first-episode metadata", async () => {
		videoFixture("", false)
		const overlay = shadow("main-app-controls-overlay", "<title-bug></title-bug>")
		overlay.querySelector("title-bug")!.attachShadow({ mode: "open" }).innerHTML =
			'<div class="subtitle-field"><span>S1 E1</span></div>'
		await start("Disney", { skipIntro: true })
		await env.mutate()
		expect(sendMessage).not.toHaveBeenCalled()
	})
	it("skips ads and removes the continuation toast", async () => {
		const video = videoFixture('<p class="toast-notification__text" aria-hidden="true"></p>', false)
		const ad = shadow("ad-badge-overlay", '<span class="ad-badge-overlay__content--time-display">0:30</span>')
		await start("Disney", { skipAd: true })
		await vi.advanceTimersByTimeAsync(300)
		expect(video.currentTime).toBe(40)
		expect(document.querySelector("p")).toBeNull()
		ad.innerHTML = ""
		await vi.advanceTimersByTimeAsync(300)
		expect(settings.value.Statistics.DisneyAdTimeSkipped).toBe(30)
	})
	it("skips or watches end credits according to the setting", async () => {
		const video = videoFixture("", false)
		const root = shadow("up-next-lite-v1", "<button>Next episode 5</button>")
		const spy = vi.spyOn(root.querySelector("button")!, "click")
		await start("Disney", { skipCredits: true })
		await env.mutate()
		expect(spy).toHaveBeenCalledOnce()
		settings.value.Disney.skipCredits = false
		settings.value.Disney.watchCredits = true
		await vi.advanceTimersByTimeAsync(1000)
		const videoSpy = vi.spyOn(video, "click")
		await env.mutate()
		expect(videoSpy).toHaveBeenCalled()
	})
	it("creates one speed slider inside the player shadow root", async () => {
		const video = videoFixture("<pointer-actions></pointer-actions>", false)
		const root = shadow("main-app-controls-overlay", '<div class="experience-controls"></div>')
		await start("Disney", { speedSlider: true })
		await env.mutate()
		await env.mutate()
		expect(root.querySelectorAll("#videoSpeedSlider")).toHaveLength(1)
		const slider = root.querySelector("#videoSpeedSlider") as HTMLInputElement
		slider.value = "15"
		slider.dispatchEvent(new Event("input"))
		expect(video.playbackRate).toBe(1.5)
		;(root.querySelector("#videoSpeed") as HTMLElement).click()
		expect(slider.style.display).toBe("block")
		;(root.querySelector("#videoSpeed") as HTMLElement).click()
		expect(slider.style.display).toBe("none")
	})
	it("resynchronizes a restored Disney slider after the player changes speed", async () => {
		const video = videoFixture("<pointer-actions></pointer-actions>", false)
		const root = shadow(
			"main-app-controls-overlay",
			'<div class="experience-controls"><input id="videoSpeedSlider" value="15"><p id="videoSpeed"></p></div>',
		)
		await start("Disney", { speedSlider: true })
		await env.mutate()
		expect(video.playbackRate).toBe(1.5)
	})
	it("adds one home button and changes its hover style", async () => {
		videoFixture('<div><button data-testid="browser-action-button"></button></div>', false)
		await start("Disney")
		await env.mutate()
		await env.mutate()
		expect(document.querySelectorAll("#homeButton")).toHaveLength(1)
		const button = document.querySelector("#homeButton") as HTMLElement
		button.dispatchEvent(new MouseEvent("mouseover"))
		expect(button.style.backgroundColor).toBe("rgb(71, 74, 83)")
		button.dispatchEvent(new MouseEvent("mouseout"))
		expect(button.style.backgroundColor).toBe("rgb(64, 66, 74)")
		const destination = { href: "https://www.disneyplus.com/watch/a" }
		vi.stubGlobal("location", destination)
		button.click()
		expect(destination.href).toBe("/")
	})
})

describe("Crunchyroll", () => {
	it("skips intro, inserts a rewind button, and rewinds by ten-second steps", async () => {
		const video = videoFixture(
			'<button aria-label="Skip Intro"><svg data-testid="skip-intro-icon"></svg></button><div data-testid="player-controls-root"><div data-testid="bottom-controls-autohide"></div></div><button data-testid="jump-backward-button"></button>',
			false,
		)
		const spy = click("button"),
			rewind = click('[data-testid="jump-backward-button"]')
		await start("Crunchyroll", { skipIntro: true })
		await env.mutate()
		await vi.advanceTimersByTimeAsync(1)
		video.currentTime = 35
		await vi.advanceTimersByTimeAsync(600)
		expect(spy).toHaveBeenCalledOnce()
		expect(settings.value.Statistics.IntroTimeSkipped).toBe(25)
		;(document.querySelector(".reverse-button") as HTMLElement).click()
		expect(rewind).toHaveBeenCalledTimes(3)
		await env.mutate()
		await vi.advanceTimersByTimeAsync(30000)
	})
	it.each(["Skip Recap", "Skip Preview"])("does not skip %s when after-credits skipping is off", async (label) => {
		const video = videoFixture(
			`<button aria-label="${label}"><svg data-testid="skip-intro-icon"></svg></button>`,
			false,
		)
		video.currentTime = 800
		const spy = click("button")
		await start("Crunchyroll", { skipCredits: true })
		await env.mutate()
		await vi.advanceTimersByTimeAsync(1000)
		expect(spy).not.toHaveBeenCalled()
	})
	it.each([true, false])("skips after-credits with next-episode control available: %s", async (next) => {
		const video = videoFixture(
			`<button aria-label="Skip Credits"><svg data-testid="skip-intro-icon"></svg></button>${next ? '<button data-testid="next-episode-button"></button>' : ""}`,
			false,
		)
		video.currentTime = 800
		const spy = click(next ? '[data-testid="next-episode-button"]' : "button")
		await start("Crunchyroll", { skipCredits: true, skipAfterCredits: true })
		await env.mutate()
		await vi.advanceTimersByTimeAsync(1)
		expect(spy).toHaveBeenCalledOnce()
	})
	it("ignores paused, beginning and disabled skips", async () => {
		const video = videoFixture('<button><svg data-testid="skip-intro-icon"></svg></button>', false)
		const spy = click("button")
		await start("Crunchyroll")
		await env.mutate()
		video.currentTime = 800
		await env.mutate()
		settings.value.Crunchyroll.skipIntro = true
		video.currentTime = 1
		await env.mutate()
		video.currentTime = 30
		Object.defineProperty(video, "paused", { configurable: true, value: true })
		await env.mutate()
		expect(spy).not.toHaveBeenCalled()
	})
	it("adds big-player CSS once and replaces native speed controls", async () => {
		videoFixture(
			'<div data-testid="bottom-right-controls-stack"></div><button data-testid="playback-speed-button"></button>',
			false,
		)
		await start("Crunchyroll", { bigPlayer: true, speedSlider: true })
		await env.mutate()
		await env.mutate()
		expect(document.querySelectorAll("#enhanced-crunchyroll-big-player-style")).toHaveLength(1)
		expect(document.querySelector('[data-testid="playback-speed-button"]')).toBeNull()
		expect(document.querySelector("#videoSpeedSlider")).not.toBeNull()
	})
	it("chooses the saved profile once its image appears", async () => {
		settings.value.General.Crunchyroll_profilePicture = "https://example.test/me.png"
		document.body.innerHTML =
			'<div class="profile-item-name"></div><div class="erc-profile-item"><img src="https://example.test/me.png"></div>'
		const spy = click("img")
		await start("Crunchyroll", { profile: true })
		await vi.advanceTimersByTimeAsync(100)
		expect(spy).toHaveBeenCalledOnce()
		document.body.innerHTML = '<div class="avatar-wrapper"><img src="https://example.test/other.png"></div>'
		await env.mutate()
		expect(settings.value.General.Crunchyroll_profilePicture).toContain("other.png")
		await vi.advanceTimersByTimeAsync(2200)
	})
})

describe("player replacement, volume and alternate layouts", () => {
	it("hides a Netflix title from its expanded card", async () => {
		document.body.innerHTML =
			'<div class="previewModal--container"><div data-virtual-slot><a href="/watch/123" aria-label="A title"><div><div class="buttonControls--expand-button"></div></div></a></div></div>'
		await start("Netflix", { hideTitles: true })
		await env.mutate()
		const button = document.querySelector("button")!
		expect(button).not.toBeNull()
		button.click()
		expect(hidden.value["A title"]).toEqual(expect.objectContaining({ platform: "Netflix" }))
		expect(document.querySelector(".previewModal--container")).toBeNull()
		await env.mutate()
	})
	it("ignores incomplete Netflix expanded cards", async () => {
		document.body.innerHTML = '<div class="buttonControls--expand-button"></div>'
		await start("Netflix", { hideTitles: true })
		await env.mutate()
		expect(document.querySelector("button")).toBeNull()
		document.body.innerHTML = '<a href="/watch/123"><div class="buttonControls--expand-button"></div></a>'
		await env.mutate()
		expect(document.querySelector("button")).toBeNull()
	})
	it("resynchronizes Paramount speed controls after a video change", async () => {
		const video = videoFixture('<div class="controls-bottom-right"></div>', false)
		await start("Paramount", { speedSlider: true })
		await env.mutate()
		const slider = document.querySelector("#videoSpeedSlider") as HTMLInputElement
		slider.value = "15"
		slider.dispatchEvent(new Event("input"))
		const replacement = document.createElement("video")
		video.replaceWith(replacement)
		await env.mutate()
		expect(replacement.playbackRate).toBe(1.5)
		const label = document.querySelector("#videoSpeed") as HTMLElement
		label.click()
		expect(slider.style.display).toBe("block")
		label.click()
		expect(slider.style.display).toBe("none")
		slider.value = "18"
		slider.dispatchEvent(new Event("input"))
		expect(replacement.playbackRate).toBe(1.8)
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }))
		await settle()
		expect(label.textContent).toBe("1.6x")
		label.remove()
		await env.mutate()
		slider.value = "12"
		slider.dispatchEvent(new Event("input"))
		expect(replacement.playbackRate).toBe(1.2)
	})
	it("updates Disney volume and graphical slider state", async () => {
		const video = videoFixture(
			'<div class="audio-control"><div class="slider-container"><div><i></i><i></i><i></i></div></div></div>',
			false,
		)
		video.volume = 0.5
		settings.value.Video.scrollVolume = true
		await start("Disney")
		await env.mutate()
		const control = document.querySelector(".audio-control")!
		control.dispatchEvent(new WheelEvent("wheel", { deltaY: -1 }))
		expect(video.volume).toBeCloseTo(0.6)
		control.dispatchEvent(new WheelEvent("wheel", { deltaY: 1 }))
		expect(video.volume).toBeCloseTo(0.5)
		expect((document.querySelectorAll(".slider-container i")[2] as HTMLElement).style.height).toBe("50%")
	})
	it("supports Hotstar skip buttons, speed slider and fullscreen controls", async () => {
		vi.stubGlobal("location", new URL("https://www.hotstar.com/"))
		const video = videoFixture(
			'<button><span>Skip Intro</span></button><button><span>Next Episode</span></button><div><div><div><div><button><i class="icon-player-landscape"></i></button></div></div></div></div><button><i class="icon-player-portrait"></i></button>',
			false,
		)
		const spy = click("button")
		settings.value.Video.doubleClick = true
		await start("Disney", { skipIntro: true, skipCredits: true, speedSlider: true })
		await env.mutate()
		await vi.advanceTimersByTimeAsync(600)
		expect(spy).toHaveBeenCalledOnce()
		expect(document.querySelector("#videoSpeedSlider")).not.toBeNull()
		document.dispatchEvent(new MouseEvent("dblclick"))
		settings.value.Disney.skipCredits = false
		settings.value.Disney.watchCredits = true
		await vi.advanceTimersByTimeAsync(1000)
		const videoSpy = vi.spyOn(video, "click")
		await env.mutate()
		expect(videoSpy).toHaveBeenCalled()
	})
	it("handles Hotstar with double-click disabled", async () => {
		vi.stubGlobal("location", new URL("https://www.hotstar.com/"))
		await start("Disney")
		expect(document.ondblclick).toBeNull()
	})
	it("supports StarPlus intro and credits controls", async () => {
		vi.stubGlobal("location", new URL("https://www.starplus.com/"))
		videoFixture('<button data-gv2elementkey="playNext"></button>', false)
		const spy = click("button")
		await start("Disney", { skipIntro: true, skipCredits: true, watchCredits: true })
		await env.mutate()
		expect(spy).toHaveBeenCalled()
	})
	it("sets up Crunchyroll volume and fullscreen controls", async () => {
		const video = videoFixture(
			'<div data-testid="bottom-left-controls-stack"><div data-testid="volume-slider-container"></div></div><button data-testid="fullscreen-button"></button>',
			false,
		)
		settings.value.Video.scrollVolume = true
		settings.value.Video.doubleClick = true
		settings.value.Video.playOnFullScreen = true
		await start("Crunchyroll")
		await env.mutate()
		const control = document.querySelector('[data-testid="volume-slider-container"]')!
		video.volume = 0.5
		control.dispatchEvent(new WheelEvent("wheel", { deltaY: -1 }))
		expect(video.volume).toBeCloseTo(0.6)
		control.dispatchEvent(new WheelEvent("wheel", { deltaY: 1 }))
		expect(video.volume).toBeCloseTo(0.5)
		const spy = click("button")
		document.dispatchEvent(new MouseEvent("dblclick"))
		expect(spy).toHaveBeenCalledOnce()
		Object.defineProperty(document, "fullscreenElement", { configurable: true, value: document.body })
		window.dispatchEvent(new Event("fullscreenchange"))
		await settle()
		expect(video.play).toHaveBeenCalled()
		Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null })
	})
})

it("expires an unused Crunchyroll rewind offer after five seconds", async () => {
	const video = videoFixture(
		'<button aria-label="Skip Intro"><svg data-testid="skip-intro-icon"></svg></button><div data-testid="player-controls-root"><div data-testid="bottom-controls-autohide"></div></div>',
		false,
	)
	click("button").mockImplementation(() => {
		video.currentTime = 40
	})
	await start("Crunchyroll", { skipIntro: true })
	await env.mutate()
	await vi.advanceTimersByTimeAsync(650)
	expect(document.querySelector(".reverse-button")).not.toBeNull()
	await vi.advanceTimersByTimeAsync(5000)
	expect(document.querySelector(".reverse-button")).toBeNull()
})
