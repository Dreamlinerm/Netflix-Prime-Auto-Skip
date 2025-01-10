import { createPinia } from "pinia"
import { useOptionsStore } from "@/stores/options.store"
const pinia = createPinia()

// Global Variables
// Use the store
export const optionsStore = useOptionsStore(pinia)
export const date = new Date()
const { settings } = storeToRefs(optionsStore)

// Functions
// custom log function
export async function log(...args: any[]) {
	console.log(date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + date.getMilliseconds(), ...args)
}

// increase the badge count
export async function increaseBadge() {
	settings.value.Statistics.SegmentsSkipped++
	chrome.runtime.sendMessage({
		type: "increaseBadge",
	})
}
// checks if the store got the data from the storage
export async function checkStoreReady(setting: Ref<any>) {
	return new Promise((resolve) => {
		const readyStateCheckInterval = setInterval(function () {
			if (setting.value?.$ready) {
				clearInterval(readyStateCheckInterval)
				resolve(true)
			}
		}, 1)
	})
}
