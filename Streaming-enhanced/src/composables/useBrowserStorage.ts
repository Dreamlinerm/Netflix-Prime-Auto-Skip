import { ref, watch } from "vue"
export function useBrowserSyncStorage<T>(key: string, defaultValue: T) {
  const data = ref<T>(defaultValue)
  // Initialize storage with the value from chrome.storage.sync
  chrome.storage.sync.get(key, (result) => {
    if (
      result[key] != undefined &&
      result[key] != "" &&
      typeof result[key] === typeof defaultValue
    ) {
      data.value = result[key]
    }
  })

  // Watch for changes in the storage and update chrome.storage.sync
  watch(
    data,
    (newValue) => {
      chrome.storage.sync.set({ [key]: newValue })
    },
    { deep: true },
  )
  return data
}

export function useBrowserLocalStorage<T>(key: string, defaultValue: T) {
  const data = ref<T>(defaultValue)
  // Initialize storage with the value from chrome.storage.local
  chrome.storage.local.get(key, (result) => {
    if (
      result[key] != undefined &&
      result[key] != "" &&
      typeof result[key] === typeof defaultValue
    ) {
      data.value = result[key]
      console.info(key, "=", result)
    }
  })

  // Watch for changes in the storage and update chrome.storage.local
  watch(
    data,
    (newValue) => {
      console.info("newValue", newValue)
      console.info("data", data.value)
      console.info("key", key)
      chrome.storage.local.set({ [key]: newValue })
    },
    { deep: true },
  )

  return data
}
