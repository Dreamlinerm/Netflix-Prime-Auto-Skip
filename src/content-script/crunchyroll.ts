import { sendMessage } from "webext-bridge/content-script"
import { startSharedFunctions, Platforms, createSlider } from "@/content-script/shared-functions"
startSharedFunctions(Platforms.Crunchyroll)
// Global Variables

const { data: settings, promise } = useBrowserSyncStorage<settingsType>("settings", defaultSettings)
const { data: crunchyList, promise: crunchyListPromise } = useBrowserSyncStorage<CrunchyList>("crunchyList", [], false)
const url = globalThis.location.href
const date = new Date()
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
	if (settings.value.Crunchyroll?.bigPlayer) Crunchyroll_bigPlayerStyle()
	CrunchyrollObserver.observe(document, config)
}
// #region Crunchyroll
// Crunchyroll functions
const CrunchyrollObserver = new MutationObserver(Crunchyroll)
async function Crunchyroll() {
	if (settings.value.Crunchyroll?.profile) Crunchyroll_profile()
	const video = document.querySelector("video")
	if (!video) return
	const time = video?.currentTime
	Crunchyroll_Intro_Outro(video, time)
	// Only override/hide Crunchyroll's native controls when the related extension feature is enabled.
	// Otherwise we can cause brief "flash" effects on resume (e.g. starting mid-episode).
	if (settings.value.Crunchyroll?.speedSlider) Crunchyroll_hideNativeSpeedControl()
	// Keep the native skip button from lingering on-screen for long periods.
	Crunchyroll_autoHideNativeSkipButtons()
	Crunchyroll_UpNextButton()
	if (settings.value.Crunchyroll?.speedSlider) Crunchyroll_SpeedSlider(video)
	if (settings.value.Video?.scrollVolume) Crunchyroll_scrollVolume(video)
}

const crunchyrollNextEpisodeButtonId = "enhanced-crunchyroll-next-episode-button"
function Crunchyroll_getSkipButtons(): HTMLElement[] {
	// Avoid relying on `:has()` (can throw on some Chromium builds / contexts).
	// Find the icon and walk up to its button.
	const icons = Array.from(document.querySelectorAll('svg[data-testid="skip-intro-icon"]')) as SVGElement[]
	const set = new Set<HTMLElement>()
	for (const icon of icons) {
		const btn = icon.closest("button") as HTMLElement | null
		if (btn) set.add(btn)
	}
	return Array.from(set)
}

function Crunchyroll_hide(btn: HTMLElement) {
	btn.style.opacity = "0"
	btn.style.pointerEvents = "none"
	btn.style.visibility = "hidden"
}

function Crunchyroll_show(btn: HTMLElement) {
	btn.style.opacity = "1"
	btn.style.pointerEvents = "auto"
	btn.style.visibility = "visible"
}

function Crunchyroll_getNextEpisodeUrl(): string | null {
	const currentUrl = globalThis.location.href

	// Best-effort: standard document hint for pagination.
	const relNext = document.querySelector('link[rel="next"][href]') as HTMLLinkElement | null
	const relNextHref = relNext?.href?.trim()
	if (relNextHref && relNextHref !== currentUrl) return relNextHref

	// Try to find an "Up Next / Next Episode" link in the DOM (varies by UI / locale).
	const candidates = Array.from(document.querySelectorAll('a[href*="/watch/"][href]')) as HTMLAnchorElement[]
	for (const a of candidates) {
		const href = a.href?.trim()
		if (!href || href === currentUrl) continue
		const label = (a.getAttribute("aria-label") ?? a.textContent ?? "").trim().toLowerCase()
		if (!label) continue

		// Keep this list short and robust; it’s only used as a hint.
		if (
			label.includes("up next") ||
			label.includes("next episode") ||
			label.includes("siguiente") ||
			label.includes("prochain") ||
			label.includes("nächste") ||
			label.includes("seguinte")
		) {
			return href
		}
	}

	return null
}

function Crunchyroll_UpNextButton() {
	const nextUrl = Crunchyroll_getNextEpisodeUrl()
	const existing = document.getElementById(crunchyrollNextEpisodeButtonId)

	// Only show the button if we can confidently resolve a next-episode URL.
	if (!nextUrl) {
		existing?.remove()
		return
	}

	// Prefer the existing control stack (same place as the speed slider).
	const position =
		(document.querySelector('[data-testid="bottom-right-controls-stack"]') as HTMLElement) ||
		(document.querySelector('[data-testid="player-controls-root"]') as HTMLElement)
	if (!position) return

	if (existing) {
		existing.setAttribute("data-next-url", nextUrl)
		if ((existing as HTMLElement).dataset.enhancedAutohideInit !== "1") {
			Crunchyroll_setupAutoHideNextEpisodeButton(existing as HTMLElement)
		}
		return
	}

	const button = document.createElement("button")
	button.id = crunchyrollNextEpisodeButtonId
	button.type = "button"
	button.setAttribute("data-next-url", nextUrl)
	button.setAttribute("aria-label", "Next episode")
	button.textContent = "Siguiente"
	button.style.cssText =
		"margin-left:8px;padding:6px 10px;border-radius:9999px;border:1px solid rgba(255,255,255,0.6);background:rgba(0,0,0,0.35);color:white;font-weight:600;cursor:pointer;pointer-events:auto;"

	button.onclick = (event) => {
		event.stopPropagation()
		event.preventDefault()
		const url = button.getAttribute("data-next-url")
		if (url) globalThis.location.href = url
	}

	position.prepend(button)
	Crunchyroll_setupAutoHideNextEpisodeButton(button)
}

let crunchyrollNativeButtonsAutoHideSetup = false
const crunchyrollAutoHideTimeouts = new WeakMap<HTMLElement, number>()
const crunchyrollSkipButtonHiddenByExtAttr = "data-enhanced-skip-hidden"
// Prevent the skip button from flashing back right after we auto-skip.
const crunchyrollSkipButtonReshowCooldownMs = 2500

function Crunchyroll_isAutoskipEnabled(): boolean {
	return Boolean(settings.value.Crunchyroll?.skipIntro || settings.value.Crunchyroll?.skipCredits)
}

function Crunchyroll_getPlayerRoot(): HTMLElement | null {
	return (
		(document.querySelector('[data-testid="player-controls-root"]') as HTMLElement) ||
		(document.querySelector(".video-player-wrapper") as HTMLElement) ||
		((document.querySelector("video") as HTMLElement | null)?.parentElement as HTMLElement | null)
	)
}

function Crunchyroll_isPlayerUiActive(): boolean {
	const controlsRoot = document.querySelector('[data-testid="player-controls-root"]') as HTMLElement | null
	const bottomControls = controlsRoot?.querySelector('[data-testid="bottom-controls-autohide"]') as HTMLElement | null
	const el = bottomControls || controlsRoot
	if (!el) return false
	const style = window.getComputedStyle(el)
	if (style.display === "none") return false
	if (style.visibility === "hidden") return false
	// When controls autohide, they are commonly faded out.
	const opacity = Number.parseFloat(style.opacity || "1")
	if (Number.isFinite(opacity) && opacity <= 0.05) return false
	return true
}

function Crunchyroll_setupAutoHide(button: HTMLElement, timeoutMs: number) {
	if (!button) return
	if (button.dataset.enhancedAutohideInit === "1") return // Already initialized – don't reset the timer.
	button.dataset.enhancedAutohideInit = "1"
	button.style.transition = button.style.transition || "opacity 150ms ease"

	const show = () => {
		button.style.opacity = "1"
		button.style.visibility = "visible"
		button.style.pointerEvents = "auto"
	}
	const hide = () => {
		button.style.opacity = "0"
		button.style.visibility = "hidden"
		button.style.pointerEvents = "none"
	}
	const scheduleHide = () => {
		const existingTimeout = crunchyrollAutoHideTimeouts.get(button)
		if (existingTimeout) window.clearTimeout(existingTimeout)
		const t = window.setTimeout(() => {
			if (!document.contains(button)) return
			if (button.matches(":hover") || button.matches(":focus-visible")) return
			hide()
		}, timeoutMs)
		crunchyrollAutoHideTimeouts.set(button, t)
	}

	scheduleHide()

	button.addEventListener("mouseenter", () => {
		const existingTimeout = crunchyrollAutoHideTimeouts.get(button)
		if (existingTimeout) window.clearTimeout(existingTimeout)
		show()
	})
	button.addEventListener("mouseleave", () => scheduleHide())
	button.addEventListener("focusin", () => {
		const existingTimeout = crunchyrollAutoHideTimeouts.get(button)
		if (existingTimeout) window.clearTimeout(existingTimeout)
		show()
	})
	button.addEventListener("focusout", () => scheduleHide())
}

function Crunchyroll_isUiEnabledElement(el: HTMLElement): boolean {
	// We must not force-show buttons that Crunchyroll has disabled for mid-episode.
	// We intentionally ignore opacity because we use opacity to hide; we only check structural visibility.
	if (!el) return false
	if (el.getAttribute("aria-hidden") === "true") return false
	const style = window.getComputedStyle(el)
	if (style.display === "none") return false
	if (style.visibility === "hidden") return false
	return true
}

function Crunchyroll_isActionableButton(el: HTMLElement): boolean {
	// Stricter than Crunchyroll_isUiEnabledElement: for autoskip we only want buttons the site
	// is currently presenting to the user, not ones we temporarily revealed/modified.
	if (!Crunchyroll_isUiEnabledElement(el)) return false
	const style = window.getComputedStyle(el)
	const opacity = Number.parseFloat(style.opacity || "1")
	if (Number.isFinite(opacity) && opacity <= 0.05) return false
	if (style.pointerEvents === "none") return false
	return true
}

function Crunchyroll_wakeAutoHiddenButtons() {
	// Don't touch the global auto-hide timer here.  It runs independently and
	// handles the initial 6-second hide.  The wake function only re-shows
	// buttons that are already hidden and handles subsequent hide cycles with
	// its own per-button timers.

	const nextBtn = document.getElementById(crunchyrollNextEpisodeButtonId) as HTMLElement | null
	if (nextBtn) {
		nextBtn.style.opacity = "1"
		nextBtn.style.pointerEvents = "auto"
		const existingTimeout = crunchyrollAutoHideTimeouts.get(nextBtn)
		if (existingTimeout) window.clearTimeout(existingTimeout)
		const t = window.setTimeout(() => {
			if (!document.contains(nextBtn)) return
			if (nextBtn.matches(":hover") || nextBtn.matches(":focus-visible")) return
			nextBtn.style.opacity = "0"
			nextBtn.style.pointerEvents = "none"
		}, 5000)
		crunchyrollAutoHideTimeouts.set(nextBtn, t)
	}

	const buttons = Crunchyroll_getSkipButtons()

	buttons.forEach((btn) => {
		if (!Crunchyroll_isUiEnabledElement(btn)) return

		// Only apply the "post-skip" hiding/unhiding logic when autoskip is enabled.
		// If autoskip is disabled, we should not interfere with Crunchyroll's own state machine
		// beyond our timed autohide.
		if (Crunchyroll_isAutoskipEnabled() && btn.getAttribute(crunchyrollSkipButtonHiddenByExtAttr) === "1") {
			// If we hid this node because we *just* skipped, don't immediately re-show it.
			if (Date.now() - lastSkipAtMs < crunchyrollSkipButtonReshowCooldownMs) return
			// Only allow re-show when Crunchyroll is truly presenting it as actionable again.
			if (!Crunchyroll_isActionableButton(btn)) return
			btn.removeAttribute(crunchyrollSkipButtonHiddenByExtAttr)
		}

		btn.style.opacity = "1"
		btn.style.visibility = "visible"
		btn.style.pointerEvents = "auto"

		const existingTimeout = crunchyrollAutoHideTimeouts.get(btn)
		if (existingTimeout) window.clearTimeout(existingTimeout)

		if (Crunchyroll_isPlayerUiActive()) {
			const startedAt = Date.now()
			const poll = window.setInterval(() => {
				if (Date.now() - startedAt > 30_000) {
					window.clearInterval(poll)
					return
				}
				if (!document.contains(btn)) {
					window.clearInterval(poll)
					return
				}
				if (btn.matches(":hover") || btn.matches(":focus-visible")) return
				if (!Crunchyroll_isPlayerUiActive()) {
					btn.style.opacity = "0"
					btn.style.pointerEvents = "none"
					window.clearInterval(poll)
				}
			}, 150)

			crunchyrollAutoHideTimeouts.set(btn, poll as unknown as number)
		} else {
			const t = window.setTimeout(() => {
				if (!document.contains(btn)) return
				if (btn.matches(":hover") || btn.matches(":focus-visible")) return
				btn.style.opacity = "0"
				btn.style.visibility = "hidden"
				btn.style.pointerEvents = "none"
			}, 5000)

			crunchyrollAutoHideTimeouts.set(btn, t)
		}
	})
}

function Crunchyroll_setupPlayerWakeListeners() {
	// Important: the player root can be null early in navigation/SPA transitions.
	// If we mark setup as done too early, buttons can be auto-hidden and never woken.
	const playerRoot = Crunchyroll_getPlayerRoot()
	if (!playerRoot) return
	if (crunchyrollNativeButtonsAutoHideSetup) return
	crunchyrollNativeButtonsAutoHideSetup = true
	const onMove = () => Crunchyroll_wakeAutoHiddenButtons()
	playerRoot.addEventListener("mousemove", onMove, { passive: true })
	playerRoot.addEventListener("touchstart", onMove, { passive: true })
}

// ── Global timer for native skip-button auto-hide ──────────────────────
// We use a GLOBAL timer instead of per-element timers because Crunchyroll's
// React can replace the button DOM node on every render cycle, which would
// reset any per-element state and prevent the timeout from ever completing.
let skipButtonGlobalHideTimer: number | null = null
let skipButtonsAutoHideActive = false

function Crunchyroll_autoHideNativeSkipButtons() {
	const buttons = Crunchyroll_getSkipButtons()

	if (buttons.length === 0) {
		// Buttons gone from DOM → reset so the next appearance starts fresh.
		if (skipButtonGlobalHideTimer) {
			window.clearTimeout(skipButtonGlobalHideTimer)
			skipButtonGlobalHideTimer = null
		}
		skipButtonsAutoHideActive = false
		return
	}

	// Already scheduled → don't restart the timer.
	if (skipButtonsAutoHideActive) return
	skipButtonsAutoHideActive = true

	const appearedAt = Date.now()

	// Poll periodically: hide after 6 s OR when the player UI hides, whichever
	// comes first.  Polling avoids the problem of a single setTimeout being
	// invalidated by DOM element replacement.
	skipButtonGlobalHideTimer = window.setInterval(() => {
		const elapsed = Date.now() - appearedAt
		const uiActive = Crunchyroll_isPlayerUiActive()

		// Give at least 1 s of visibility so the button doesn't flash-and-vanish
		// if the UI is already hidden when the button first appears.
		if (elapsed >= 6000 || (elapsed >= 1000 && !uiActive)) {
			// Query DOM fresh – the actual elements may have been replaced since we started.
			const currentButtons = Crunchyroll_getSkipButtons()
			currentButtons.forEach((btn) => {
				if (btn.matches(":hover") || btn.matches(":focus-visible")) return
				btn.style.transition = btn.style.transition || "opacity 150ms ease"
				btn.style.opacity = "0"
				btn.style.pointerEvents = "none"
			})
			window.clearInterval(skipButtonGlobalHideTimer!)
			skipButtonGlobalHideTimer = null
		}
	}, 200) as unknown as number

	Crunchyroll_setupPlayerWakeListeners()
}
function Crunchyroll_setupAutoHideNextEpisodeButton(button: HTMLElement) {
	// Re-check (button can be replaced by the site, etc.)
	if (!button || button.id !== crunchyrollNextEpisodeButtonId) return
	Crunchyroll_setupAutoHide(button, 5000)
	Crunchyroll_setupPlayerWakeListeners()
}

const crunchyrollHideNativeSpeedStyleId = "enhanced-crunchyroll-hide-native-speed"
function Crunchyroll_hideNativeSpeedControl() {
	// Hide Crunchyroll's new native playback speed button (keep extension speed slider).
	if (document.getElementById(crunchyrollHideNativeSpeedStyleId)) return
	const style = document.createElement("style")
	style.id = crunchyrollHideNativeSpeedStyleId
	style.textContent = /*css*/ `
		[data-testid="playback-speed-button"] { display: none !important; }
	`
	document.head.appendChild(style)
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
	const styles = /*css*/ `
      .video-player-wrapper{
					max-height: calc(100vw / 1.7777);
          height: 100vh;
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
let lastSkipAtMs = 0
let lastRewindPromptStartSec: number | null = null
let lastRewindPromptAtMs = 0

function Crunchyroll_markRewindPromptShown(startTime: number) {
	// Key by start second only; end time can vary slightly due to async timing.
	lastRewindPromptStartSec = Math.floor(startTime)
	lastRewindPromptAtMs = Date.now()
}

function Crunchyroll_hasShownRewindPromptRecently(startTime: number, windowMs: number) {
	const key = Math.floor(startTime)
	if (lastRewindPromptStartSec !== key) return false
	return Date.now() - lastRewindPromptAtMs < windowMs
}
function Crunchyroll_forceHideSkipButtons() {
	if (!Crunchyroll_isAutoskipEnabled()) return
	const buttons = Crunchyroll_getSkipButtons()

	buttons.forEach((btn) => {
		btn.style.opacity = "0"
		btn.style.visibility = "hidden"
		btn.style.pointerEvents = "none"
		btn.setAttribute(crunchyrollSkipButtonHiddenByExtAttr, "1")
	})
}

async function Crunchyroll_Intro_Outro(video: HTMLVideoElement, time: number) {
	const isOutro = time > video.duration / 2

	const shouldSkipIntro = settings.value.Crunchyroll?.skipIntro && !isOutro
	const shouldSkipCredits = settings.value.Crunchyroll?.skipCredits && isOutro

	if (!shouldSkipIntro && !shouldSkipCredits) return

	if (!reverseButtonClicked) {
		const buttons = Crunchyroll_getSkipButtons()
		// Use isUiEnabledElement (not isActionableButton) because our own auto-hide
		// may have left stale inline opacity/pointer-events on the button.  Crunchyroll
		// re-activates the same DOM node for credits, so we must not reject it.
		const button = buttons.find((b) => Crunchyroll_isUiEnabledElement(b))
		const now = Date.now()

		if (button && !skipped && now - lastSkipAtMs > 15_000) {
			skipped = true
			lastSkipAtMs = now

			setTimeout(() => {
				const start = time

				if (shouldSkipCredits && settings.value.Crunchyroll?.skipAfterCredits) {
					video.fastSeek(video.duration)
				} else {
					button.click()
				}

				// Hide ALL skip buttons immediately after the click.
				Crunchyroll_forceHideSkipButtons()

				// After 4 s, restore the button so credits autoskip can detect it.
				// Reset the auto-hide state FIRST so the MutationObserver will
				// re-arm a fresh 6 s hide cycle as soon as the button is visible.
				setTimeout(() => {
					if (skipButtonGlobalHideTimer) {
						window.clearInterval(skipButtonGlobalHideTimer)
						skipButtonGlobalHideTimer = null
					}
					skipButtonsAutoHideActive = false
					Crunchyroll_show(button)
				}, 4000)

				setTimeout(() => {
					const end = video.currentTime
					if (typeof end === "number") {
						const jumpedBy = end - start
						if (jumpedBy > 0.75 && !Crunchyroll_hasShownRewindPromptRecently(start, 60_000)) {
							CrunchyrollGobackbutton(start, end)
							Crunchyroll_markRewindPromptShown(start)

							if (shouldSkipIntro) addSkippedTime(start, end, "IntroTimeSkipped")
							else if (shouldSkipCredits) addSkippedTime(start, end, "SegmentsSkipped")
						}
					}
				}, 600)

				setTimeout(() => {
					skipped = false
				}, 1000)
			}, settings.value.General.Crunchyroll_skipTimeout)
		}
	} else if (!document.querySelector(".reverse-button")) {
		addButton(reverseButtonStartTime, reverseButtonEndTime)
	}
}

function addButton(startTime: number, endTime: number) {
	if (reverseButtonClicked) return
	// If it auto-removed, don't immediately re-add it for the same skip.
	if (Crunchyroll_hasShownRewindPromptRecently(startTime, 60_000)) return
	Crunchyroll_markRewindPromptShown(startTime)
	// Make sure the native skip control is fully hidden before showing the rewind prompt.
	Crunchyroll_forceHideSkipButtons()
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
			if (position) createSlider(video, videoSpeed, position, CrunchyrollSliderStyle, CrunchyrollSpeedStyle)
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
	for (let i = 0; i < days.length; i++) {
		const day = days[i]
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
