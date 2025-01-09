<script setup lang="ts">
import { Notivue, Notification } from "notivue"
</script>

<template>
	<div class="min-h-[700px]">
		<AppHeader />

		<div class="p-4">
			<RouterView />
		</div>

		<Notivue v-slot="item">
			<Notification :item="item" />
		</Notivue>
	</div>
</template>

<style scoped></style>
