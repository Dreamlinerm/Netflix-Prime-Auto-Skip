<script setup lang="ts">
const hideTitlesStore = useHideTitlesStore()
const { hideTitles } = storeToRefs(hideTitlesStore)
console.log(hideTitles.value)
</script>
<template>
	<SharedPagesNetflix advanced-settings></SharedPagesNetflix>
	<div
		v-for="(title, index) in hideTitles"
		:key="index"
	>
		{{ title }}
	</div>
</template>
