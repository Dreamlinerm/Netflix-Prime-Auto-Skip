import { describe, it, expect } from "vitest"
import { Disney_fixTitle } from "../../content-script/shared-functions"
import Testitles from "../fixtures/titles.json"

describe("Disney_fixTitle", () => {
	it("details_plain", () => {
		expect(Disney_fixTitle("Homeland Select for details on this title.")).toBe("Homeland")
	})

	it("details_badged", () => {
		expect(Disney_fixTitle("New Episode Badge Paradise Hulu Original Series Select for details on this title.")).toBe(
			"Paradise",
		)
	})

	it("details_rated_released", () => {
		expect(
			Disney_fixTitle(
				"Zoomania 2 Coming March 11 to Disney+ Rated 6 Released 2025. Comedy, Animation genre. Select for details on this title.",
			),
		).toBe("Zoomania 2")
	})

	it("progress_remaining minutes", () => {
		expect(Disney_fixTitle("Paradise Season 2 Episode 1 Graceland 59 minutes remaining")).toBe("Paradise")
	})

	it("progress_remaining hours", () => {
		expect(Disney_fixTitle("Moana 1 hour 54 minutes remaining")).toBe("Moana")
	})

	it("numbered_row", () => {
		expect(
			Disney_fixTitle(
				"Number 1 Hulu Original Series New Episode Badge Paradise Rated 12 Released 2025. Drama, Action and Adventure genre. Select for details on this title.",
			),
		).toBe("Paradise")
	})

	it("ZDF Enterprises", () => {
		expect(Disney_fixTitle("ZDF Enterprises Kommissarin Heller - Herzversagen")).toBe(
			"Kommissarin Heller - Herzversagen",
		)
	})
})

// const TMDB_TOKEN = process.env.TMDB_TOKEN
// if (!TMDB_TOKEN) {
// 	throw new Error("TMDB_TOKEN is not defined in environment variables")
// }

// async function getMovieInfo(title: string) {
// 	const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(title)}&include_adult=false&page=1`
// 	const response = await fetch(url, {
// 		method: "GET",
// 		headers: {
// 			accept: "application/json",
// 			Authorization: `Bearer ${TMDB_TOKEN}`,
// 		},
// 	})
// 	const data = await response.json()

// 	if (data != undefined) {
// 		if (data?.results) data.results = data.results?.filter((item) => item.media_type?.toLowerCase() !== "person")
// 		// themoviedb
// 		const movie = data?.results?.[0]
// 		return movie
// 	}
// 	return null
// }

// Array.from(document.querySelectorAll("a[data-testid='set-item']:not([href^='/browse/page'])")).map((card) => {
// 	return card.getAttribute("aria-label")
// })

// tsx src/tests/fixtures/testRegex.ts > filtered-titles.txt

// describe("Disney_fixTitle", () => {
// 	it.each(Testitles.map((title, index) => [index, title] as const))(
// 		"Disney_fixTitle (Title #%i)",
// 		async (_index, title) => {
// 			const fixedTitle = Disney_fixTitle(title)
// 			console.log("Original Title:", title)
// 			console.log("Fixed Title:", fixedTitle)
// 			const movie = await getMovieInfo(fixedTitle!)
// 			if (!movie?.id) {
// 				throw new Error(
// 					`TMDB lookup returned no match\nOriginal: ${title}\nFixed: ${fixedTitle}\nTMDB first result: ${JSON.stringify(movie, null, 2)}`,
// 				)
// 			}
// 			expect(movie?.id).toBeTruthy()
// 		},
// 	)
// })
