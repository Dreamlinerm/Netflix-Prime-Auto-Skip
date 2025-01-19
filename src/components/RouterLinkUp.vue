<script setup lang="ts">
const router = useRouter()
const route = useRoute()
function back() {
	const currentPath = route.fullPath
	const previousPath = router.options.history.state.back
	if (previousPath != null && currentPath !== previousPath) {
		router.back()
	} else {
		router.push("/action-popup")
	}
}
</script>

<template>
	<button
		class="btn btn-sm my-4"
		@click="back"
	>
		<i-mdi-arrow-left />
	</button>
</template>

<style scoped></style>
