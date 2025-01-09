<template>
	<div class="flex items-center">
		<h2 class="text-netflix">
			{{ $t("PageSpecificTitle", ["Netflix"]) }}
		</h2>
	</div>
	<div class="line flex">
		<p>{{ $t("RecapSwitch") }}</p>
		<Switch
			v-model="settings.Netflix.skipRecap"
			class="ml-auto"
		></Switch>
	</div>
	<div class="line flex">
		<p>{{ $t("InactivitySwitch") }}</p>
		<Switch
			v-model="settings.Netflix.skipBlocked"
			class="ml-auto"
		></Switch>
	</div>
	<div class="line flex">
		<p>{{ $t("ProfileSwitch") }}</p>
		<Switch
			v-model="settings.Netflix.profile"
			class="ml-auto"
		></Switch>
	</div>
	<!-- <div class="line flex">
			<p>{{ $t("User") }}</p>
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
</script>
<style scoped></style>
