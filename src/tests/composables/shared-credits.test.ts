import { expect, it } from "vitest"
import { ref } from "vue"
import { useSharedCredits } from "../../composables/useSharedCredits"
import { defaultSettings } from "../../stores/storeTypes"

it("applies shared credit choices without creating unsupported service options", () => {
	const settings = ref(structuredClone(defaultSettings))
	const controls = useSharedCredits(settings)
	expect(controls.skipCredits.value).toBe(true)
	expect(controls.watchCredits.value).toBe(false)
	controls.watchCredits.value = true
	expect(controls.watchCredits.value).toBe(true)
	expect(controls.skipCredits.value).toBe(false)
	expect(settings.value.Paramount.watchCredits).toBe(true)
	expect("watchCredits" in settings.value.Crunchyroll).toBe(false)
	controls.watchCredits.value = false
	expect(controls.watchCredits.value).toBe(false)
	controls.skipCredits.value = true
	expect(controls.skipCredits.value).toBe(true)
	expect(controls.watchCredits.value).toBe(false)
	controls.skipCredits.value = false
	expect(controls.skipCredits.value).toBe(false)
	expect(settings.value.Crunchyroll.skipCredits).toBe(false)
})
