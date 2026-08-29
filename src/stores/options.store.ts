import type { StreamingService } from "@/constants/streamingServices"

// 8KB item
const { data: settings, promise } = useBrowserSyncStorage<settingsType>("settings", defaultSettings)
export const useOptionsStore = defineStore("options", () => {
	return {
		settings,
	}
})
export const SettingsPromise = promise

// Sync Data 8KB per item in firefox storage sync
const { data: crunchyList, promise: crunchyListPromise } = useBrowserSyncStorage<CrunchyList>("crunchyList", [], false)
export const crunchyListStore = defineStore("crunchyList", () => {
	return {
		crunchyList,
	}
})

export const useFrontendStore = defineStore("frontend", () => {
	const { isDark, toggleDark } = useTheme()
	const currentLocale = useLocale()
	return {
		isDark,
		toggleDark,
		currentLocale,
	}
})
export type BooleanObject = {
	[key: string]: boolean
}
export type MediaType = "tv" | "movie" | null
export type HiddenTitleEntry = {
	platform: StreamingService | "Unknown"
	mediaType: MediaType
	posterPath: string | null
	dateAdded: string
}
export type HiddenTitles = {
	[title: string]: HiddenTitleEntry
}
// title -> ISO date the title was unhidden, used so cloud sync doesn't resurrect it
export type HiddenTitleTombstones = {
	[title: string]: string
}

const { data: hiddenTitles, promise: hiddenTitlesPromise } = useBrowserLocalStorage<HiddenTitles>(
	"hiddenTitles",
	{},
	false,
)
const { data: hiddenTitlesTombstones, promise: hiddenTitlesTombstonesPromise } =
	useBrowserLocalStorage<HiddenTitleTombstones>("hiddenTitlesTombstones", {}, false)
export const useHiddenTitlesStore = defineStore("hiddenTitles", () => {
	return {
		hiddenTitles,
		hiddenTitlesTombstones,
	}
})
export const HiddenTitlesPromise = Promise.all([hiddenTitlesPromise, hiddenTitlesTombstonesPromise])

export type CloudSyncProvider = "none" | "googleDrive" | "dropbox"
export type CloudSyncSettings = {
	provider: CloudSyncProvider
	googleDrive: {
		clientId: string
		clientSecret: string
		refreshToken: string | null
		accessToken: string | null
		accessTokenExpiresAt: number | null
		fileId: string | null
	}
	dropbox: {
		appKey: string
		refreshToken: string | null
		accessToken: string | null
		accessTokenExpiresAt: number | null
	}
	lastSyncedAt: string | null
	lastError: string | null
}
export const defaultCloudSyncSettings: CloudSyncSettings = {
	provider: "none",
	googleDrive: {
		clientId: "",
		clientSecret: "",
		refreshToken: null,
		accessToken: null,
		accessTokenExpiresAt: null,
		fileId: null,
	},
	dropbox: {
		appKey: "",
		refreshToken: null,
		accessToken: null,
		accessTokenExpiresAt: null,
	},
	lastSyncedAt: null,
	lastError: null,
}

const { data: cloudSync, promise: cloudSyncPromise } = useBrowserLocalStorage<CloudSyncSettings>(
	"cloudSync",
	defaultCloudSyncSettings,
	true,
)
export const useCloudSyncStore = defineStore("cloudSync", () => {
	return {
		cloudSync,
	}
})
export const CloudSyncPromise = cloudSyncPromise
