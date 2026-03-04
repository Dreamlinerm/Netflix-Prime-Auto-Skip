import titles from "./titles.json"

export const DETAILS_SUFFIX = "Select for details on this title." as const

const knownBadgeTokens = [
	"Disney+ Original",
	"STAR Original",
	"STAR Generic",
	"Hulu Original Series",
	"New Episode Badge",
	"New Movie Badge",
	"New Series Badge",
	"Catch Up on the Series",
] as const

export type TitlePattern =
	| "details_plain"
	| "details_badged"
	| "details_rated_released"
	| "progress_remaining"
	| "numbered_row"
	| "other"

const titlePatterns = [
	"details_plain",
	"details_badged",
	"details_rated_released",
	"progress_remaining",
	"numbered_row",
	"other",
] as const satisfies readonly TitlePattern[]

export function isDetailsCard(label: string): boolean {
	return label.trimEnd().endsWith(DETAILS_SUFFIX)
}

export function hasKnownBadges(label: string): boolean {
	return knownBadgeTokens.some((token) => label.includes(token))
}

export function isRatedReleasedDetailsCard(label: string): boolean {
	// Examples include: "Rated 12 Released 2009 ... Select for details on this title."
	return isDetailsCard(label) && (label.includes(" Rated ") || label.includes(" Released ") || label.includes(" genre"))
}

export function isProgressRemaining(label: string): boolean {
	// Examples include: "Moana 1 hour 54 minutes remaining" or "... 59 minutes remaining"
	return /\bminutes remaining\b/.test(label)
}

export function isNumberedRow(label: string): boolean {
	// Examples include: "Number 1 ..."
	return /^Number\s+\d+\s+/i.test(label)
}

export function detectTitlePattern(label: string): TitlePattern {
	if (isNumberedRow(label)) return "numbered_row"
	if (isProgressRemaining(label)) return "progress_remaining"

	if (isRatedReleasedDetailsCard(label)) return "details_rated_released"

	if (isDetailsCard(label)) {
		if (hasKnownBadges(label)) return "details_badged"
		return "details_plain"
	}

	return "other"
}

export function groupByTitlePattern(labels: readonly string[]) {
	const grouped: Record<TitlePattern, string[]> = {
		details_plain: [],
		details_badged: [],
		details_rated_released: [],
		progress_remaining: [],
		numbered_row: [],
		other: [],
	}

	for (const label of labels) {
		grouped[detectTitlePattern(label)].push(label)
	}

	return grouped
}

export function filterByTitlePattern(labels: readonly string[], pattern: TitlePattern): string[] {
	return labels.filter((label) => detectTitlePattern(label) === pattern)
}

// Convenience exports for unit tests using this fixture
export const fixtureTitles = titles as readonly string[]
export const fixtureTitlesByPattern = groupByTitlePattern(fixtureTitles)
console.log("fixtureTitlesByPattern:", fixtureTitlesByPattern)

// Ensure we didn't forget to initialize a bucket when adding new patterns.
// (This is a runtime no-op; it just forces TS to keep the union in sync.)
export const _allPatterns: readonly TitlePattern[] = titlePatterns
