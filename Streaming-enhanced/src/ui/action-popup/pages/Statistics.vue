<template>
	<div class="flex items-center">
		<h2>
			{{ $t("PageSpecificTitle", ["Statistics"]) }}
		</h2>
	</div>
</template>
<script setup lang="ts">
const optionsStore = useOptionsStore()
const { settings } = storeToRefs(optionsStore)
</script>
<style scoped></style>
