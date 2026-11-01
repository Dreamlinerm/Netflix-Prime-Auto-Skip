import { describe, it, expect } from "vitest"
import {
	getEpisodeRegex,
	isCalendarReleaseAlreadyShown,
	isCalendarReleaseOnPastDay,
	isCalendarReleaseUpcoming,
	isCalendarReleaseQueued,
	getCalendarItemsFromPage,
	createSavedCalendarCell,
	formatCalendarReleaseTime,
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

	it("saves the series page URL instead of the episode URL", () => {
		const column = document.createElement("section")
		column.innerHTML = `
			<span class="day-weekday">Tuesday</span>
			<div data-t="release-calendar-card">
				<a data-t="watch-page-link" href="https://www.crunchyroll.com/watch/episode-id/episode-title">Episode</a>
				<a data-t="series-page-link" href="https://www.crunchyroll.com/series/series-id/series-title">Series Name</a>
				<button data-t="remove-from-watchlist-btn"></button>
				<span data-t="publish-time">14:30</span>
			</div>
		`

		const { items } = getCalendarItemsFromPage([column], "en")

		expect(items).toHaveLength(1)
		expect(items[0].href).toContain("/series/")
		expect(items[0].href).toBe("https://www.crunchyroll.com/series/series-id/series-title")
	})

	it("builds restored calendar tiles with Crunchyroll's card structure and the extension SVG", () => {
		const cell = createSavedCalendarCell(
			{
				href: "https://www.crunchyroll.com/series/series-id/series-title",
				name: "Series Name",
				time: new Date(2026, 0, 4, 14, 30).toISOString(),
			},
			"en",
			true,
		)

		expect(cell.querySelector(".release-calendar-card--Aj27Z.erc-release-card")).not.toBeNull()
		expect(cell.querySelector(".release-calendar-card__thumbnail-wrapper--AYnvY")).not.toBeNull()
		expect(cell.querySelector(".release-calendar-card__body--qWW18")).not.toBeNull()
		expect(cell.querySelector('[data-t="publish-time"]')?.textContent).toBe("14:30")
		expect(cell.querySelector(".release-calendar-card__title-link--49V7a")?.textContent).toBe("Series Name")
		expect(cell.querySelector("img")?.getAttribute("src")).toMatch(/^data:image\/svg\+xml/)
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

	it("uses weekday and airtime, not the saved calendar date, to determine upcoming releases", () => {
		const now = new Date(2026, 10, 1, 10, 0)
		const previousSundayFutureAirtime = new Date(2026, 9, 25, 11, 0).toISOString()
		const previousSundayPastAirtime = new Date(2026, 9, 25, 9, 0).toISOString()
		const previousMondayAirtime = new Date(2026, 9, 26, 9, 0).toISOString()

		expect(isCalendarReleaseUpcoming(previousSundayFutureAirtime, now)).toBe(true)
		expect(isCalendarReleaseUpcoming(previousSundayPastAirtime, now)).toBe(false)
		expect(isCalendarReleaseUpcoming(previousMondayAirtime, now)).toBe(true)
	})

	it("treats calendar columns before today as past, including when the week wraps", () => {
		const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
		const columns = weekdays.map((weekday) => {
			const column = document.createElement("section")
			column.innerHTML = `<span class="day-weekday">${weekday}</span>`
			return column
		})
		const now = new Date(2026, 10, 4, 10, 0)
		const monday = new Date(2026, 10, 2, 15, 0).toISOString()
		const wednesday = new Date(2026, 10, 4, 9, 0).toISOString()
		const sunday = new Date(2026, 10, 1, 15, 0).toISOString()

		expect(isCalendarReleaseOnPastDay(monday, columns, "en", now)).toBe(true)
		expect(isCalendarReleaseOnPastDay(wednesday, columns, "en", now)).toBe(false)
		expect(isCalendarReleaseOnPastDay(sunday, columns, "en", now)).toBe(false)

		const sundayNow = new Date(2026, 10, 1, 10, 0)
		expect(isCalendarReleaseOnPastDay(monday, columns, "en", sundayNow)).toBe(true)
	})

	it("matches already shown releases by show title, regardless of URL or airtime", () => {
		const shownTitles = new Set(["My Hero Academia"])

		expect(isCalendarReleaseAlreadyShown("My Hero Academia", shownTitles, "en")).toBe(true)
		expect(isCalendarReleaseAlreadyShown("  MY HERO ACADEMIA  ", shownTitles, "en")).toBe(true)
		expect(isCalendarReleaseAlreadyShown("Another Show", shownTitles, "en")).toBe(false)
		expect(isCalendarReleaseAlreadyShown(undefined, shownTitles, "en")).toBe(false)
	})

	it("formats saved release times according to the calendar's time format", () => {
		const time = new Date(2026, 0, 4, 15, 5).toISOString()

		expect(formatCalendarReleaseTime(time, "en-US", true)).toBe("15:05")
		expect(formatCalendarReleaseTime(time, "en-US", false)).toBe("3:05 PM")
	})

	it("parses localized weekdays and 12-hour release times without relying on the calendar date", () => {
		const timestamp = parseCalendarReleaseTimestamp(
			"Montag",
			"Veröffentlichungszeit: 1:30 PM",
			"de",
			new Date(2026, 10, 1, 12),
		)
		expect(timestamp).not.toBeNull()
		const releaseDate = new Date(timestamp!)
		expect([releaseDate.getFullYear(), releaseDate.getMonth(), releaseDate.getDate()]).toEqual([2026, 10, 2])
		expect([releaseDate.getHours(), releaseDate.getMinutes()]).toEqual([13, 30])
	})

	it("parses 24-hour times from localized weekday labels", () => {
		const timestamp = parseCalendarReleaseTimestamp("Tuesday", "14:30", "en", new Date(2026, 10, 1))
		expect(timestamp).not.toBeNull()
		const releaseDate = new Date(timestamp!)
		expect([releaseDate.getFullYear(), releaseDate.getMonth(), releaseDate.getDate()]).toEqual([2026, 10, 3])
		expect([releaseDate.getHours(), releaseDate.getMinutes()]).toEqual([14, 30])
	})

	it("rejects calendar entries with an unrecognized date or time", () => {
		expect(parseCalendarReleaseTimestamp("unknown", "1:30 PM", "de")).toBeNull()
		expect(parseCalendarReleaseTimestamp("Montag", "25:90", "de")).toBeNull()
	})
})
