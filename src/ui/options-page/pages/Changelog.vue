<script setup lang="ts">
import { marked } from "marked"

const version = __VERSION__
const changelog = __CHANGELOG__
</script>

<template>
	<div>
		<p>Version: {{ version }}</p>
		<!-- eslint-disable vue/no-v-html -->
		<div v-html="marked(changelog)" />
		<!--eslint-enable-->
	</div>
</template>

<style>
ul {
	color: var(--color-gray-300);
}
</style>
