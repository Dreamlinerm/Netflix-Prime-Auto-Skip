<script setup lang="ts">
const optionsStore = useOptionsStore()
const { settings } = storeToRefs(optionsStore)
type StreamingService = "Amazon" | "Netflix" | "Disney" | "Crunchyroll" | "HBO" | "Video"
const settingsCategories: Array<StreamingService> = ["Video", "Amazon", "Netflix", "Disney", "Crunchyroll", "HBO"]

const hasDisabledSetting = computed(() => {
	return settingsCategories.some((category) => {
		return Object.keys(settings.value[category]).some((setting) => {
			return (
				!settings.value[category][setting] &&
				setting != "watchCredits" &&
				setting != "epilepsy" &&
				typeof settings.value[category][setting] === "boolean"
			)
		})
	})
})
const router = useRouter()
watch(hasDisabledSetting, (value) => {
	if (!value) router.push("/options-page/SharedSettings")
})
</script>

<template>
	<h1>All disabled Settings:</h1>
	<br />
	<template
		v-for="category in settingsCategories"
		:key="category"
	>
		<template
			v-if="
				Object.keys(settings[category]).some(
					(setting) =>
						!settings[category][setting] &&
						setting != 'watchCredits' &&
						setting != 'epilepsy' &&
						typeof settings[category][setting] === 'boolean',
				)
			"
		>
			<template v-if="category == 'Video'">
				<h1>{{ $t("sharedPageTitle") }}</h1>
			</template>
			<template v-if="category == 'Amazon'">
				<h1 class="text-amazon">
					{{ $t("pageSpecificTitle", ["Prime Video"]) }}
				</h1>
			</template>
			<template v-if="category == 'Netflix'">
				<h1 class="text-netflix">
					{{ $t("pageSpecificTitle", ["Netflix"]) }}
				</h1>
			</template>
			<template v-if="category == 'Disney'">
				<h1 class="text-disney">
					{{ $t("pageSpecificTitle", ["Disney+"]) }}
				</h1>
			</template>
			<template v-if="category == 'Crunchyroll'">
				<h1 class="text-crunchyroll">
					{{ $t("pageSpecificTitle", ["Crunchyroll"]) }}
				</h1>
			</template>
			<template v-if="category == 'HBO'">
				<h1>
					{{ $t("pageSpecificTitle", ["HBO"]) }}
				</h1>
			</template>
		</template>
		<template
			v-for="setting in Object.keys(settings[category])"
			:key="setting"
		>
			<template
				v-if="
					!settings[category][setting] &&
					setting != 'watchCredits' &&
					setting != 'epilepsy' &&
					typeof settings[category][setting] === 'boolean'
				"
			>
				<hr />
				<div class="line flex">
					<p>{{ $t(setting + "Switch") }}</p>
					<Switch
						v-model="settings[category][setting]"
						class="ml-auto"
					></Switch>
				</div>
				<p class="description">
					{{ $t(setting + "Description") }}
				</p>
			</template>
		</template>
	</template>
</template>
