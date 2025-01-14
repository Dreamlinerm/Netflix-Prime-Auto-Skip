import { ref, watch, nextTick } from "vue"
function mergeDeep(defaults: any, source: any): any {
	// Merge the default options with the stored options
	const output = { ...defaults } // Start with defaults

	Object.keys(defaults).forEach((key) => {
		const defaultValue = defaults[key]
		const sourceValue = source?.[key]

		if (isObject(defaultValue) && sourceValue != null) {
			// Recursively merge nested objects
			output[key] = mergeDeep(defaultValue, sourceValue)
		} else if (checkType(defaultValue, sourceValue)) {
			output[key] = sourceValue
		} else {
			// If the type is different, use the default value
			output[key] = defaultValue
			console.log("Type mismatch", key, sourceValue)
		}
	})

	return output
}

function checkType(defaultValue: any, value: any): boolean {
	// Check if the value type is the same type as the default value or null
	// there are only strings, booleans, nulls and arrays as types left
	return (typeof value === typeof defaultValue && Array.isArray(value) == Array.isArray(defaultValue)) || value === null
}
function isObject(value: any): boolean {
	return value !== null && value instanceof Object && !Array.isArray(value)
}

export function useBrowserSyncStorage<T>(key: string, defaultValue: T) {
	return useBrowserStorage(key, defaultValue, "sync")
}

export function useBrowserLocalStorage<T>(key: string, defaultValue: T) {
	return useBrowserStorage(key, defaultValue, "local")
}

function useBrowserStorage<T>(key: string, defaultValue: T, storageType: "sync" | "local" = "sync") {
	const data = ref<T>(defaultValue)
	let isUpdatingFromStorage = true
	const isObjectc = isObject(defaultValue)
	// check if the data is ready to be used and not just the default value
	if (isObjectc) data.value.$ready = false
	// Initialize storage with the value from chrome.storage.local
	const promise = new Promise((resolve) => {
		chrome.storage[storageType].get(key, async (result) => {
			if (result?.[key] !== undefined) {
				if (isObjectc && isObject(result[key])) {
					data.value = mergeDeep(defaultValue, result[key])
				} else if (checkType(defaultValue, result[key])) {
					data.value = result[key]
				}
			}
			if (isObjectc) data.value.$ready = true
			await nextTick()
			isUpdatingFromStorage = false
			resolve(true)
		})
	})

	// Watch for changes in the storage and update chrome.storage.local
	watch(
		data,
		(newValue) => {
			if (!isUpdatingFromStorage) {
				if (checkType(defaultValue, newValue)) {
					chrome.storage[storageType].set({ [key]: toRaw(newValue) })
				} else {
					console.error("not updating " + key + ": type mismatch")
				}
			}
		},
		{ deep: true, flush: "post" },
	)
	// Add the onChanged listener here
	chrome.storage[storageType].onChanged.addListener(async function (changes) {
		if (changes?.[key]) {
			isUpdatingFromStorage = true
			const { oldValue, newValue } = changes[key]
			data.value = newValue
			await nextTick()
			isUpdatingFromStorage = false
		}
	})
	return { data, promise }
}
