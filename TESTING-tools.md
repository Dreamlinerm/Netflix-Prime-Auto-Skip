# Maintenance script validation

Install the committed dependencies with Node 26, then run:

```sh
npm ci --ignore-scripts
npx vitest run --config vitest.tools.config.ts --coverage
```

This separate configuration avoids starting the extension's Vite packager or browser test setup. It enforces 100% line, statement, function and branch coverage per TypeScript maintenance file under `scripts/` and `graph/`. Browser runtime and Android coverage are outside this suite.

Tests exercise source archive selection, nested secret files and symlinks, archive errors, empty/trailing CSV input, case-sensitive graph asset references, documentation conversion and translation command error paths. Filesystem and subprocess calls are mocked; no translation service is contacted or credentials required. Static locale/entrypoint checks read repository assets without modifying them.

To inspect a real source package after building the browser packages:

```sh
node --import tsx scripts/zip.ts
unzip -l dist/archive.zip
```

The source archive uses an explicit root allowlist and excludes nested dotfiles, dependency directories, credential-file extensions, logs and symbolic links. When introducing another required build input, update the allowlist and its tests. This is an archive boundary, not a scanner for credentials embedded in otherwise permitted source files.
