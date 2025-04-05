import type { BasicColorSchema } from "@vueuse/core"
import { useBrowserLocalStorage } from "./useBrowserStorage"

export function useTheme() {
	// mode auto before dark
	const { data: colorSchema } = useBrowserLocalStorage<BasicColorSchema>("mode", "dark", false)
	const isDark = computed(() => colorSchema.value === "dark")
	document.body.setAttribute("data-theme", colorSchema.value)

	watch(colorSchema, (newValue) => {
		// Update the body attribute when colorSchema changes
		document.body.setAttribute("data-theme", newValue)
	})

	// const isDark = useDark({
	// 	initialValue: colorSchema,
	// 	onChanged(isDark, defaultHandler, mode) {
	// 		console.log("colorSchema2", colorSchema.value)
	// 		// load initial value
	// 		colorSchema.value = mode
	// 		defaultHandler(mode)
	// 		document.body.setAttribute("data-theme", mode)
	// 	},
	// })

	// const toggleDark = useToggle(isDark)
	const toggleDark = () => {
		colorSchema.value = colorSchema.value === "dark" ? "light" : "dark"
	}

	return {
		isDark,
		toggleDark,
	}
}
