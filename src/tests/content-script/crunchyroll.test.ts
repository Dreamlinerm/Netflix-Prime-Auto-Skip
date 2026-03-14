import { describe, it, expect } from "vitest"
import { getEpisodeRegex } from "../../content-script/crunchyroll"

describe("getEpisodeRegex", () => {
	it("Folgen 1-4 Verfügbar", () => {
		expect("Folgen 1-4 Verfügbar".match(getEpisodeRegex)?.[1]).toBe("4")
		expect("Folgen 1 Verfügbar".match(getEpisodeRegex)?.[1]).toBe("1")
	})
})
