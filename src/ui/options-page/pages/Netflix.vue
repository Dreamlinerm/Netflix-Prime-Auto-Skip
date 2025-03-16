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
	<p>Blocked Titles:</p>
	<button
		class="btn btn-sm btn-error mb-2"
		@click="removeAllTitles"
	>
		Remove all Blocked Titles
	</button>
	<div class="grid-container">
		<div
			v-for="(title, index) in Object.keys(hideTitles)"
			:key="index"
			class="grid-item"
		>
			{{ title }}
			<i-mdi-delete
				class="text-error cursor-pointer min-w-6"
				@click="removeTitle(title)"
			/>
		</div>
	</div>
</template>
<style scoped>
.grid-container {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
	gap: 10px;
	max-height: 24rem; /* Adjust height as needed */
	overflow-y: auto;
}
.grid-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 5px;
	border: 1px solid #ccc;
	border-radius: 5px;
}
</style>
