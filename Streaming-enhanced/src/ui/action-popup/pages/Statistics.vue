<template>
	<div class="flex flex-align">
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
