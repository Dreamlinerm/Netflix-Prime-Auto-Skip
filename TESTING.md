# Web extension validation

Use Node 26 and the committed lockfile:

```sh
npm ci --ignore-scripts
npm run test:coverage
npm run test:bugs
npm run typecheck:audit
npx eslint src vitest.config.ts vitest.setup.ts
npm run build:chrome
npm run build:firefox
```

The web suite enforces 100% statement, branch, function and line coverage per runtime file under `src/`. Test files and generated type declarations are outside that measurement. Tests use jsdom, controlled timers and mocked extension/network APIs; they do not contact streaming accounts or metadata services. Tests named `BUG` are ordinary required assertions, not expected failures.

`src/tests/build/` and the scripts/graph converter belong to the separate maintenance suite (`npx vitest run --config vitest.tools.config.ts --coverage`) when that configuration is present. Android, build configuration, CSS, static data and third-party dependencies are not claimed as runtime coverage.

To check order independence:

```sh
npm run test:coverage -- --sequence.shuffle --sequence.seed=20260910
```

On systems with limited file watchers, prefix build commands with `CHOKIDAR_USEPOLLING=true`. Build Chrome and Firefox sequentially because they share generated declarations.

For manual testing, load `dist/chrome` in Edge/Chrome or `dist/firefox` in Firefox, with the original extension disabled. Verify setting changes during playback, text entry versus speed shortcuts, delayed intro/promo buttons, video replacement, and restoration of media state after disabling ad handling. Confirm that playback continues after a skip. Coverage alone does not establish compatibility with DRM, live advertisements, account variants or future changes to streaming sites. Builds without TMDB/MAL configuration cannot validate those integrations online.
