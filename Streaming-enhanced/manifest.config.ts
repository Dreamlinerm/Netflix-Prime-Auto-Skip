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
	// author: {
	//   email: "mubaidr@gmail.com",
	// },
	name: env.mode === "staging" ? `[INTERNAL] ${name}` : displayName || name,
	description,
	// up to four numbers separated by dots
	version: `${major}.${minor}.${patch}`,
	// semver is OK in "version_name"
	// version_name: version,
	manifest_version: 3,
	// key: '',
	action: {
		default_popup: "src/ui/action-popup/index.html",
	},
	background: {
		service_worker: "src/background/index.ts",
		type: "module",
	},
	content_scripts: [
		{
			// all_frames: false,
			js: ["src/content-script/index.ts"],
			matches: [
				"*://*.primevideo.com/*",
				"*://*.amazon.com/*",
				"*://*.amazon.co.jp/*",
				"*://*.amazon.de/*",
				"*://*.amazon.co.uk/*",
				"*://*.netflix.com/*",
				"*://*.netflix.ca/*",
				"*://*.netflix.com.au/*",
				"*://*.disneyplus.com/*",
				"*://*.hotstar.com/*",
				"*://*.crunchyroll.com/*",
				"*://*.starplus.com/*",
				"*://*.max.com/*",
				"*://*.hbomax.com/*",
			],
			// run_at: "document_end",
		},
		{
			// all_frames: false,
			js: ["src/content-script/cr.ts"],
			matches: ["*://*.crunchyroll.com/*"],
			// run_at: "document_end",
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
