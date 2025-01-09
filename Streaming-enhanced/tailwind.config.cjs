/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["src/**/*.{html,vue,js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				netflix: "#e60010",
				amazon: "#00aeef",
				disney: "#1d1fff",
				crunchyroll: "#f78b24",
				bgcustom: "#212121",
			},
		},
	},
	plugins: [
		"prettier-plugin-tailwindcss",
		require("@tailwindcss/typography"),
		// require('@tailwindcss/forms'),
		require("daisyui"),
	],
	daisyui: {
		themes: ["light", "dark"],
		logs: false,
	},
}
