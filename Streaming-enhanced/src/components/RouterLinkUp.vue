<script setup lang="ts">
const router = useRouter()
</script>

<template>
	<button
		class="btn btn-sm my-4"
		@click="router.back()"
	>
		<i-ph-arrow-left />
	</button>
</template>

<style scoped></style>
