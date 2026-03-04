import { readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const DISNEY_TITLE_RE_EN = new RegExp(
	[
		String.raw`^`,
		// sometimes there is a "Number 1 " or "Number 2 " badge in the title, but it is not consistent
		String.raw`(?:Number\s+\d+\s+)?`,
		// sometimes there is a "Disney+ Original" or "STAR Original" badge in the title, but it is not consistent
		// starting the non capturing group
		String.raw`(?:(?:`,
		String.raw`Catch Up on the Series|New(?: (?:Episode|Movie|Series))? Badge|Hulu Original Series|Disney\+ Original|STAR (?:Original|Generic)|ZDF Enterprises`,
		String.raw`)\s+)*`,
		// ending the non capturing group
		String.raw`\s*`,
		// The title is captured in a non-greedy way until we reach one of the following keywords that indicate additional info, or the end of the string
		String.raw`(?<title>[\s\S]+?)`,
		// lookahead for keywords that indicate end of title and start of additional info, e.g. Season
		String.raw`(?=`,
		// these keywords indicate that the title has ended and additional info has started, such as season number, release date, rating, etc.
		String.raw`\s+(?:Season\b|Official Podcast|Rated\b|Released\b|Coming\b|Prepare\b|New Episode\b|Catch Up on the Series|New(?: (?:Episode|Movie|Series))? Badge|Hulu Original Series|Disney\+ Original|STAR (?:Original|Generic)|ZDF Enterprises|Select for details on this title\.|\d+\s+hour\b|\d+\s+minutes remaining\b)`,
		// or the end of the string
		"|$",
		")",
	].join(""),
)

const filePath = fileURLToPath(import.meta.url)
const dirPath = dirname(filePath)
const titlesJsonPath = join(dirPath, "titles.json")

const parsed = JSON.parse(await readFile(titlesJsonPath, "utf8")) as unknown
if (!Array.isArray(parsed)) {
	throw new Error("titles.json did not contain an array")
}

for (const [index, label] of parsed.entries()) {
	const asString = String(label)
	const match = asString.match(DISNEY_TITLE_RE_EN)
	const filteredTitle = match?.groups?.title?.trim() || asString.trim()
	console.log(filteredTitle)
}
