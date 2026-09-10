/** Playback shortcuts must never consume text entry or browser/OS shortcuts. */
export function isPlaybackShortcut(event: KeyboardEvent): boolean {
	if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)
		return false
	if (event.key !== "s" && event.key !== "d") return false
	return !event
		.composedPath()
		.some(
			(target) =>
				target instanceof HTMLElement &&
				(target.matches("input, textarea, select") ||
					target.isContentEditable ||
					target.closest('[contenteditable]:not([contenteditable="false"])') !== null),
		)
}
