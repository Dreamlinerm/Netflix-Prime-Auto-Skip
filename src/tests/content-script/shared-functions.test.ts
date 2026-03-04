import { describe, it, expect } from "vitest"
import { parseAdTime, createSlider, Disney_fixTitle } from "../../content-script/shared-functions"
import Testitles from "../fixtures/titles.json"

describe("parseAdTime", () => {
	it("should parse '1:30' as 90 seconds", () => {
		expect(parseAdTime("1:30")).toBe(90)
	})

	it("should parse '0:45' as 45 seconds", () => {
		expect(parseAdTime("0:45")).toBe(45)
	})

	it("should parse '10:00' as 600 seconds", () => {
		expect(parseAdTime("10:00")).toBe(600)
	})

	it("should return false for null input", () => {
		expect(parseAdTime(null)).toBe(false)
	})

	it("should return false for invalid input", () => {
		expect(parseAdTime("invalid")).toBe(false)
	})
})

// Mock Ref type for createSlider
class Ref {
	constructor(public value: number) {}
}

describe("createSlider", () => {
	it("should create slider and speed elements", () => {
		const video = document.createElement("video") as HTMLVideoElement
		video.playbackRate = 1.0
		const videoSpeed = new Ref(1.0)
		const position = document.createElement("div")
		const sliderStyle = "width: 100px;"
		const speedStyle = "font-size: 12px;"

		const { slider, speed } = createSlider(video, videoSpeed, position, sliderStyle, speedStyle)

		expect(slider).toBeInstanceOf(HTMLInputElement)
		expect(speed).toBeInstanceOf(HTMLParagraphElement)
		expect(position.children.length).toBeGreaterThan(0)
		// Check slider attributes
		expect(slider.type).toBe("range")
		// Check speed text
		expect(speed.textContent).toContain("x")
	})
})

const TMDB_TOKEN = process.env.TMDB_TOKEN
if (!TMDB_TOKEN) {
	throw new Error("TMDB_TOKEN is not defined in environment variables")
}

async function getMovieInfo(title: string) {
	const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(title)}&include_adult=false&page=1`
	const response = await fetch(url, {
		method: "GET",
		headers: {
			accept: "application/json",
			Authorization: `Bearer ${TMDB_TOKEN}`,
		},
	})
	const data = await response.json()

	if (data != undefined) {
		if (data?.results) data.results = data.results?.filter((item) => item.media_type?.toLowerCase() !== "person")
		// themoviedb
		const movie = data?.results?.[0]
		return movie
	}
	return null
}

// Array.from(document.querySelectorAll("a[data-testid='set-item']:not([href^='/browse/page'])")).map((card) => {
// 	return card.getAttribute("aria-label")
// })

describe("Disney_fixTitle", () => {
	it.each(Testitles.map((title, index) => [index, title] as const))(
		"Disney_fixTitle (Title #%i)",
		async (_index, title) => {
			const fixedTitle = Disney_fixTitle(title)
			console.log("Original Title:", title)
			console.log("Fixed Title:", fixedTitle)
			const movie = await getMovieInfo(fixedTitle!)
			if (!movie?.id) {
				throw new Error(
					`TMDB lookup returned no match\nOriginal: ${title}\nFixed: ${fixedTitle}\nTMDB first result: ${JSON.stringify(movie, null, 2)}`,
				)
			}
			expect(movie?.id).toBeTruthy()
		},
	)
})
