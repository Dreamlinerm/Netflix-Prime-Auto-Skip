<template>
	<div class="flex items-center">
		<RouterLinkUp v-if="!advancedSettings" />
		<h1 class="text-amazon">
			{{ $t("pageSpecificTitle", ["Prime Video"]) }}
		</h1>
	</div>
	<template
		v-for="setting in settingsList"
		:key="setting"
	>
		<div class="py-1 m-0 flex">
			<div class="tooltip flex">
				<p>{{ $t(setting + "Switch") }}</p>
				<template v-if="!advancedSettings">
					<i-mdi-help-circle height="1rem" />
					<div
						class="tooltip-content text-primary-content"
						style="transform: unset; inset: auto auto var(--tt-off) 0%"
					>
						{{ $t(setting + "Description") }}
					</div>
				</template>
			</div>
			<Switch
				v-model="settings.Amazon[setting]"
				class="ml-auto"
			></Switch>
		</div>
		<template v-if="advancedSettings">
			<p class="description">
				{{ $t(setting + "Description") }}
			</p>
			<hr />
		</template>
	</template>
</template>
<script setup lang="ts">
const optionsStore = useOptionsStore()
const { settings } = storeToRefs(optionsStore)
const props = defineProps({
	advancedSettings: {
		type: Boolean,
		default: false,
	},
})

const settingsList: Array<"selfAd" | "filterPaid" | "continuePosition" | "xray" | "improveUI"> = [
	"selfAd",
	"filterPaid",
	"continuePosition",
	"xray",
	"improveUI",
]
</script>
<style scoped></style>
