<script lang="ts" setup>
const { isDark, toggleDark } = useTheme()
</script>

<template>
	<button
		class="btn text-primary h-fit min-h-1"
		@click="toggleDark()"
	>
		<template v-if="isDark">
			<i-ph-moon />
		</template>
		<template v-else>
			<i-ph-sun />
		</template>
	</button>
</template>
