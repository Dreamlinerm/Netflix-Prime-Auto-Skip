// Sample code if using extensionpay.com
// import { extPay } from '@/utils/payment/extPay'
// extPay.startBackground()

chrome.runtime.onInstalled.addListener(async (opt) => {
  // Check if reason is install or update. Eg: opt.reason === 'install' // If extension is installed.
  // opt.reason === 'update' // If extension is updated.
  if (opt.reason === "install") {
    // TODO: add back
    // await chrome.storage.local.clear()

    chrome.tabs.create({
      active: true,
      // Open the setup page and append `?type=install` to the URL so frontend
      // can know if we need to show the install page or update page.
      // url: chrome.runtime.getURL("src/ui/setup/index.html#/setup/install"),
      url: chrome.runtime.getURL(
        "src/ui/setup/index.html#/action-popup/SharedOptions",
      ),
    })
  }

  if (opt.reason === "update") {
    chrome.tabs.create({
      active: true,
      // url: chrome.runtime.getURL("src/ui/setup/index.html#/setup/update"),
      url: chrome.runtime.getURL(
        "src/ui/setup/index.html#/action-popup/SharedOptions",
      ),
    })
  }
})

self.onerror = function (message, source, lineno, colno, error) {
  console.info("Error: " + message)
  console.info("Source: " + source)
  console.info("Line: " + lineno)
  console.info("Column: " + colno)
  console.info("Error object: " + error)
}

console.info("hello world from background")
import { onMessage } from "webext-bridge/background"

onMessage("LOG", runAction)
async function runAction({ data }: { data: any }) {
  // process data
  console.info(...data)
  // return data
  return {}
}
export {}
