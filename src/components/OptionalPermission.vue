<script lang="ts" setup>
const optionalPermissions: string[] = ["tabs"]
const unsetPermissions: Ref<string[]> = ref([])
checkOptionalPermissions()
async function checkOptionalPermissions() {
	for (const permission of optionalPermissions) {
		const result = await browser.permissions.contains({ permissions: [permission] })
		if (!result) unsetPermissions.value.push(permission)
	}
}

async function requestUnsetPermissions() {
	unsetPermissions.value.forEach(async (permission) => {
		const result = await browser.permissions.request({ permissions: [permission] })
		if (result) unsetPermissions.value = unsetPermissions.value.filter((p) => p !== permission)
	})
}
</script>
<template>
	<div
		v-if="unsetPermissions.length > 0"
		class="border border-error rounded-lg bg-gray-400 p-4 flex flex-col gap-2 w-fit"
	>
		<h1>{{ $t("missingPermission") }}</h1>
		<div
			v-for="permission in unsetPermissions"
			:key="permission"
			class="flex text-primary-content"
		>
			<div class="bg-gray-800 w-12 px-2 rounded text-error-content text-center">{{ permission }}</div>
			->
			<div class="bg-gray-800 rounded text-error-content px-2">{{ $t(permission + "Permission") }}</div>
		</div>
		<button
			class="btn btn-error w-fit"
			@click="requestUnsetPermissions"
		>
			{{ $t("addPermissionButton") }}
		</button>
	</div>
</template>
