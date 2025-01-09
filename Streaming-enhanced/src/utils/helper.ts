import { createPinia } from "pinia"
import { useOptionsStore } from "@/stores/options.store"
const pinia = createPinia()

// Global Variables

// Use the store
export const optionsStore = useOptionsStore(pinia)

const date = new Date()
// ...args
export async function log(...args: any[]) {
	console.log(date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(), ...args)
}

export async function increaseBadge() {
	settings.Statistics.SegmentsSkipped++
	try {
		chrome.storage.sync.set({ settings })
		chrome.runtime.sendMessage({
			type: "increaseBadge",
		})
	} catch (error) {
		log(error)
	}
}
