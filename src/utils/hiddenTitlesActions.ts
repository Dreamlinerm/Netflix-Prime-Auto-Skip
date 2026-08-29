export function hideTitle(
	hiddenTitles: Ref<HiddenTitles>,
	tombstones: Ref<HiddenTitleTombstones>,
	title: string,
	entry: HiddenTitleEntry,
) {
	hiddenTitles.value[title] = entry
	if (tombstones.value[title]) delete tombstones.value[title]
}

export function unhideTitle(hiddenTitles: Ref<HiddenTitles>, tombstones: Ref<HiddenTitleTombstones>, title: string) {
	delete hiddenTitles.value[title]
	tombstones.value[title] = new Date().toISOString()
}
