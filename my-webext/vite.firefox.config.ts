 
import { crx } from "@crxjs/vite-plugin"
import { defineConfig } from "vite"
import zipPack from "vite-plugin-zip-pack"
import manifest from "./manifest.firefox.config"
import packageJson from "./package.json" with { type: "json" }
import ViteConfig from "./vite.config"
import chalk from "chalk"

const IS_DEV = process.env.NODE_ENV === "development"
const browser = "firefox"
const outDir = "dist"
const browserOutDir = `${outDir}/${browser}`
const outFileName = `${browser}-${packageJson.version}.zip`

function printDevMessage() {
  setTimeout(() => {
    console.info("\n")
    console.info(
      `${chalk.greenBright(`✅ Successfully built for ${browser}.`)}`
    )
    console.info(
      chalk.greenBright(
        `🚀 To load this extension in Firefox, go to about:debugging, click "This Firefox", then click "Load Temporary Add-on" and select the extension's manifest file in ${browserOutDir}.`
      )
    )
    console.info("\n")
  }, 50)
}

function printProdMessage() {
  setTimeout(() => {
    console.info("\n")
    console.info(
      `${chalk.greenBright(`✅ Successfully built for ${browser}.`)}`
    )
    console.info(
      `${chalk.greenBright(`📦 Zip File for ${browser} is located at ${outDir}/${outFileName}. You can upload this to respective store. `)}`
    )
    console.info(
      chalk.greenBright(
        `🚀 To load this extension in Firefox, go to about:debugging, click "This Firefox", then click "Load Temporary Add-on" and select the extension's manifest file in ${browserOutDir}.`
      )
    )
    console.info("\n")
  }, 50)
}

if (!ViteConfig.build) {
  ViteConfig.build = {}
}

if (!ViteConfig.plugins) {
  ViteConfig.plugins = []
}

ViteConfig.build.outDir = browserOutDir

ViteConfig.plugins.unshift(
  crx({
    manifest,
    browser,
    contentScripts: {
      injectCss: true,
    },
  })
)

if (IS_DEV) {
  ViteConfig.plugins.push({
    name: "vite-plugin-build-message",
    enforce: "post",
    configureServer(server) {
      server.httpServer?.once("listening", () => {
        printDevMessage()
      })
    },
    closeBundle: {
      sequential: true,
      handler() {
        printDevMessage()
      },
    },
  })
} else {
  ViteConfig.plugins.push(
    zipPack({
      inDir: browserOutDir,
      outDir,
      outFileName,
      filter: (fileName, filePath, isDirectory) =>
        !(isDirectory && filePath.includes(".vite")),
    })
  )

  ViteConfig.plugins.push({
    name: "vite-plugin-build-message",
    enforce: "post",
    closeBundle: {
      sequential: true,
      handler() {
        printProdMessage()
      },
    },
  })
}

// https://vitejs.dev/config/
export default defineConfig({
  ...ViteConfig,
})
