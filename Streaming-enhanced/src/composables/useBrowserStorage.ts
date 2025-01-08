import { ref, watch } from "vue"
function mergeDeep(defaults: any, source: any): any {
	// Merge the default options with the stored options
	const output = { ...defaults } // Start with defaults

	Object.keys(source).forEach((key) => {
		if (source[key] instanceof Object && key in defaults) {
			// Recursively merge nested objects
			output[key] = mergeDeep(defaults[key], source[key])
		} else if (typeof source[key] === typeof defaults[key]) {
			output[key] = source[key]
		}
	})

	return output
}

export function useBrowserSyncStorage<T>(key: string, defaultValue: T) {
	const data = ref<T>(defaultValue)
	// Initialize storage with the value from chrome.storage.sync
	chrome.storage.sync.get(key, (result) => {
		if (result?.[key] != undefined) {
			if (typeof defaultValue == "object") {
				data.value = mergeDeep(defaultValue, result[key])
			} else if (typeof defaultValue === typeof result[key]) {
				data.value = result[key]
			}
		}
	})

	// Watch for changes in the storage and update chrome.storage.sync
	watch(
		data,
		(newValue) => {
			chrome.storage.sync.set({ [key]: toRaw(newValue) })
		},
		{ deep: true },
	)
	return data
}

export function useBrowserLocalStorage<T>(key: string, defaultValue: T) {
	const data = ref<T>(defaultValue)
	// Initialize storage with the value from chrome.storage.local
	chrome.storage.local.get(key, (result) => {
		if (result?.[key] != undefined) {
			if (typeof defaultValue == "object") {
				data.value = mergeDeep(defaultValue, result[key])
			} else if (typeof defaultValue === typeof result[key]) {
				data.value = result[key]
			}
		}
	})

	// Watch for changes in the storage and update chrome.storage.local
	watch(
		data,
		(newValue) => {
			chrome.storage.local.set({ [key]: toRaw(newValue) })
		},
		{ deep: true },
	)
	return data
}
