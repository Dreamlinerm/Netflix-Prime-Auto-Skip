<script setup lang="ts">
const optionsStore = useOptionsStore()
const { settings } = storeToRefs(optionsStore)

function resetAddon() {
	if (confirm("You want to reset the Settings.\n\nAre you sure you want to do this?")) {
		settings.value = defaultSettings
	}
}
let file = new Blob([JSON.stringify(settings.value)], { type: "text/json" })
const href = URL.createObjectURL(file)

function replaceSettings(event: Event) {
	const input = event.target as HTMLInputElement
	const file = input.files?.[0]
	if (file === undefined || file.type !== "application/json") {
		alert("The file you uploaded is not a valid JSON file.")
		return
	} else {
		const reader = new FileReader()
		reader.addEventListener("load", (e) => {
			try {
				const data = JSON.parse(e.target?.result as string)
				settings.value = data
			} catch (e) {
				alert("The file you uploaded is not a valid JSON file.")
				return
			}
		})
		reader.readAsText(file)
	}
}
</script>

<template>
	<div>
		<div class="flex flex-col flex-align">
			<h2>{{ $t("importSettings") }}</h2>
			<div>
				<a
					class="btn btn-secondary rounded-2xl my-2"
					:href="href"
					download="settings.json"
				>
					{{ $t("saveSettings") }}
				</a>
			</div>
			<div class="flex flex-row flex-align">
				<p>Upload Settings:</p>
				<input
					type="file"
					name="settings"
					accept="text/json"
					class="file-input w-full max-w-xs"
					@change="replaceSettings"
				/>
			</div>
			<!-- <div class="flex flex-row flex-align">
				<input
					type="file"
					name="settings"
					accept="text/json"
				/>
				<div class="btn btn-secondary rounded-2xl">{{ $t("uploadSettings") }}</div>
			</div> -->
		</div>
	</div>
	<div
		class="btn btn-secondary rounded-2xl reset my-2"
		@click="resetAddon"
	>
		{{ $t("resetAddon") }}
	</div>
</template>
