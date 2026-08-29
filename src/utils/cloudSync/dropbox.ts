import { generateCodeChallenge, generateCodeVerifier, generateState } from "./pkce"
import { CloudSyncError, type CloudSyncPayload, type TokenBundle } from "./types"

const AUTH_URL = "https://www.dropbox.com/oauth2/authorize"
const TOKEN_URL = "https://api.dropboxapi.com/oauth2/token"
const CONTENT_BASE = "https://content.dropboxapi.com/2/files"
// Fixed path relative to the app's own folder - create the Dropbox app with "App folder"
// access so this can never reach the rest of the user's Dropbox.
const FILE_PATH = "/hidden-titles-sync.json"

export async function connectDropbox(appKey: string): Promise<TokenBundle> {
	if (!appKey) throw new CloudSyncError("Dropbox: missing app key")
	const redirectUri = browser.identity.getRedirectURL()
	const codeVerifier = generateCodeVerifier()
	const codeChallenge = await generateCodeChallenge(codeVerifier)
	const state = generateState()

	const authUrl = new URL(AUTH_URL)
	authUrl.searchParams.set("client_id", appKey)
	authUrl.searchParams.set("redirect_uri", redirectUri)
	authUrl.searchParams.set("response_type", "code")
	authUrl.searchParams.set("token_access_type", "offline")
	authUrl.searchParams.set("code_challenge", codeChallenge)
	authUrl.searchParams.set("code_challenge_method", "S256")
	authUrl.searchParams.set("state", state)

	const redirectedTo = await browser.identity.launchWebAuthFlow({ url: authUrl.toString(), interactive: true })
	if (!redirectedTo) throw new CloudSyncError("Dropbox: authorization was cancelled")
	const resultUrl = new URL(redirectedTo)
	if (resultUrl.searchParams.get("state") !== state) throw new CloudSyncError("Dropbox: invalid OAuth state")
	const authError = resultUrl.searchParams.get("error")
	if (authError) throw new CloudSyncError(`Dropbox: ${authError}`)
	const code = resultUrl.searchParams.get("code")
	if (!code) throw new CloudSyncError("Dropbox: no authorization code returned")

	const response = await fetch(TOKEN_URL, {
		method: "POST",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: appKey,
			code,
			code_verifier: codeVerifier,
			grant_type: "authorization_code",
			redirect_uri: redirectUri,
		}),
	})
	const data = await response.json()
	if (!response.ok || !data.refresh_token) {
		throw new CloudSyncError(`Dropbox: token exchange failed (${data.error_summary ?? response.status})`)
	}
	return {
		refreshToken: data.refresh_token,
		accessToken: data.access_token,
		accessTokenExpiresAt: Date.now() + data.expires_in * 1000,
	}
}

export async function refreshDropboxAccessToken(
	appKey: string,
	refreshToken: string,
): Promise<{ accessToken: string; accessTokenExpiresAt: number }> {
	const response = await fetch(TOKEN_URL, {
		method: "POST",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({ client_id: appKey, refresh_token: refreshToken, grant_type: "refresh_token" }),
	})
	const data = await response.json()
	if (!response.ok) {
		throw new CloudSyncError(`Dropbox: token refresh failed (${data.error_summary ?? response.status})`)
	}
	return { accessToken: data.access_token, accessTokenExpiresAt: Date.now() + data.expires_in * 1000 }
}

export async function downloadDropboxFile(accessToken: string): Promise<CloudSyncPayload | null> {
	const response = await fetch(`${CONTENT_BASE}/download`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Dropbox-API-Arg": JSON.stringify({ path: FILE_PATH }),
		},
	})
	if (response.status === 409) return null // path/not_found - nothing uploaded yet
	if (!response.ok) throw new CloudSyncError(`Dropbox: download failed (${response.status})`)
	return response.json()
}

export async function uploadDropboxFile(accessToken: string, payload: CloudSyncPayload): Promise<void> {
	const response = await fetch(`${CONTENT_BASE}/upload`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"content-type": "application/octet-stream",
			"Dropbox-API-Arg": JSON.stringify({ path: FILE_PATH, mode: "overwrite" }),
		},
		body: JSON.stringify(payload),
	})
	if (!response.ok) throw new CloudSyncError(`Dropbox: upload failed (${response.status})`)
}
