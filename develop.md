# vite-vue3-browser-extension-v3

## Directory Structure

```bash
.
├── .translations           # auto-generated translation files
│   ├── deepl.EN.json       # English input for translation script
├── dist                    # Built extension files
│   ├── chrome              # Chrome-specific build
│   └── firefox             # Firefox-specific build
├── docs                    # documentation
│   ├── ChromeStoreDescriptions # Chrome store descriptions
│   ├── storeDescriptions   # Firefox store descriptions
│   ├── HtmlButtons         # Some downloaded html buttons
│   ├── icon                # copy of used icons and logos
│   ├── Logos               # Images used in Readme
│   ├── Screenshots         # Screenshots of the extension
├── graph                   # chrome and firefox user statistics
├── scripts                 # Build/dev scripts
├── src                     # Source code
│   ├── assets              # Global assets (images, styles)
│   ├── background          # Extension background script
│   ├── components          # Shared Vue components
│   ├── composables         # Vue composables/hooks
│   ├── content-script      # Content scripts injected into pages
│   ├── locales             # i18n translation files
│   ├── stores              # Pinia stores
│   ├── types               # TypeScript type definitions
│   ├── ui                  # UI pages
│   │   ├── action-popup    # Browser toolbar popup
│   │   ├── options-page    # Extension options
│   └── utils               # Shared utilities
├── manifest.config.ts      # Base manifest configuration
├── vite.config.ts          # Base Vite configuration
├── tailwind.config.cjs     # Tailwind CSS configuration
└── package.json            # Project dependencies and scripts
```

### Environment variables

Create .env file in the root of the project with the following content:

```
DEEPL_API_KEY=...
TMDB_TOKEN=...
```

### Author Commands

- `pnpm transDeepL` translate .translation/deepl.EN.json and output them into the locales files directly
- `pnpm hours` calculate the hours spent on the project
- `pnpm copyDocsFtoC` copy the docs from the firefox folder to the chrome folder

## E2E tests (Playwright)

Playwright is set up to run E2E tests against the unpacked Chromium extension build in `dist/chrome`.

- Install browsers once: `pnpm exec playwright install chromium`
- Run E2E tests: `pnpm test:e2e`
- UI mode: `pnpm test:e2e:ui`

Notes:

- The extension is loaded via `--disable-extensions-except` + `--load-extension`.
- By default the fixture runs headed (recommended for extensions). You can try headless with `PW_HEADLESS=1`, but extension support in headless can be flaky depending on Chromium.

### Staying signed in (Netflix, etc.)

By default, the E2E fixture creates a temporary Chromium profile and deletes it after each run. If you want to stay signed into Netflix between runs, use a persistent `userDataDir`.

1. Create / reuse a persistent profile and sign in once folder `.playwright/user-data`:

- `pnpm auth`

2. Open a Playwright recording browser with that same profile:

- `pnpm record`

You can also use Playwright's built-in recorder (without loading the extension) like this:

- `pnpm exec playwright codegen --user-data-dir .playwright/user-data https://www.netflix.com`

Environment variables:

- `PW_USER_DATA_DIR=...` uses a custom profile directory (also not deleted).
- `PW_CHANNEL=chrome` optionally runs tests in your installed Google Chrome instead of bundled Chromium.

Tip: using an _existing_ Chrome profile directly can be flaky (profile lock, version mismatch). If you want to import your existing login, prefer logging in once via `pnpm auth` into the Playwright profile.

## Development tools

### Vite Plugins

- [`unplugin-vue-router`](https://github.com/posva/unplugin-vue-router) - File system based route generator for Vite
- [`unplugin-auto-import`](https://github.com/antfu/unplugin-auto-import) - Directly use `browser` and Vue Composition API without importing
- [`unplugin-vue-components`](https://github.com/antfu/vite-plugin-components) - components auto import
- [`unplugin-icons`](https://github.com/antfu/unplugin-icons) - icons as components
- [`unplugin-turbo-console`](https://github.com/unplugin/unplugin-turbo-console) - Improve the Developer Experience of console
- [`@intlify/unplugin-vue-i18n`](https://github.com/intlify/bundle-tools/tree/main/packages/unplugin-vue-i18n) - unplugin for Vue I18n

### Vue Plugins

- [Pinia](https://pinia.vuejs.org/) - Intuitive, type safe, light and flexible Store for Vue
- [VueUse](https://github.com/antfu/vueuse) - collection of useful composition APIs
- [Notivue](https://github.com/smastrom/notivue) - toast notification system
- [Vue-i18n](https://kazupon.github.io/vue-i18n/) - Internationalization plugin for Vue.js

### Plugins

- [Marked](https://github.com/markedjs/marked) - A markdown parser and compiler. Used for CHANGELOG.md to show in Update page

### UI Frameworks

- [tailwindcss](https://tailwindcss.com) - A utility-first CSS framework
- [daisyUI](https://daisyui.com/) - The most popular component library for Tailwind CSS

### WebExtension Libraries

- [`webext-bridge`](https://github.com/zikaari/webext-bridge) - effortlessly communication between contexts
- [`webextension-polyfill`](https://github.com/mozilla/webextension-polyfill) - A lightweight polyfill library for Promise-based WebExtension APIs in Chrome

### Coding Style

- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript at Any Scale
- [ESLint](https://eslint.org/) - Linting utility for JavaScript and JSX
- [Prettier](https://prettier.io/) - Code formatter
- Use Composition API with [`<script setup>` SFC syntax](https://github.com/vuejs/rfcs/pull/227)
- Use Composition API with [`setup` SFC syntax](https://pinia.vuejs.org/cookbook/composables.html#Setup-Stores) in Pinia stores

### Browser Related Configurations

- `manifest.config.ts` - Base extension manifest with common configuration
- `manifest.chrome.config.ts` - Chrome/ chromium based browsers specific manifest
- `manifest.firefox.config.ts` - Firefox spefic manifest
- `vite.config.ts` - Base vite configuration
- `vite.chrome.config.ts` - Chrome/ chromium based browsers specific vite configuration
- `vite.firefox.config.ts` - Firefox specific vite configuration
