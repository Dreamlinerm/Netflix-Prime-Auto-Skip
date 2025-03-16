<script setup lang="ts">
const hideTitlesStore = useHideTitlesStore()
const { hideTitles } = storeToRefs(hideTitlesStore)
console.log(hideTitles.value)
function removeTitle(title: string) {
	delete hideTitles.value[title]
}
function removeAllTitles() {
	hideTitles.value = {}
}
</script>
<template>
	<SharedPagesNetflix advanced-settings></SharedPagesNetflix>
	<hr />
	<div class="flex">
		<p>Blocked Titles:</p>
		<button
			class="btn btn-sm btn-error ml-auto"
			@click="removeAllTitles"
		>
			Remove all Blocked Titles
		</button>
	</div>
	<hr />
	<p>Blocked Titles List:</p>
	<div class="h-96 w-40 overflow-y-auto">
		<div
			v-for="(title, index) in Object.keys(hideTitles)"
			:key="index"
			class="flex"
		>
			{{ title }}
			<button
				class="btn btn-sm btn-error ml-auto"
				@click="removeTitle(title)"
			>
				Remove
			</button>
		</div>
	</div>
</template>
