<script setup lang="ts">
const optionsStore = useOptionsStore()
const { settings } = storeToRefs(optionsStore)
type StreamingService = "Amazon" | "Netflix" | "Disney" | "Crunchyroll" | "HBO" | "Video"
const settingsCategories: Array<StreamingService> = ["Video", "Amazon", "Netflix", "Disney", "Crunchyroll", "HBO"]
</script>

<template>
	Disabled settings:
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
				<h1 class="text-video">
					{{ $t("pageSpecificTitle", ["Video"]) }}
				</h1>
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
				<h1 class="text-hbo">
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
