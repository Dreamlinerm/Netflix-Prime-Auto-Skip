import * as dropbox from "./dropbox"
import * as googleDrive from "./googleDrive"
import { reconcile, type LocalSyncState } from "./reconcile"
import { CloudSyncError } from "./types"

const TOKEN_REFRESH_MARGIN_MS = 60_000

export async function connectCloudProvider(
	provider: "googleDrive" | "dropbox",
	settings: CloudSyncSettings,
): Promise<CloudSyncSettings> {
	if (provider === "googleDrive") {
		const tokens = await googleDrive.connectGoogleDrive(settings.googleDrive.clientId, settings.googleDrive.clientSecret)
		return {
			...settings,
			provider,
			googleDrive: { ...settings.googleDrive, ...tokens, fileId: null },
			lastError: null,
		}
	}
	const tokens = await dropbox.connectDropbox(settings.dropbox.appKey)
	return {
		...settings,
		provider,
		dropbox: { ...settings.dropbox, ...tokens },
		lastError: null,
	}
}

export function disconnectCloudProvider(settings: CloudSyncSettings): CloudSyncSettings {
	return {
		...settings,
		provider: "none",
		googleDrive: {
			...settings.googleDrive,
			refreshToken: null,
			accessToken: null,
			accessTokenExpiresAt: null,
			fileId: null,
		},
		dropbox: { ...settings.dropbox, refreshToken: null, accessToken: null, accessTokenExpiresAt: null },
		lastError: null,
	}
}

async function ensureGoogleDriveAccessToken(
	settings: CloudSyncSettings,
): Promise<{ accessToken: string; settings: CloudSyncSettings }> {
	const { googleDrive: gd } = settings
	if (gd.accessToken && gd.accessTokenExpiresAt && gd.accessTokenExpiresAt - TOKEN_REFRESH_MARGIN_MS > Date.now()) {
		return { accessToken: gd.accessToken, settings }
	}
	if (!gd.refreshToken) throw new CloudSyncError("Google Drive: not connected")
	const refreshed = await googleDrive.refreshGoogleDriveAccessToken(gd.clientId, gd.clientSecret, gd.refreshToken)
	return { accessToken: refreshed.accessToken, settings: { ...settings, googleDrive: { ...gd, ...refreshed } } }
}

async function ensureDropboxAccessToken(
	settings: CloudSyncSettings,
): Promise<{ accessToken: string; settings: CloudSyncSettings }> {
	const { dropbox: db } = settings
	if (db.accessToken && db.accessTokenExpiresAt && db.accessTokenExpiresAt - TOKEN_REFRESH_MARGIN_MS > Date.now()) {
		return { accessToken: db.accessToken, settings }
	}
	if (!db.refreshToken) throw new CloudSyncError("Dropbox: not connected")
	const refreshed = await dropbox.refreshDropboxAccessToken(db.appKey, db.refreshToken)
	return { accessToken: refreshed.accessToken, settings: { ...settings, dropbox: { ...db, ...refreshed } } }
}

async function syncGoogleDrive(
	settings: CloudSyncSettings,
	local: LocalSyncState,
): Promise<{ settings: CloudSyncSettings; local: LocalSyncState | null }> {
	const { accessToken, settings: withToken } = await ensureGoogleDriveAccessToken(settings)
	let fileId = withToken.googleDrive.fileId
	if (!fileId) fileId = await googleDrive.findGoogleDriveFileId(accessToken)
	const remote = fileId ? await googleDrive.downloadGoogleDriveFile(accessToken, fileId) : null
	const { merged, localChanged, remoteChanged } = reconcile(local, remote)
	if (remoteChanged) fileId = await googleDrive.uploadGoogleDriveFile(accessToken, fileId, merged)
	const nextSettings: CloudSyncSettings = {
		...withToken,
		googleDrive: { ...withToken.googleDrive, fileId },
		lastSyncedAt: new Date().toISOString(),
		lastError: null,
	}
	return { settings: nextSettings, local: localChanged ? { items: merged.items, tombstones: merged.tombstones } : null }
}

async function syncDropbox(
	settings: CloudSyncSettings,
	local: LocalSyncState,
): Promise<{ settings: CloudSyncSettings; local: LocalSyncState | null }> {
	const { accessToken, settings: withToken } = await ensureDropboxAccessToken(settings)
	const remote = await dropbox.downloadDropboxFile(accessToken)
	const { merged, localChanged, remoteChanged } = reconcile(local, remote)
	if (remoteChanged) await dropbox.uploadDropboxFile(accessToken, merged)
	const nextSettings: CloudSyncSettings = { ...withToken, lastSyncedAt: new Date().toISOString(), lastError: null }
	return { settings: nextSettings, local: localChanged ? { items: merged.items, tombstones: merged.tombstones } : null }
}

// Pulls the remote file, merges with local hidden titles/tombstones, pushes back if anything
// changed on either side, and returns the (possibly unchanged) settings/local state for the
// caller to persist. Never throws - failures are reported via settings.lastError.
export async function runCloudSync(
	settings: CloudSyncSettings,
	local: LocalSyncState,
): Promise<{ settings: CloudSyncSettings; local: LocalSyncState | null }> {
	if (settings.provider === "none") return { settings, local: null }
	try {
		if (settings.provider === "googleDrive") return await syncGoogleDrive(settings, local)
		return await syncDropbox(settings, local)
	} catch (error) {
		const message = error instanceof CloudSyncError ? error.message : `Sync failed: ${(error as Error).message}`
		return { settings: { ...settings, lastError: message }, local: null }
	}
}
