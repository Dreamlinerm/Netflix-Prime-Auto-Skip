<script setup lang="ts">
import { defaultSettings } from "@/stores/options.store"
const optionsStore = useOptionsStore()
const { settings } = storeToRefs(optionsStore)

function resetAddon() {
	if (confirm("You want to reset the Settings.\n\nAre you sure you want to do this?")) settings.value = defaultSettings
}

// else if (e.target.id === "upload") {
//       // get the file from #file and console.log it
//       const file = document.getElementById("file").files[0];
//       if (file !== undefined && "application/json" === file.type) {
//         if (confirm(file.name + " will replace the Settings.\n\nAre you sure you want to do this?")) {
//           // read contents of file
//           const reader = new FileReader();
//           // reader.onload = (e) => {
//           reader.addEventListener("load", (e) => {
//             try {
//               // parse the JSON
//               const data = JSON.parse(e.target.result);
//               // set the settings to the parsed JSON
//               settings = data;
//               // save the settings to the storage
//               browser.storage.sync.set({ settings });
//               // reload the page
//               location.reload();
//               // };
//             } catch (e) {
//               alert("The file you uploaded is not a valid JSON file.");
//               return;
//             }
//           });
//           reader.readAsText(file);
//         }
//       } else {
//         alert("The file you uploaded is not a valid JSON file.");
//         return;
//       }
//     }
</script>

<template>
	<div>
		<div class="flex flex-col flex-align">
			<h2>{{ $t("importSettings") }}</h2>
			<a class="btn btn-secondary rounded-2xl">{{ $t("saveSettings") }}</a>
			<div class="flex flex-row flex-align">
				<input
					type="file"
					name="settings"
					accept="text/json"
				/>
				<div class="btn btn-secondary rounded-2xl">{{ $t("uploadSettings") }}</div>
			</div>
		</div>
	</div>
	<div
		class="btn btn-secondary rounded-2xl reset"
		@click="resetAddon"
	>
		{{ $t("resetAddon") }}
	</div>
</template>
