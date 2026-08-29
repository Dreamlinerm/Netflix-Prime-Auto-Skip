export const CLOUD_SYNC_VERSION = 1

export type CloudSyncPayload = {
	version: typeof CLOUD_SYNC_VERSION
	updatedAt: string
	items: HiddenTitles
	tombstones: HiddenTitleTombstones
}

export type TokenBundle = {
	refreshToken: string
	accessToken: string
	accessTokenExpiresAt: number
}

export class CloudSyncError extends Error {}
