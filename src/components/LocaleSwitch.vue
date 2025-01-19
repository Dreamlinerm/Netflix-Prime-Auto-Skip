<script setup lang="ts">
import { i18n } from "@/utils/i18n"
import { useFrontendStore } from "@/stores/options.store"
const frontendStore = useFrontendStore()
const { currentLocale } = storeToRefs(frontendStore)
const fixLocales = ["de", "en", "es", "fr", "it", "ja", "ko", "pl", "pt", "pt_BR", "sv", "tr", "zh_CN"]
</script>

<template>
	<div>
		<div class="dropdown dropdown-end">
			<div
				tabindex="0"
				role="button"
				class="flex gap-1"
			>
				<i-ph-globe />
				<!-- {{ currentLocale }} -->
			</div>
			<ul
				tabindex="0"
				class="dropdown-content menu bg-base-100 rounded-box z-[1] shadow-lg -ml-4 mt-2"
			>
				<li
					v-for="locale in i18n?.global?.availableLocales || fixLocales"
					:key="`locale-${locale}`"
				>
					<button
						class="text-primary-content px-4"
						@click="currentLocale = locale"
					>
						{{ locale }}
					</button>
				</li>
			</ul>
		</div>
	</div>
</template>
