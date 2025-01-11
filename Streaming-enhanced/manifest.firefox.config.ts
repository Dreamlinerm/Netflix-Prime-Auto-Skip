import { defineManifest } from "@crxjs/vite-plugin"
import ManifestConfig from "./manifest.config"

// @ts-expect-error ManifestConfig provides all required fields
export default defineManifest((env) => ({
	...ManifestConfig,
	icons: {
		16: "src/assets/Logo/NetflixAmazon Auto-Skip.svg",
		48: "src/assets/Logo/NetflixAmazon Auto-Skip.svg",
		96: "src/assets/Logo/NetflixAmazon Auto-Skip.svg",
		128: "src/assets/Logo/NetflixAmazon Auto-Skip.svg",
		400: "src/assets/Logo/NetflixAmazon Auto-Skip.svg",
	},
	browser_specific_settings: {
		gecko: {
			id: "NetflixPrime@Autoskip.io",
		},
	},
	manifest_version: 3,
	background: {
		scripts: ["src/background/index.ts"],
		type: "module",
		persistent: false,
	},
	permissions: [
		"storage",
		"webRequest",
		"webRequestBlocking",
		"*://*.disneyplus.com/*",
		"*://*.starplus.com/*",
		"*://*.primevideo.com/*",
		"*://*.amazon.com/*",
		"*://*.amazon.co.jp/*",
		"*://*.amazon.de/*",
		"*://*.amazon.co.uk/*",
		"*://*.max.com/*",
		"*://*.hbomax.com/*",
	],
}))
