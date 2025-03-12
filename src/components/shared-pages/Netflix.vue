<template>
	<div class="flex items-center">
		<RouterLinkUp v-if="!advancedSettings" />
		<h1 class="text-netflix">
			{{ $t("pageSpecificTitle", ["Netflix"]) }}
		</h1>
	</div>
	<template
		v-for="setting in settingsList"
		:key="setting"
	>
		<div class="py-1 m-0 flex">
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
	<div class="py-1 m-0 flex">
		<p>{{ $t("user") + " " }}</p>
		<p style="text-transform: capitalize">{{ settings.General.profileName }}</p>
		<img
			style="margin-left: auto; height: 40px; border-radius: 4px; margin-right: 8px"
			alt="profile Picture"
			:src="
				settings.General.profilePicture
					? settings.General.profilePicture
					: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
			"
		/>
	</div>
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
const settingsList: Array<"skipRecap" | "skipBlocked" | "profile" | "removeGames"> = ["skipRecap", "skipBlocked", "profile","removeGames"]
</script>
<style scoped></style>
