import { computed, type Ref } from "vue"
import { streamingServices } from "@/constants/streamingServices"
import type { settingsType } from "@/stores/storeTypes"

/** Shared credit controls must preserve skip/watch exclusivity on every supported service. */
export function useSharedCredits(settings: Ref<settingsType>) {
	const skipCredits = computed({
		get: () => streamingServices.every((service) => settings.value[service].skipCredits),
		set: (enabled: boolean) => {
			for (const service of streamingServices) {
				const options = settings.value[service]
				options.skipCredits = enabled
				if (enabled && "watchCredits" in options) options.watchCredits = false
			}
		},
	})
	const watchCredits = computed({
		get: () =>
			streamingServices.every((service) => {
				const options = settings.value[service]
				return "watchCredits" in options ? options.watchCredits : true
			}),
		set: (enabled: boolean) => {
			for (const service of streamingServices) {
				const options = settings.value[service]
				if ("watchCredits" in options) options.watchCredits = enabled
				if (enabled) options.skipCredits = false
			}
		},
	})
	return { skipCredits, watchCredits }
}
