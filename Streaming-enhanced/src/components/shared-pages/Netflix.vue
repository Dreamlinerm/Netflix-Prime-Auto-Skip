<template>
	<div class="flex items-center">
		<RouterLinkUp />
		<h1 class="text-netflix">
			{{ $t("pageSpecificTitle", ["Netflix"]) }}
		</h1>
	</div>
	<template
		v-for="setting in settingsList"
		:key="setting"
	>
		<div class="p-1 m-0 flex">
			<p>{{ $t(setting + "Switch") }}</p>
			<Switch
				v-model="settings.Netflix[setting]"
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
	<!-- <div class="p-1 m-0 flex">
			<p>{{ $t("user") }}</p>
			<p
				id="profileName"
				style="text-transform: capitalize"
			></p>
			<img
				id="profilePicture"
				class="hidden"
				style="margin-left: auto; height: 40px; border-radius: 4px; margin-right: 8px"
				alt="profile Picture"
				src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
			/>
		</div> -->
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
const settingsList: Array<"skipRecap" | "skipBlocked" | "profile"> = ["skipRecap", "skipBlocked", "profile"]
</script>
<style scoped></style>
