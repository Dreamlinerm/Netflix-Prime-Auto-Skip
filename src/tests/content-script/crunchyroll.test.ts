import { describe, it, expect } from "vitest"
import {
	getEpisodeRegex,
	isCalendarReleaseQueued,
	parseCalendarReleaseTimestamp,
	shouldHideCalendarRelease,
	shouldBlockPreviewSkip,
} from "../../content-script/crunchyroll"

describe("getEpisodeRegex", () => {
	it("Folgen 1-4 Verfügbar", () => {
		expect("Folgen 1-4 Verfügbar".match(getEpisodeRegex)?.[1]).toBe("4")
		expect("Folgen 1 Verfügbar".match(getEpisodeRegex)?.[1]).toBe("1")
	})
})

describe("shouldBlockPreviewSkip", () => {
	it("blocks the after-credits preview button when skipAfterCredits is disabled", () => {
		expect(shouldBlockPreviewSkip("Skip Preview", false)).toBe(true)
	})
	it("does not block the preview button when skipAfterCredits is enabled", () => {
		expect(shouldBlockPreviewSkip("Skip Preview", true)).toBe(false)
	})
	it("does not block the credits button regardless of skipAfterCredits", () => {
		expect(shouldBlockPreviewSkip("Skip Credits", false)).toBe(false)
		expect(shouldBlockPreviewSkip("Skip Credits", true)).toBe(false)
	})
	it("does not block when aria-label is missing", () => {
		expect(shouldBlockPreviewSkip(undefined, false)).toBe(false)
		expect(shouldBlockPreviewSkip(null, false)).toBe(false)
	})
	it("is case-insensitive", () => {
		expect(shouldBlockPreviewSkip("SKIP PREVIEW", false)).toBe(true)
	})
})

describe("release calendar", () => {
	it("detects queued cards using Crunchyroll's current watchlist marker", () => {
		const card = document.createElement("div")
		card.innerHTML = '<button data-t="remove-from-watchlist-btn"></button>'
		expect(isCalendarReleaseQueued(card)).toBe(true)

		card.innerHTML = '<button data-t="add-to-watchlist-btn"></button>'
		expect(isCalendarReleaseQueued(card)).toBe(false)
	})

	it("keeps premieres visible when filtering to watchlist shows", () => {
		const premiere = document.createElement("div")
		premiere.innerHTML = '<div data-t="premiere-tag"></div><button data-t="add-to-watchlist-btn"></button>'
		expect(shouldHideCalendarRelease(premiere, true)).toBe(false)

		const regularRelease = document.createElement("div")
		regularRelease.innerHTML = '<button data-t="add-to-watchlist-btn"></button>'
		expect(shouldHideCalendarRelease(regularRelease, true)).toBe(true)

		const queuedRelease = document.createElement("div")
		queuedRelease.innerHTML = '<button data-t="remove-from-watchlist-btn"></button>'
		expect(shouldHideCalendarRelease(queuedRelease, true)).toBe(false)
	})

	it("parses localized calendar dates and 12-hour release times", () => {
		const timestamp = parseCalendarReleaseTimestamp(
			"26. Okt.",
			"Montag",
			"Veröffentlichungszeit: 1:30 PM",
			"de",
			new Date(2026, 10, 1, 12),
		)
		expect(timestamp).not.toBeNull()
		const releaseDate = new Date(timestamp!)
		expect([releaseDate.getFullYear(), releaseDate.getMonth(), releaseDate.getDate()]).toEqual([2026, 9, 26])
		expect([releaseDate.getHours(), releaseDate.getMinutes()]).toEqual([13, 30])
	})

	it("parses 24-hour times and month-first dates", () => {
		const timestamp = parseCalendarReleaseTimestamp("Oct 27", "Tuesday", "14:30", "en", new Date(2026, 10, 1))
		expect(timestamp).not.toBeNull()
		const releaseDate = new Date(timestamp!)
		expect([releaseDate.getFullYear(), releaseDate.getMonth(), releaseDate.getDate()]).toEqual([2026, 9, 27])
		expect([releaseDate.getHours(), releaseDate.getMinutes()]).toEqual([14, 30])
	})

	it("rejects calendar entries with an unrecognized date or time", () => {
		expect(parseCalendarReleaseTimestamp("unknown", "Montag", "1:30 PM", "de")).toBeNull()
		expect(parseCalendarReleaseTimestamp("26. Okt.", "Montag", "25:90", "de")).toBeNull()
	})
})
