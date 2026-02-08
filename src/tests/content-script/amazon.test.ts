import { describe, it, expect } from "vitest"
import { isStoreIconTitle, shouldRemoveWholePaidSection, shouldRunAmazonPaidFilter } from "../../content-script/amazon"

describe("shouldRunAmazonPaidFilter", () => {
	it("matches storefront and browse urls", () => {
		expect(shouldRunAmazonPaidFilter("https://www.primevideo.com/storefront/home")).toBe(true)
		expect(shouldRunAmazonPaidFilter("https://www.primevideo.com/movie/0ABC")).toBe(true)
		expect(shouldRunAmazonPaidFilter("https://www.primevideo.com/tv")).toBe(true)
		expect(shouldRunAmazonPaidFilter("https://www.primevideo.com/addons")).toBe(true)
	})

	it("ignores detail pages", () => {
		expect(shouldRunAmazonPaidFilter("https://www.primevideo.com/detail/0ABC")).toBe(false)
		expect(shouldRunAmazonPaidFilter("https://www.primevideo.com/watch")).toBe(false)
	})
})

describe("isStoreIconTitle", () => {
	it("identifies paid icon labels", () => {
		expect(isStoreIconTitle("Store Filled")).toBe(true)
		expect(isStoreIconTitle("store")).toBe(true)
		expect(isStoreIconTitle("Prime")).toBe(false)
		expect(isStoreIconTitle(undefined)).toBe(false)
	})
})

describe("shouldRemoveWholePaidSection", () => {
	it("follows current threshold rule", () => {
		expect(shouldRemoveWholePaidSection(8, 6)).toBe(true)
		expect(shouldRemoveWholePaidSection(8, 5)).toBe(false)
		expect(shouldRemoveWholePaidSection(2, 2)).toBe(true)
		expect(shouldRemoveWholePaidSection(0, 0)).toBe(false)
	})
})
