import { sendMessage } from "webext-bridge/content-script"
// This import scss file is used to style the iframe that is injected into the page
import "./index.scss"

const src = chrome.runtime.getURL("/src/ui/iframe-page/index.html")

const iframe = new DOMParser().parseFromString(`<iframe class="crx-iframe" src="${src}"></iframe>`, "text/html").body
	.firstElementChild

const affiliateTag = "?tag=dreamliner05-20"
const affiliatePages = [
	"https://www.amazon.de/amazonprime?language=pl_PL",
	"http://www.amazon.de/primegratistesten",
	"https://www.amazon.co.uk/tryprimefree",

	// "http://www.amazon.es/prime",
	// "https://www.amazon.fr/prime",
	// "http://www.amazon.it/amazonprime",
	// "https://www.amazon.nl/prime",
]
const url = document.URL

function isOnAffiliatePage(url: string) {
	return (
		(affiliatePages.some((page) => url.includes(page)) || url.includes("/amazonprime")) && !url.includes(affiliateTag)
	)
}

window.addEventListener("message", function (event) {
	console.log(event.data)
	if (event.data.type === "applyPrimeAffiliateLink") {
		// Handle the message from the iframe
		console.log("applyPrimeAffiliateLink")
		sendMessage("applyPrimeAffiliateLink", { url: window.location.href + affiliateTag }, "background")
	}
})

if (iframe && isOnAffiliatePage(url)) {
	document.body?.append(iframe)
	// get current Tab id
}

self.onerror = function (message, source, lineno, colno, error) {
	console.info("Error: " + message)
	console.info("Source: " + source)
	console.info("Line: " + lineno)
	console.info("Column: " + colno)
	console.info("Error object: " + error)
}

console.log("hello world from content-script")
