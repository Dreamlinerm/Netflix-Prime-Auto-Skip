export type settingsType = {
	Amazon: {
		skipIntro: boolean
		skipCredits: boolean
		watchCredits: boolean
		selfAd: boolean
		skipAd: boolean
		speedSlider: boolean
		filterPaid: boolean
		continuePosition: boolean
		showRating: boolean
		xray: boolean
	}
	Netflix: {
		skipIntro: boolean
		skipRecap: boolean
		skipCredits: boolean
		watchCredits: boolean
		skipBlocked: boolean
		skipAd: boolean
		speedSlider: boolean
		profile: boolean
		showRating: boolean
		removeGames: boolean
		hideTitles: boolean
	}
	Disney: {
		skipIntro: boolean
		skipCredits: boolean
		watchCredits: boolean
		skipAd: boolean
		speedSlider: boolean
		showRating: boolean
		selfAd: boolean
		hideTitles: boolean
	}
	Crunchyroll: {
		skipIntro: boolean
		speedSlider: boolean
		releaseCalendar: boolean
		dubLanguage: { lang: string; index: number } | null
		profile: boolean
		bigPlayer: boolean
		disableNumpad: boolean
	}
	HBO: {
		skipIntro: boolean
		skipCredits: boolean
		watchCredits: boolean
		speedSlider: boolean
		showRating: boolean
	}
	Video: {
		playOnFullScreen: boolean
		epilepsy: boolean
		userAgent: boolean
		doubleClick: boolean
		scrollVolume: boolean
		showYear: boolean
	}
	Statistics: {
		AmazonAdTimeSkipped: number
		NetflixAdTimeSkipped: number
		DisneyAdTimeSkipped: number
		IntroTimeSkipped: number
		RecapTimeSkipped: number
		SegmentsSkipped: number
	}
	General: {
		Crunchyroll_profilePicture: null | string
		profileName: null | string
		profilePicture: null | string
		sliderSteps: number
		sliderMin: number
		sliderMax: number
		filterDub: boolean
		filterQueued: boolean
		savedCrunchyList: CrunchyList
		GCdate: string
		affiliate: boolean
	}
}

export type Nullable<T> = T | null | undefined
export type CrunchyListElement = { href: Nullable<string>; name: Nullable<string>; time: string }
export type CrunchyList = Array<CrunchyListElement>

// Default settings
export const defaultSettings = {
	Amazon: {
		skipIntro: true,
		skipCredits: true,
		watchCredits: false,
		selfAd: true,
		skipAd: true,
		speedSlider: true,
		filterPaid: false,
		continuePosition: true,
		showRating: true,
		xray: true,
	},
	Netflix: {
		skipIntro: true,
		skipRecap: true,
		skipCredits: true,
		watchCredits: false,
		skipBlocked: true,
		skipAd: true,
		speedSlider: true,
		profile: true,
		showRating: true,
		removeGames: true,
		hideTitles: true,
	},
	Disney: {
		skipIntro: true,
		skipCredits: true,
		watchCredits: false,
		skipAd: true,
		speedSlider: true,
		showRating: true,
		selfAd: true,
		hideTitles: true,
	},
	Crunchyroll: {
		skipIntro: true,
		speedSlider: true,
		releaseCalendar: true,
		dubLanguage: null,
		profile: true,
		bigPlayer: true,
		disableNumpad: true,
	},
	HBO: {
		skipIntro: true,
		skipCredits: true,
		watchCredits: false,
		speedSlider: true,
		showRating: true,
	},
	Video: {
		playOnFullScreen: true,
		epilepsy: false,
		userAgent: true,
		doubleClick: true,
		scrollVolume: true,
		showYear: false,
	},
	Statistics: {
		AmazonAdTimeSkipped: 0,
		NetflixAdTimeSkipped: 0,
		DisneyAdTimeSkipped: 0,
		IntroTimeSkipped: 0,
		RecapTimeSkipped: 0,
		SegmentsSkipped: 0,
	},
	General: {
		Crunchyroll_profilePicture: "",
		profileName: "",
		profilePicture: "",
		sliderSteps: 1,
		sliderMin: 5,
		sliderMax: 20,
		filterDub: true,
		filterQueued: true,
		savedCrunchyList: [],
		GCdate: "2024-01-01",
		affiliate: true,
	},
}
