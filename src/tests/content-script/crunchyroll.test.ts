import { describe, it, expect } from "vitest"
import { getEpisodeRegex, shouldBlockPreviewSkip } from "../../content-script/crunchyroll"

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
