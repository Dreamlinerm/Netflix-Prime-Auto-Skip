import { describe, it, expect } from "vitest"
import { detectTitlePattern, fixtureTitles, fixtureTitlesByPattern, DETAILS_SUFFIX } from "./extractTitles"

describe("extractTitles pattern detection", () => {
	it("detects plain details-card pattern", () => {
		const label = `White Collar ${DETAILS_SUFFIX}`
		expect(detectTitlePattern(label)).toBe("details_plain")
	})

	it("detects badged details-card pattern", () => {
		const label = `Under the Banner of Heaven STAR Original ${DETAILS_SUFFIX}`
		expect(detectTitlePattern(label)).toBe("details_badged")
	})

	it("groups the fixture into buckets", () => {
		expect(Array.isArray(fixtureTitles)).toBe(true)
		const alphaSort = (a: string, b: string) => a.localeCompare(b)
		expect(Object.keys(fixtureTitlesByPattern).sort(alphaSort)).toEqual(
			["details_badged", "details_plain", "details_rated_released", "numbered_row", "other", "progress_remaining"].sort(
				alphaSort,
			),
		)
		// sanity: at least one item in the fixture should be a details-card
		const detailsCount =
			fixtureTitlesByPattern.details_plain.length +
			fixtureTitlesByPattern.details_badged.length +
			fixtureTitlesByPattern.details_rated_released.length
		expect(detailsCount).toBeGreaterThan(0)
	})
})
