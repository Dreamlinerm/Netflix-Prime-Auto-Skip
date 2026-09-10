import { ref, watch, nextTick, toRaw, getCurrentScope, onScopeDispose } from "vue"
export function mergeDeep(defaults: any, source: any): any {
	// Merge the default options with the stored options
	const output = structuredClone(toRaw(defaults)) // Start with defaults

	Object.keys(defaults).forEach((key) => {
		const defaultValue = defaults[key]
		const sourceValue = source?.[key]

		if (isObject(defaultValue) && isObject(sourceValue)) {
			// Recursively merge nested objects
			output[key] = mergeDeep(defaultValue, sourceValue)
		} else if (checkType(defaultValue, sourceValue)) {
			output[key] = structuredClone(toRaw(sourceValue))
		} else {
			// If the type is different, use the default value
			output[key] = structuredClone(toRaw(defaultValue))
			console.log("Type mismatch", key, sourceValue, defaultValue)
		}
	})

	return output
}

function checkType(defaultValue: any, value: any): boolean {
	// Check if the value type is the same type as the default value or null
	// there are only strings, booleans, nulls and arrays as types left
	return (
		defaultValue === undefined ||
		(defaultValue === null && value === null) ||
		(value !== null && typeof value === typeof defaultValue && Array.isArray(value) == Array.isArray(defaultValue))
	)
}
function isObject(value: any): boolean {
	return value !== null && value instanceof Object && !Array.isArray(value)
}

export function useBrowserSyncStorage<T>(key: string, defaultValue: T, merge = true) {
	return useBrowserStorage(key, defaultValue, "sync", merge)
}

export function useBrowserLocalStorage<T>(key: string, defaultValue: T, merge = true) {
	return useBrowserStorage(key, defaultValue, "local", merge)
}

function useBrowserStorage<T>(key: string, defaultValue: T, storageType: "sync" | "local" = "sync", merge = true) {
	const defaults = structuredClone(toRaw(defaultValue))
	const data = ref<T>(structuredClone(defaults))
	const defaultIsObject = isObject(defaults)
	const normalize = (value: unknown) => {
		if (value === undefined) return structuredClone(defaults)
		if (defaultIsObject && isObject(value)) return merge ? mergeDeep(defaults, value) : structuredClone(value)
		return checkType(defaults, value) ? structuredClone(value) : structuredClone(defaults)
	}
	let isUpdatingFromStorage = true
	let revision = 0
	let disposed = false
	const promise = (async () => {
		try {
			const result = await browser.storage[storageType].get(key)
			if (!disposed && revision === 0) data.value = normalize(result?.[key])
		} catch (error) {
			console.error("Could not load " + key, error)
		} finally {
			await nextTick()
			isUpdatingFromStorage = false
		}
	})()

	// Watch for changes in the storage and update browser.storage
	watch(
		data,
		(newValue) => {
			if (!isUpdatingFromStorage) {
				if (checkType(defaultValue, newValue)) {
					void browser.storage[storageType]
						.set({ [key]: toRaw(newValue) })
						.catch((error) => console.error("Could not save " + key, error))
				} else {
					console.error("not updating " + key + ": type mismatch")
				}
			}
		},
		{ deep: true, flush: "post" },
	)
	// Add the onChanged listener here
	const onChanged = async (changes: Record<string, { newValue?: unknown }>, areaName: string) => {
		if (!disposed && areaName === storageType && changes?.[key]) {
			const currentRevision = ++revision
			isUpdatingFromStorage = true
			const { newValue } = changes[key]
			data.value = normalize(newValue)
			await nextTick()
			if (currentRevision === revision) isUpdatingFromStorage = false
		}
	}
	browser.storage.onChanged.addListener(onChanged)
	if (getCurrentScope())
		onScopeDispose(() => {
			disposed = true
			browser.storage.onChanged.removeListener(onChanged)
		})
	return { data, promise }
}
