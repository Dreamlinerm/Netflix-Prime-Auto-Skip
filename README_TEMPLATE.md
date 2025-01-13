# vite-vue3-browser-extension-v3


## Directory Structure

```bash
.
├── .translations           # auto-generated translation files
│   ├── deepl.EN.json       # English input for translation script
├── dist                    # Built extension files
│   ├── chrome              # Chrome-specific build
│   └── firefox             # Firefox-specific build
├── docs                    # Localized store descriptions
├── downloaded HtmlButtons  # Some downloaded html buttons
├── graph                   # chrome and firefox user statistics
├── icon                    # copy of used icons and logos
├── Logos                   # Images used in Readme
├── Screenshots             # Screenshots of the extension
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
│   │   ├── iframe-page     # Content script app injected into pages by content script
│   │   ├── options-page    # Extension options
│   └── utils               # Shared utilities
├── manifest.config.ts      # Base manifest configuration
├── vite.config.ts          # Base Vite configuration
├── tailwind.config.cjs     # Tailwind CSS configuration
└── package.json            # Project dependencies and scripts
```

### Formatting and Linting Commands

- ```pnpm format``` run prettier on all files 
- ```pnpm lint``` run esLint
- ```pnpm lint:manifest``` web-ext lint manifest files

### Author Commands

- ```pnpm transDeepL``` translate .translation/deepl.EN.json and output them into the locales files directly
- ```pnpm hours``` calculate the hours spent on the project
- ```pnpm copyDocsFtoC``` copy the docs from the firefox folder to the chrome folder
- ```pnpm firefox``` run extension with permanent firefox profile


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
