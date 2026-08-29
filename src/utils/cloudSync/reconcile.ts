import { CLOUD_SYNC_VERSION, type CloudSyncPayload } from "./types"

export type LocalSyncState = {
	items: HiddenTitles
	tombstones: HiddenTitleTombstones
}

const TOMBSTONE_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000

function sortedJson(obj: Record<string, unknown>): string {
	const sorted: Record<string, unknown> = {}
	for (const key of Object.keys(obj).sort()) sorted[key] = obj[key]
	return JSON.stringify(sorted)
}

function sameItemsAndTombstones(
	itemsA: HiddenTitles,
	tombstonesA: HiddenTitleTombstones,
	itemsB: HiddenTitles,
	tombstonesB: HiddenTitleTombstones,
): boolean {
	return sortedJson(itemsA) === sortedJson(itemsB) && sortedJson(tombstonesA) === sortedJson(tombstonesB)
}

// title can't be both hidden and tombstoned locally at once (hideTitle/unhideTitle keep that invariant),
// so remote adds/deletes only need to be checked against whichever side currently holds the title.
export function reconcile(
	local: LocalSyncState,
	remote: CloudSyncPayload | null,
): { merged: CloudSyncPayload; localChanged: boolean; remoteChanged: boolean } {
	const items: HiddenTitles = { ...local.items }
	const tombstones: HiddenTitleTombstones = { ...local.tombstones }

	if (remote) {
		for (const [title, entry] of Object.entries(remote.items)) {
			if (items[title]) continue
			const localTombstoneAt = tombstones[title]
			if (localTombstoneAt && localTombstoneAt >= entry.dateAdded) continue
			items[title] = entry
			delete tombstones[title]
		}
		for (const [title, deletedAt] of Object.entries(remote.tombstones)) {
			const localItem = items[title]
			if (localItem && localItem.dateAdded > deletedAt) continue
			delete items[title]
			const existingTombstoneAt = tombstones[title]
			if (!existingTombstoneAt || existingTombstoneAt < deletedAt) tombstones[title] = deletedAt
		}
	}

	const cutoff = Date.now() - TOMBSTONE_MAX_AGE_MS
	for (const [title, deletedAt] of Object.entries(tombstones)) {
		if (new Date(deletedAt).getTime() < cutoff) delete tombstones[title]
	}

	const merged: CloudSyncPayload = { version: CLOUD_SYNC_VERSION, updatedAt: new Date().toISOString(), items, tombstones }
	const localChanged = !sameItemsAndTombstones(local.items, local.tombstones, items, tombstones)
	const remoteChanged = !remote || !sameItemsAndTombstones(remote.items, remote.tombstones, items, tombstones)

	return { merged, localChanged, remoteChanged }
}
