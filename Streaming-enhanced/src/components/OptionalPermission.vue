<script lang="ts" setup>
import { isFirefox } from "@/utils/helper"
import { push } from "notivue"
const optionalPermissions = ["tabs"]
const unsetPermissions: Ref<string[]> = ref([])
checkOptionalPermissions()
async function checkOptionalPermissions() {
	for (const permission of optionalPermissions) {
		if (isFirefox) {
			const result = await browser.permissions.contains({ permissions: [permission] })
			if (!result) unsetPermissions.value.push(permission)
			console.log(result, unsetPermissions.value)
		} else {
			const result = await chrome.permissions.contains({ permissions: [permission] })
			if (!result) unsetPermissions.value.push(permission)
		}
	}
}

async function requestUnsetPermissions() {
	unsetPermissions.value.forEach(async (permission) => {
		const requestPermission = await chrome.permissions.request({ permissions: [permission] })
		unsetPermissions.value = unsetPermissions.value.filter((p) => p !== permission)
	})
}
</script>
<template>
	test
	{{ JSON.stringify(unsetPermissions) }}
	{{ unsetPermissions.length }}
	<div
		v-if="unsetPermissions.length > 0"
		class="border border-error rounded-lg bg-gray-400 p-4 flex flex-col gap-2 w-fit"
	>
		<h1>Missing permissions detected</h1>
		<div
			v-for="permission in unsetPermissions"
			:key="permission"
			class="bg-gray-900 w-fit rounded text-error-content"
		>
			{{ permission }}
		</div>
		<button
			class="btn btn-error w-fit"
			@click="requestUnsetPermissions"
		>
			Add
		</button>
	</div>
</template>
