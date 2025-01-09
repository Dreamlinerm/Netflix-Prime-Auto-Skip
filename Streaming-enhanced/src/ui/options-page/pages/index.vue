<script setup lang="ts">
const optionsStore = useOptionsStore()
// const { toggleDark } = optionsStore
const { isDark, profile, others } = storeToRefs(optionsStore)
</script>

<template>
	<RouterLinkUp />
	Settings
</template>
