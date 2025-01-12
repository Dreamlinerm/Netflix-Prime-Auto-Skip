module.exports = {
	env: {
		browser: true,
		es2021: true,
	},
	extends: "eslint:recommended",
	overrides: [
		{
			env: {
				node: true,
			},
			files: [".eslintrc.{ts,vue,html}"],
			parserOptions: {
				sourceType: "script",
			},
		},
	],
	parserOptions: {
		ecmaVersion: "latest",
	},
	rules: {
		"no-inner-declarations": "off",
		"no-console": "off",
	},
}
