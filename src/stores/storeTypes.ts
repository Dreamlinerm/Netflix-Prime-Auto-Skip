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
		improveUI: boolean
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
		skipCredits: boolean
		skipAfterCredits: boolean
		speedSlider: boolean
		releaseCalendar: boolean
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
	Paramount: {
		skipIntro: boolean
		skipCredits: boolean
		watchCredits: boolean
		speedSlider: boolean
		showRating: boolean
		skipAd: boolean
	}
	Video: {
		playOnFullScreen: boolean
		epilepsy: boolean
		userAgent: boolean
		doubleClick: boolean
		scrollVolume: boolean
		showYear: boolean
		dimLowRatings: boolean
	}
	Statistics: {
		AmazonAdTimeSkipped: number
		NetflixAdTimeSkipped: number
		DisneyAdTimeSkipped: number
		ParamountAdTimeSkipped: number
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
		Crunchyroll_skipTimeout: number
		RatingThresholds: Array<{ color: string; value: number }>
	}
}

export type Nullable<T> = T | null | undefined
export type CrunchyListElement = { href: Nullable<string>; name: Nullable<string>; time: string }
export type CrunchyList = Array<CrunchyListElement>
enum RatingColors {
	Red = "red",
	Grey = "grey",
	Yellow = "rgb(245, 197, 24)", // #f5c
	Green = "rgb(0, 166, 0)",
}

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
		improveUI: true,
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
		skipCredits: true,
		skipAfterCredits: false,
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
	Paramount: {
		skipIntro: true,
		skipCredits: true,
		watchCredits: false,
		speedSlider: true,
		showRating: true,
		skipAd: true,
	},
	Video: {
		playOnFullScreen: true,
		epilepsy: false,
		userAgent: true,
		doubleClick: true,
		scrollVolume: true,
		showYear: false,
		dimLowRatings: false,
	},
	Statistics: {
		AmazonAdTimeSkipped: 0,
		NetflixAdTimeSkipped: 0,
		DisneyAdTimeSkipped: 0,
		ParamountAdTimeSkipped: 0,
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
		Crunchyroll_skipTimeout: 0,
		RatingThresholds: [
			{ color: RatingColors.Red, value: 5.5 },
			{ color: RatingColors.Yellow, value: 7 },
			{ color: RatingColors.Green, value: 10 },
		],
	},
}
