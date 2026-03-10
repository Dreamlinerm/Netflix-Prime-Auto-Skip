<script setup lang="ts">
import { i18n } from "@/utils/i18n"
import { useFrontendStore } from "@/stores/options.store"
const frontendStore = useFrontendStore()
const { currentLocale } = storeToRefs(frontendStore)
const LocaleTranslation = {
	de: "Deutsch",
	en: "English",
	es: "Español",
	fr: "Français",
	it: "Italiano",
	ja: "日本語",
	ko: "한국어",
	pl: "Polski",
	pt: "Português",
	pt_BR: "Português (Brasil)",
	sv: "Svenska",
	tr: "Türkçe",
	zh_CN: "简体中文",
}
</script>

<template>
		<div class="dropdown dropdown-end p-0">
			<div
				tabindex="0"
				role="button"
				class="flex gap-1 py-1 px-2"
			>
			<div>
				<i-ph-globe />
			</div>
			</div>
			<ul
				tabindex="-1"
				class="dropdown-content menu bg-base-100 rounded-box z-[1] shadow-lg -ml-4 mt-2"
			>
				<li
					v-for="locale in i18n?.global?.availableLocales"
					:key="`locale-${locale}`"
				>
					<button
						class="text-primary-content px-4"
						@click="currentLocale = locale"
					>
						{{ LocaleTranslation[locale as keyof typeof LocaleTranslation] }}
					</button>
				</li>
			</ul>
		</div>
</template>
