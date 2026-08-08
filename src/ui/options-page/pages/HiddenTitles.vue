<script setup lang="ts">
import { useI18n } from "vue-i18n"

const { t } = useI18n()

const hiddenTitlesStore = useHiddenTitlesStore()
const { hiddenTitles } = storeToRefs(hiddenTitlesStore)

type PlatformFilter = "all" | "Netflix" | "Amazon" | "Disney" | "Unknown"
type TypeFilter = "all" | "movie" | "tv"
type SortKey = "dateAdded" | "title" | "platform"
type Row = { title: string } & HiddenTitleEntry

const KNOWN_PLATFORM_LABELS: Record<string, string> = {
	Netflix: "Netflix",
	Amazon: "Prime Video",
	Disney: "Disney+",
}
function platformLabel(platform: string) {
	return KNOWN_PLATFORM_LABELS[platform] ?? t("unknownPlatform")
}
const POSTER_BASE = "https://image.tmdb.org/t/p/w154"

const search = ref("")
const platformFilter = ref<PlatformFilter>("all")
const typeFilter = ref<TypeFilter>("all")
const sortKey = ref<SortKey>("dateAdded")
const sortDir = ref<"asc" | "desc">("desc")
const viewMode = ref<"icon" | "list">("icon")
const selected = ref<BooleanObject>({})

const rows = computed<Array<Row>>(() =>
	Object.entries(hiddenTitles.value).map(([title, entry]) => ({ title, ...entry })),
)

const filteredRows = computed(() => {
	let list = rows.value
	const query = search.value.trim().toLowerCase()
	if (query) list = list.filter((row) => row.title.toLowerCase().includes(query))
	if (platformFilter.value !== "all") list = list.filter((row) => row.platform === platformFilter.value)
	if (typeFilter.value !== "all") list = list.filter((row) => row.mediaType === typeFilter.value)
	return [...list].sort((a, b) => {
		let cmp = 0
		if (sortKey.value === "title") cmp = a.title.localeCompare(b.title)
		else if (sortKey.value === "platform") cmp = a.platform.localeCompare(b.platform)
		else cmp = a.dateAdded.localeCompare(b.dateAdded)
		return sortDir.value === "asc" ? cmp : -cmp
	})
})

function setSort(key: SortKey) {
	if (sortKey.value === key) sortDir.value = sortDir.value === "asc" ? "desc" : "asc"
	else {
		sortKey.value = key
		sortDir.value = key === "dateAdded" ? "desc" : "asc"
	}
}

const selectedCount = computed(() => Object.values(selected.value).filter(Boolean).length)
const allVisibleSelected = computed(
	() => filteredRows.value.length > 0 && filteredRows.value.every((row) => selected.value[row.title]),
)
function toggleSelectAll() {
	const newValue = !allVisibleSelected.value
	filteredRows.value.forEach((row) => {
		selected.value[row.title] = newValue
	})
}

function show(title: string) {
	delete hiddenTitles.value[title]
	delete selected.value[title]
}
function unblockSelected() {
	Object.keys(selected.value)
		.filter((title) => selected.value[title])
		.forEach(show)
}
function showAll() {
	if (!confirm(t("unhideAllConfirm"))) return
	hiddenTitles.value = {}
	selected.value = {}
}

// posterPath: null = never fetched, "" = fetched, TMDB has none, string = poster path
const fetchingTitles = new Set<string>()
async function ensurePosters() {
	const missing = filteredRows.value
		.filter((row) => row.posterPath === null && !fetchingTitles.has(row.title))
		.slice(0, 60)
	for (const row of missing) {
		fetchingTitles.add(row.title)
		fetchPosterInfo(row.title, row.mediaType).then((info) => {
			fetchingTitles.delete(row.title)
			const current = hiddenTitles.value[row.title]
			if (!current) return
			hiddenTitles.value[row.title] = {
				...current,
				posterPath: info?.posterPath ?? "",
				mediaType: current.mediaType ?? info?.mediaType ?? null,
			}
		})
	}
}
watch(filteredRows, ensurePosters, { immediate: true })
</script>

<template>
	<h1>{{ $t("hiddenTitlesPageTitle") }}</h1>
	<p class="description">{{ $t("hiddenTitlesPageDescription") }}</p>

	<div class="toolbar flex flex-wrap items-center gap-2 my-2">
		<input
			v-model="search"
			type="text"
			:placeholder="$t('searchPlaceholder')"
			class="input input-bordered input-sm"
		/>
		<select
			v-model="platformFilter"
			class="select select-bordered select-sm"
		>
			<option value="all">{{ $t("allPlatforms") }}</option>
			<option value="Netflix">Netflix</option>
			<option value="Amazon">Prime Video</option>
			<option value="Disney">Disney+</option>
			<option value="Unknown">{{ $t("unknownPlatform") }}</option>
		</select>
		<select
			v-model="typeFilter"
			class="select select-bordered select-sm"
		>
			<option value="all">{{ $t("allTypes") }}</option>
			<option value="movie">{{ $t("movieType") }}</option>
			<option value="tv">{{ $t("tvType") }}</option>
		</select>
		<select
			v-model="sortKey"
			class="select select-bordered select-sm"
		>
			<option value="dateAdded">{{ $t("sortDateAdded") }}</option>
			<option value="title">{{ $t("sortTitle") }}</option>
			<option value="platform">{{ $t("sortPlatform") }}</option>
		</select>
		<button
			class="btn btn-sm"
			:title="sortDir === 'asc' ? 'A-Z' : 'Z-A'"
			@click="sortDir = sortDir === 'asc' ? 'desc' : 'asc'"
		>
			<i-mdi-sort-ascending v-if="sortDir === 'asc'" />
			<i-mdi-sort-descending v-else />
		</button>
		<div class="join">
			<button
				class="btn btn-sm join-item"
				:class="viewMode === 'icon' ? 'btn-active' : ''"
				:title="$t('viewIcon')"
				@click="viewMode = 'icon'"
			>
				<i-mdi-view-grid />
			</button>
			<button
				class="btn btn-sm join-item"
				:class="viewMode === 'list' ? 'btn-active' : ''"
				:title="$t('viewList')"
				@click="viewMode = 'list'"
			>
				<i-mdi-view-list />
			</button>
		</div>
		<label class="flex items-center gap-1 cursor-pointer ml-auto">
			<input
				type="checkbox"
				class="checkbox checkbox-sm"
				:checked="allVisibleSelected"
				@change="toggleSelectAll"
			/>
			{{ $t("selectAll") }}
		</label>
		<button
			class="btn btn-sm btn-error"
			:disabled="selectedCount === 0"
			@click="unblockSelected"
		>
			{{ $t("unhideSelected", [selectedCount]) }}
		</button>
		<button
			class="btn btn-sm btn-outline btn-error"
			:disabled="rows.length === 0"
			@click="showAll"
		>
			{{ $t("unhideAll") }}
		</button>
	</div>

	<p
		v-if="filteredRows.length === 0"
		class="description"
	>
		{{ $t("noHiddenTitles") }}
	</p>

	<div
		v-else-if="viewMode === 'icon'"
		class="grid-container"
	>
		<div
			v-for="row in filteredRows"
			:key="row.title"
			class="block-card"
		>
			<input
				type="checkbox"
				class="checkbox checkbox-sm select-checkbox"
				:checked="!!selected[row.title]"
				@change="selected[row.title] = !selected[row.title]"
			/>
			<button
				class="unblock-btn"
				:title="$t('unhide')"
				@click="show(row.title)"
			>
				<i-mdi-close />
			</button>
			<img
				v-if="row.posterPath"
				:src="POSTER_BASE + row.posterPath"
				:alt="row.title"
				class="poster"
			/>
			<div
				v-else
				class="poster poster-placeholder"
			>
				{{ row.title.slice(0, 1) }}
			</div>
			<p
				class="card-title"
				:title="row.title"
			>
				{{ row.title }}
			</p>
			<span class="platform-badge">{{ platformLabel(row.platform) }}</span>
		</div>
	</div>

	<table
		v-else
		class="w-full detail-table"
	>
		<thead>
			<tr>
				<th></th>
				<th></th>
				<th
					class="cursor-pointer"
					@click="setSort('title')"
				>
					{{ $t("sortTitle") }}
				</th>
				<th
					class="cursor-pointer"
					@click="setSort('platform')"
				>
					{{ $t("platformFilter") }}
				</th>
				<th>{{ $t("mediaTypeFilter") }}</th>
				<th
					class="cursor-pointer"
					@click="setSort('dateAdded')"
				>
					{{ $t("sortDateAdded") }}
				</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			<tr
				v-for="row in filteredRows"
				:key="row.title"
			>
				<td>
					<input
						type="checkbox"
						class="checkbox checkbox-sm"
						:checked="!!selected[row.title]"
						@change="selected[row.title] = !selected[row.title]"
					/>
				</td>
				<td>
					<img
						v-if="row.posterPath"
						:src="POSTER_BASE + row.posterPath"
						:alt="row.title"
						class="thumb"
					/>
					<div
						v-else
						class="thumb poster-placeholder"
					>
						{{ row.title.slice(0, 1) }}
					</div>
				</td>
				<td>{{ row.title }}</td>
				<td>{{ platformLabel(row.platform) }}</td>
				<td>{{ row.mediaType === "movie" ? $t("movieType") : row.mediaType === "tv" ? $t("tvType") : "—" }}</td>
				<td>{{ row.dateAdded }}</td>
				<td>
					<button
						class="btn btn-xs btn-error"
						@click="show(row.title)"
					>
						{{ $t("unhide") }}
					</button>
				</td>
			</tr>
		</tbody>
	</table>
</template>

<style scoped>
.grid-container {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
	gap: 12px;
	max-height: 40rem;
	overflow-y: auto;
}
.block-card {
	position: relative;
	display: flex;
	flex-direction: column;
	border: 1px solid #ccc;
	border-radius: 8px;
	padding: 6px;
	overflow: hidden;
}
.poster {
	width: 100%;
	aspect-ratio: 2 / 3;
	object-fit: cover;
	border-radius: 4px;
	background: #333;
}
.poster-placeholder {
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 2rem;
	color: #999;
	background: #222;
}
.card-title {
	margin: 4px 0 0 0;
	font-size: 0.85rem;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.platform-badge {
	font-size: 0.7rem;
	opacity: 0.7;
}
.select-checkbox {
	position: absolute;
	top: 6px;
	left: 6px;
	z-index: 2;
}
.unblock-btn {
	position: absolute;
	top: 4px;
	right: 4px;
	z-index: 2;
	background: rgba(0, 0, 0, 0.6);
	color: white;
	border: none;
	border-radius: 50%;
	width: 22px;
	height: 22px;
	cursor: pointer;
}
.thumb {
	width: 40px;
	height: 60px;
	object-fit: cover;
	border-radius: 4px;
	background: #333;
}
.detail-table th,
.detail-table td {
	text-align: left;
	padding: 4px 8px;
}
</style>
