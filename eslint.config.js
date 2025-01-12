import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"
import pluginVue from "eslint-plugin-vue"

/** @type {import('eslint').Linter.Config[]} */
export default [
	{ files: ["**/*.{ts,vue}"] },
	{ languageOptions: { globals: globals.browser } },
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	...pluginVue.configs["flat/essential"],
	{ files: ["**/*.vue"], languageOptions: { parserOptions: { parser: tseslint.parser } } },
	{
		rules: {
			"no-inner-declarations": "off",
			"no-console": "off",
			"no-undef": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"vue/multi-word-component-names": "off",
			"@typescript-eslint/no-unused-vars": "off",
		},
	},
]
