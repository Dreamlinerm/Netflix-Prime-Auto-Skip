import test from "node:test"
import assert from "node:assert/strict"
import {
	isStoreIconTitle,
	shouldRemoveWholePaidSection,
	shouldRunAmazonPaidFilter,
} from "./amazonFilterPaidGuard"

test("shouldRunAmazonPaidFilter matches storefront and browse urls", () => {
	assert.equal(shouldRunAmazonPaidFilter("https://www.primevideo.com/storefront/home"), true)
	assert.equal(shouldRunAmazonPaidFilter("https://www.primevideo.com/movie/0ABC"), true)
	assert.equal(shouldRunAmazonPaidFilter("https://www.primevideo.com/tv"), true)
	assert.equal(shouldRunAmazonPaidFilter("https://www.primevideo.com/addons"), true)
})

test("shouldRunAmazonPaidFilter ignores detail pages", () => {
	assert.equal(shouldRunAmazonPaidFilter("https://www.primevideo.com/detail/0ABC"), false)
	assert.equal(shouldRunAmazonPaidFilter("https://www.primevideo.com/watch"), false)
})

test("isStoreIconTitle identifies paid icon labels", () => {
	assert.equal(isStoreIconTitle("Store Filled"), true)
	assert.equal(isStoreIconTitle("store"), true)
	assert.equal(isStoreIconTitle("Prime"), false)
	assert.equal(isStoreIconTitle(undefined), false)
})

test("shouldRemoveWholePaidSection follows current threshold rule", () => {
	assert.equal(shouldRemoveWholePaidSection(8, 6), true)
	assert.equal(shouldRemoveWholePaidSection(8, 5), false)
	assert.equal(shouldRemoveWholePaidSection(2, 2), true)
	assert.equal(shouldRemoveWholePaidSection(0, 0), false)
})
