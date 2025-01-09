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
		themes: [
			{
				light: {
					primary: "#fff",
				},
			},
			{
				dark: {
					primary: "#242424",
					secondary: "#0082fc",
					accent: "#00ffff",
					neutral: "#161616",
					"base-100": "#212121",
					info: "#0000ff",
					success: "#00ff00",
					warning: "#00ff00",
					error: "#ff0000",
				},
			},
		],
		logs: false,
	},
}
