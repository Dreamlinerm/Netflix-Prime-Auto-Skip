import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vitest/config"
import vue from "@vitejs/plugin-vue"
import AutoImport from "unplugin-auto-import/vite"

// Tests must not start the extension packager, route watcher or icon downloader.
export default defineConfig({
	resolve: {
		alias: {
			"@intlify/unplugin-vue-i18n/messages": fileURLToPath(
				new URL("./src/tests/fixtures/messages.ts", import.meta.url),
			),
			"vue-router/auto-routes": fileURLToPath(new URL("./src/tests/fixtures/routes.ts", import.meta.url)),
			"@assets": fileURLToPath(new URL("./src/assets", import.meta.url)),
			"@": fileURLToPath(new URL("./src", import.meta.url)),
			"~": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	plugins: [
		vue(),
		AutoImport({
			imports: [
				"vue",
				"pinia",
				"vue-router",
				"@vueuse/core",
				{ "vue-i18n": ["useI18n"] },
				{ "webextension-polyfill": [["*", "browser"]] },
			],
			dirs: ["src/composables/**", "src/stores/**", "src/utils/**"],
			dts: false,
			vueTemplate: true,
		}),
	],
	define: {
		__GITHUB_URL__: JSON.stringify("https://github.com/Dreamlinerm/Netflix-Prime-Auto-Skip"),
		__VERSION__: JSON.stringify("1.1.107"),
		__NAME__: JSON.stringify("streaming-enhanced"),
		__DISPLAY_NAME__: JSON.stringify("Streaming enhanced"),
		__CHANGELOG__: JSON.stringify("# Test changelog"),
		__TMDB_TOKEN__: JSON.stringify("test-token"),
		__MAL_CLIENT_ID__: JSON.stringify("test-client"),
	},
	test: {
		globals: true,
		maxWorkers: 4,
		silent: "passed-only",
		environment: "jsdom",
		setupFiles: "./vitest.setup.ts",
		include: ["src/tests/**/*.test.ts"],
		exclude: ["src/tests/build/**"],
		coverage: {
			provider: "v8",
			// Maintenance scripts have a separate suite in vitest.tools.config.ts.
			include: ["src/**/*.{ts,js,vue}"],
			exclude: ["src/tests/**", "src/types/**", "**/*.d.ts"],
			reporter: ["text", "json", "json-summary", "html", "lcov"],
			reportOnFailure: true,
			thresholds: { perFile: true, statements: 100, branches: 100, functions: 100, lines: 100 },
		},
	},
})
