const AMAZON_ALLOWED_FILTER_PATHS = /(storefront|genre|movie|amazon-video|\/tv|\/addons)/i

export function shouldRunAmazonPaidFilter(url: string) {
	return AMAZON_ALLOWED_FILTER_PATHS.test(url)
}

export function isStoreIconTitle(title: string | null | undefined) {
	return /store/i.test(title ?? "")
}

export function shouldRemoveWholePaidSection(visibleCardsCount: number, paidCardsCount: number, bannerOffset = 2) {
	// bannerOffset = 2 because sometimes there are title banners, wich are not paid content.
	if (visibleCardsCount <= 0 || paidCardsCount <= 0) return false
	return visibleCardsCount - bannerOffset <= paidCardsCount
}
