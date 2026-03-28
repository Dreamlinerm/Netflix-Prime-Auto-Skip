<script setup lang="ts">
const optionsStore = useOptionsStore()
const { settings } = storeToRefs(optionsStore)
type StreamingService = "Amazon" | "Netflix" | "Disney" | "Crunchyroll" | "HBO" | "Video" | "Paramount"
const settingsCategories: Array<StreamingService> = [
	"Video",
	"Amazon",
	"Netflix",
	"Disney",
	"Crunchyroll",
	"HBO",
	"Paramount",
]
const serviceCategories: Exclude<StreamingService, "Video">[] = [
	"Amazon",
	"Netflix",
	"Disney",
	"Crunchyroll",
	"HBO",
	"Paramount",
]

const excludedSettings = new Set(["watchCredits", "epilepsy"])
const sharedServiceSettings = new Set([
	"skipIntro",
	"skipCredits",
	"watchCredits",
	"skipAd",
	"showRating",
	"speedSlider",
	"hideTitles",
])

function isDisabledSetting(category: StreamingService, setting: string) {
	if (category !== "Video" && sharedServiceSettings.has(setting)) return false
	const categorySettings = settings.value[category] as Record<string, unknown>
	const value = categorySettings[setting]
	return !excludedSettings.has(setting) && typeof value === "boolean" && !value
}

function isSharedSettingDisabled(setting: string) {
	if (!sharedServiceSettings.has(setting)) return false

	return serviceCategories.some((category) => {
		const categorySettings = settings.value[category] as Record<string, unknown>
		const value = categorySettings[setting]
		return typeof value === "boolean" && !value
	})
}

function getSharedSettingValue(setting: string) {
	return serviceCategories.every((category) => {
		const categorySettings = settings.value[category] as Record<string, unknown>
		const value = categorySettings[setting]
		if (typeof value !== "boolean") return true
		return value
	})
}

function setSharedSettingValue(setting: string, value: boolean) {
	serviceCategories.forEach((category) => {
		const categorySettings = settings.value[category] as Record<string, unknown>
		if (typeof categorySettings[setting] === "boolean") {
			;(settings.value[category] as Record<string, boolean>)[setting] = value
		}
	})
}

function getCategoryTitle(category: StreamingService) {
	if (category === "Video") return "Shared Settings"
	if (category === "Amazon") return "Prime Video"
	if (category === "Disney") return "Disney+"
	return category
}

function getCategoryTitleClass(category: StreamingService) {
	if (category === "Amazon") return "text-amazon"
	if (category === "Netflix") return "text-netflix"
	if (category === "Disney") return "text-disney"
	if (category === "Crunchyroll") return "text-crunchyroll"
	return ""
}

const disabledSettingsByCategory = computed(() => {
	return settingsCategories
		.map((category) => {
			const disabledSettings = Object.keys(settings.value[category]).filter((setting) =>
				isDisabledSetting(category, setting),
			)

			return {
				category,
				disabledSettings,
			}
		})
		.filter((group) => group.disabledSettings.length > 0)
})

const disabledSharedSettings = computed(() => {
	return Array.from(sharedServiceSettings).filter((setting) => isSharedSettingDisabled(setting))
})

const totalDisabledSettings = computed(() => {
	const disabledCategorySettings = disabledSettingsByCategory.value.reduce(
		(sum, group) => sum + group.disabledSettings.length,
		0,
	)
	return disabledCategorySettings + disabledSharedSettings.value.length
})

const hasDisabledSetting = computed(
	() => disabledSettingsByCategory.value.length > 0 || disabledSharedSettings.value.length > 0,
)
const router = useRouter()
watch(hasDisabledSetting, (value) => {
	if (!value) router.push("/options-page/SharedSettings")
})
</script>

<template>
	<div class="overview-header">
		<h1>Disabled settings overview</h1>
		<p class="description">
			{{ totalDisabledSettings }} settings disabled in
			{{ disabledSettingsByCategory.length + (disabledSharedSettings.length ? 1 : 0) }} categories.
		</p>
	</div>

	<div class="category-grid">
		<section
			v-if="disabledSharedSettings.length"
			class="category-card"
		>
			<div class="category-card-header">
				<h2>{{ $t("sharedSettings") }}</h2>
				<span class="count-badge">{{ disabledSharedSettings.length }}</span>
			</div>

			<div
				v-for="setting in disabledSharedSettings"
				:key="setting"
				class="setting-row"
			>
				<div class="line flex">
					<p>{{ $t(setting + "Switch") }}</p>
					<Switch
						:model-value="getSharedSettingValue(setting)"
						class="ml-auto"
						@update:model-value="setSharedSettingValue(setting, $event as boolean)"
					></Switch>
				</div>
				<p class="description setting-description">
					{{ $t(setting + "Description") }}
				</p>
			</div>
		</section>

		<section
			v-for="group in disabledSettingsByCategory"
			:key="group.category"
			class="category-card"
		>
			<div class="category-card-header">
				<h2 :class="getCategoryTitleClass(group.category)">
					{{ getCategoryTitle(group.category) }}
				</h2>
				<span class="count-badge">{{ group.disabledSettings.length }}</span>
			</div>

			<div
				v-for="setting in group.disabledSettings"
				:key="setting"
				class="setting-row"
			>
				<div class="line flex">
					<p>{{ $t(setting + "Switch") }}</p>
					<Switch
						v-model="(settings[group.category] as Record<string, boolean>)[setting]"
						class="ml-auto"
					></Switch>
				</div>
				<p class="description setting-description">
					{{ $t(setting + "Description") }}
				</p>
			</div>
		</section>
	</div>
</template>

<style scoped>
@reference "@/assets/base.css";
.overview-header {
	@apply mb-4;
}

.category-grid {
	@apply grid gap-4;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.category-card {
	@apply rounded-xl border border-slate-300/60 bg-linear-to-b from-slate-900/5 to-slate-900/2 px-4 py-3;
}

.category-card-header {
	@apply mb-2 flex items-center justify-between gap-3;
}

.category-card-header h2 {
	@apply m-0 text-base font-bold;
}

.count-badge {
	@apply inline-flex min-w-7 items-center justify-center rounded-full border border-red-300/70 bg-red-100 px-2 py-0.5 text-xs font-bold text-red-950;
}

.setting-row {
	@apply border-t border-slate-300/40 py-2.5;
}

.setting-description {
	@apply mt-1;
}
</style>
