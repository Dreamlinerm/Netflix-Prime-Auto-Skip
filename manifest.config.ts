import { env } from "node:process"
import type { ManifestV3Export } from "@crxjs/vite-plugin"
import packageJson from "./package.json" with { type: "json" }

const { version, name, description, displayName } = packageJson
// Convert from Semver (example: 0.1.0-beta6)
const [major, minor, patch] = version
	// can only contain digits, dots, or dash
	.replace(/[^\d.-]+/g, "")
	// split into version parts
	.split(/[.-]/)

export default {
	name: env.mode === "staging" ? `[INTERNAL] ${name}` : displayName || name,
	description,
	// up to four numbers separated by dots
	version: `${major}.${minor}.${patch}`,
	// semver is OK in "version_name"
	// version_name: version,
	manifest_version: 3,
	background: {
		service_worker: "src/background/index.ts",
		type: "module",
	},
	action: {
		default_popup: "src/ui/action-popup/index.html",
	},
	// web_accessible_resources: [
	// 	{
	// 		matches: [
	// 			"*://*.primevideo.com/*",
	// 			"*://*.amazon.com/*",
	// 			"*://*.amazon.co.jp/*",
	// 			"*://*.amazon.de/*",
	// 			"*://*.amazon.co.uk/*",
	// 		],
	// 		resources: ["src/ui/iframe-page/index.html"],
	// 		use_dynamic_url: false,
	// 	},
	// ],
	content_scripts: [
		// {
		// 	all_frames: false,
		// 	js: ["src/content-script/iframe.ts"],
		// 	matches: [
		// 		"*://*.primevideo.com/*",
		// 		"*://*.amazon.com/*",
		// 		"*://*.amazon.co.jp/*",
		// 		"*://*.amazon.de/*",
		// 		"*://*.amazon.co.uk/*",
		// 	],
		// 	run_at: "document_end",
		// },
		{
			js: ["src/content-script/crunchyroll.ts"],
			matches: ["*://*.crunchyroll.com/*"],
		},
		{
			js: ["src/content-script/amazon.ts"],
			matches: [
				"*://*.primevideo.com/*",
				"*://*.amazon.com/*",
				"*://*.amazon.co.jp/*",
				"*://*.amazon.de/*",
				"*://*.amazon.co.uk/*",
			],
		},
		{
			js: ["src/content-script/netflix.ts"],
			matches: ["*://*.netflix.com/*", "*://*.netflix.ca/*", "*://*.netflix.com.au/*"],
		},
		{
			js: ["src/content-script/disney.ts"],
			matches: ["*://*.disneyplus.com/*", "*://*.hotstar.com/*", "*://*.starplus.com/*"],
		},
		{
			js: ["src/content-script/max.ts"],
			matches: ["*://*.max.com/*", "*://*.hbomax.com/*"],
		},
		{
			all_frames: true,
			js: ["src/content-script/static.crunchyroll.ts"],
			matches: ["https://static.crunchyroll.com/vilos-v2/web/vilos/player.html*"],
		},
	],
	options_page: "src/ui/options-page/index.html",
	permissions: ["storage"],
	optional_permissions: ["tabs"],
	icons: {
		16: "src/assets/Logo/NetflixAmazon Auto-Skip--16.png",
		48: "src/assets/Logo/NetflixAmazon Auto-Skip--48.png",
		96: "src/assets/Logo/NetflixAmazon Auto-Skip--96.png",
		128: "src/assets/Logo/NetflixAmazon Auto-Skip--128.png",
		400: "src/assets/Logo/NetflixAmazon Auto-Skip--400.png",
	},
	homepage_url: "https://github.com/Dreamlinerm/Netflix-Prime-Auto-Skip",
} as ManifestV3Export
