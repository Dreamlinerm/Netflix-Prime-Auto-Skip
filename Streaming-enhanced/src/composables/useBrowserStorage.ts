import { ref, watch } from "vue"
export function useBrowserSyncStorage<T>(key: string, defaultValue: T) {
  const data = ref<T>(defaultValue)
  console.log("defaultValue", defaultValue)

  // Initialize storage with the value from chrome.storage.sync
  chrome.storage.sync.get(key, (result) => {
    if (result[key] !== undefined) {
      data.value = result[key]
      console.info(key, "=", data.value)
    } else {
      console.info(key, "not found")
    }
  })

  // Watch for changes in the storage and update chrome.storage.sync
  watch(data, (newValue) => {
    console.info("newValue", newValue)
    chrome.storage.sync.set({ [key]: newValue })
  })

  return data
}

export function useBrowserLocalStorage<T>(key: string, defaultValue: T) {
  const data = ref<T>(defaultValue)
  console.log("defaultValue", defaultValue)

  // Initialize storage with the value from chrome.storage.local
  chrome.storage.local.get(key, (result) => {
    if (result[key] !== undefined) {
      data.value = result[key]
      console.info(key, "=", data.value)
    } else {
      console.info(key, "not found")
    }
  })

  // Watch for changes in the storage and update chrome.storage.sync
  watch(data, (newValue) => {
    console.info("newValue", newValue)
    chrome.storage.local.set({ [key]: newValue })
  })

  return data
}
