import { defineConfig } from "vitest/config"

// Run maintenance scripts without importing the browser extension's Vite build.
export default defineConfig({
	test: {
		include: ["src/tests/build/**/*.test.ts"],
		environment: "node",
		maxWorkers: 4,
		silent: "passed-only",
		coverage: {
			provider: "v8",
			include: ["scripts/**/*.ts", "graph/**/*.ts"],
			reporter: ["text", "json-summary", "html"],
			reportsDirectory: "coverage/tools",
			thresholds: { perFile: true, statements: 100, branches: 100, functions: 100, lines: 100 },
		},
	},
})
