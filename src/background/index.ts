// Sample code if using extensionpay.com
// import { extPay } from '@/utils/payment/extPay'
// extPay.startBackground()
const is_DEV = process.env.NODE_ENV === "development"

chrome.runtime.onInstalled.addListener(async (opt) => {
	// await chrome.storage.local.clear()
	// await chrome.storage.sync.clear()
	// Check if reason is install or update. Eg: opt.reason === 'install' // If extension is installed.
	if (opt.reason === "install") {
		chrome.tabs.create({
			active: true,
			// Open the setup page and append `?type=install` to the URL so frontend
			// can know if we need to show the install page or update page.
			url: chrome.runtime.getURL("src/ui/options-page/index.html#/options-page/install"),
		})
	}

	if (opt.reason === "update" && is_DEV) {
		chrome.tabs.create({
			active: true,
			url: chrome.runtime.getURL("src/ui/options-page/index.html#/options-page/install"),
			// url: chrome.runtime.getURL("src/ui/action-popup/index.html#/action-popup"),
		})
	}
})

self.onerror = function (message, source, lineno, colno, error) {
	console.info("Error: " + message)
	console.info("Source: " + source)
	console.info("Line: " + lineno)
	console.info("Column: " + colno)
	console.info("Error object: " + error)
}

import { onMessage } from "webext-bridge/background"
console.log("background loaded")

const Badges: { [key: string]: string | number } = {}
const isMobile = /Android/i.test(navigator.userAgent)
const isFirefox = !!browser?.webRequest
const action = isFirefox ? browser.browserAction : chrome.action
action.setBadgeBackgroundColor({ color: "#e60010" })
// Increases Badge by 1
async function increaseBadge(tabId: number) {
	if (Badges?.[tabId] === undefined || typeof Badges[tabId] !== "number") {
		Badges[tabId] = 0
	}
	Badges[tabId]++
	console.log("increaseBadge")
	action.setBadgeText({ text: Badges[tabId].toString(), tabId })
}
// Set Badge to a specific value
async function setBadgeText(text: string, tabId: number) {
	Badges[tabId] = text
	action.setBadgeText({ text, tabId })
}

// onMessage
onMessage("updateUrl", async (message: { sender: any; data: { url: string } }) => {
	const { sender, data } = message
	if (sender?.tabId) {
		console.log("updateUrl")
		chrome.tabs.update(sender.tabId, { url: data.url })
	}
})
onMessage("fetch", async (message: { data: { url: string } }) => {
	const { data } = message
	try {
		const response = await fetch(data.url, {
			method: "GET",
			headers: {
				accept: "application/json",
				Authorization:
					"Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5OWQyMWUxMmYzNjU1MjM4NzdhNTAwODVhMmVjYThiZiIsInN1YiI6IjY1M2E3Mjg3MjgxMWExMDBlYTA4NjI5OCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.x_EaVXQkg1_plk0NVSBnoNUl4QlGytdeO613nXIsP3w",
			},
		})
		const responseData = await response.json()
		return responseData
	} catch (error) {
		console.error(error)
		return { error: (error as Error).message }
	}
})
// allowWindowMessaging is security risk thats why we are not using it and using chrome.message instead
// receive message from content script with the badgeText and set it in the badge
chrome.runtime.onMessage.addListener(function (message: { type: string }, sender: any, sendResponse: () => void) {
	if (message.type === "fullscreen") {
		console.log("fullscreen")
		if (sender?.tab?.windowId) chrome.windows.update(sender.tab.windowId, { state: "fullscreen" })
	} else if (message.type === "exitFullscreen") {
		console.log("exitFullscreen")
		if (sender?.tab?.windowId) chrome.windows.update(sender.tab.windowId, { state: "normal" })
	}
	return false
})
onMessage("setBadgeText", async (message: { sender: any; data: { text: string } }) => {
	const { sender, data } = message
	if (sender?.tabId) setBadgeText(data.text, sender.tabId)
})
onMessage("increaseBadge", async (message: { sender: any }) => {
	const { sender } = message
	if (sender?.tabId) increaseBadge(sender.tabId)
})
onMessage("resetBadge", async (message: { sender: any }) => {
	const { sender } = message
	if (sender?.tabId) {
		if (Badges[sender.tabId]) delete Badges[sender.tabId]
		action.setBadgeText({ text: "", tabId: sender.tabId })
	}
})
if (isFirefox && isMobile) {
	// mobile section
	const { data: settings, promise } = useBrowserSyncStorage<settingsType>("settings", defaultSettings)
	ChangeUserAgent()

	const newUa = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0 streamingEnhanced"
	function ReplaceUserAgent(details: any) {
		if (settings.value.Video.userAgent) {
			for (const header of details.requestHeaders) {
				if (header.name === "User-Agent") {
					header.value = newUa
					break
				}
			}
		}
		return { requestHeaders: details.requestHeaders }
	}

	async function ChangeUserAgent() {
		await promise
		browser.webRequest.onBeforeSendHeaders.addListener(
			ReplaceUserAgent,
			{
				urls: [
					"*://*.disneyplus.com/*",
					"*://*.starplus.com/*",
					"*://*.max.com/*",
					"*://*.hbomax.com/*",
					// these are only the prime video urls
					"*://*.primevideo.com/*",
					"*://*.amazon.com/gp/video/*",
					"*://*.amazon.co.jp/gp/video/*",
					"*://*.amazon.de/gp/video/*",
					"*://*.amazon.co.uk/gp/video/*",
				],
			},
			["blocking", "requestHeaders"],
		)
	}
}
