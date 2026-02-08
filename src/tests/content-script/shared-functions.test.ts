import { describe, it, expect } from "vitest"
import { parseAdTime, createSlider } from "../../content-script/shared-functions"

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
