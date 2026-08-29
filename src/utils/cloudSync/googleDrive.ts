import { generateCodeChallenge, generateCodeVerifier, generateState } from "./pkce"
import { CloudSyncError, type CloudSyncPayload, type TokenBundle } from "./types"

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const TOKEN_URL = "https://oauth2.googleapis.com/token"
const API_BASE = "https://www.googleapis.com/drive/v3"
const UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3"
const SCOPE = "https://www.googleapis.com/auth/drive.appdata"
export const GOOGLE_DRIVE_FILE_NAME = "hidden-titles-sync.json"

// Google's token endpoint requires client_secret for "Desktop app" OAuth clients even with
// PKCE - it isn't treated as a confidential secret for that client type, but it's mandatory.
export async function connectGoogleDrive(clientId: string, clientSecret: string): Promise<TokenBundle> {
	if (!clientId || !clientSecret) throw new CloudSyncError("Google Drive: missing client ID or client secret")
	const redirectUri = browser.identity.getRedirectURL()
	const codeVerifier = generateCodeVerifier()
	const codeChallenge = await generateCodeChallenge(codeVerifier)
	const state = generateState()

	const authUrl = new URL(AUTH_URL)
	authUrl.searchParams.set("client_id", clientId)
	authUrl.searchParams.set("redirect_uri", redirectUri)
	authUrl.searchParams.set("response_type", "code")
	authUrl.searchParams.set("scope", SCOPE)
	authUrl.searchParams.set("access_type", "offline")
	authUrl.searchParams.set("prompt", "consent")
	authUrl.searchParams.set("code_challenge", codeChallenge)
	authUrl.searchParams.set("code_challenge_method", "S256")
	authUrl.searchParams.set("state", state)

	const redirectedTo = await browser.identity.launchWebAuthFlow({ url: authUrl.toString(), interactive: true })
	if (!redirectedTo) throw new CloudSyncError("Google Drive: authorization was cancelled")
	const resultUrl = new URL(redirectedTo)
	if (resultUrl.searchParams.get("state") !== state) throw new CloudSyncError("Google Drive: invalid OAuth state")
	const authError = resultUrl.searchParams.get("error")
	if (authError) throw new CloudSyncError(`Google Drive: ${authError}`)
	const code = resultUrl.searchParams.get("code")
	if (!code) throw new CloudSyncError("Google Drive: no authorization code returned")

	const response = await fetch(TOKEN_URL, {
		method: "POST",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			code,
			code_verifier: codeVerifier,
			grant_type: "authorization_code",
			redirect_uri: redirectUri,
		}),
	})
	const data = await response.json()
	if (!response.ok || !data.refresh_token) {
		throw new CloudSyncError(`Google Drive: token exchange failed (${data.error ?? response.status})`)
	}
	return {
		refreshToken: data.refresh_token,
		accessToken: data.access_token,
		accessTokenExpiresAt: Date.now() + data.expires_in * 1000,
	}
}

export async function refreshGoogleDriveAccessToken(
	clientId: string,
	clientSecret: string,
	refreshToken: string,
): Promise<{ accessToken: string; accessTokenExpiresAt: number }> {
	const response = await fetch(TOKEN_URL, {
		method: "POST",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			refresh_token: refreshToken,
			grant_type: "refresh_token",
		}),
	})
	const data = await response.json()
	if (!response.ok) throw new CloudSyncError(`Google Drive: token refresh failed (${data.error ?? response.status})`)
	return { accessToken: data.access_token, accessTokenExpiresAt: Date.now() + data.expires_in * 1000 }
}

export async function findGoogleDriveFileId(accessToken: string): Promise<string | null> {
	const url = new URL(`${API_BASE}/files`)
	url.searchParams.set("spaces", "appDataFolder")
	url.searchParams.set("q", `name='${GOOGLE_DRIVE_FILE_NAME}' and trashed=false`)
	url.searchParams.set("fields", "files(id)")
	const response = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } })
	if (!response.ok) throw new CloudSyncError(`Google Drive: file lookup failed (${response.status})`)
	const data = await response.json()
	return data.files?.[0]?.id ?? null
}

export async function downloadGoogleDriveFile(accessToken: string, fileId: string): Promise<CloudSyncPayload> {
	const response = await fetch(`${API_BASE}/files/${fileId}?alt=media`, {
		headers: { Authorization: `Bearer ${accessToken}` },
	})
	if (!response.ok) throw new CloudSyncError(`Google Drive: download failed (${response.status})`)
	return response.json()
}

export async function uploadGoogleDriveFile(
	accessToken: string,
	fileId: string | null,
	payload: CloudSyncPayload,
): Promise<string> {
	const body = JSON.stringify(payload)
	if (fileId) {
		const response = await fetch(`${UPLOAD_BASE}/files/${fileId}?uploadType=media`, {
			method: "PATCH",
			headers: { Authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
			body,
		})
		if (!response.ok) throw new CloudSyncError(`Google Drive: upload failed (${response.status})`)
		return fileId
	}

	const boundary = "hidden_titles_sync_boundary"
	const metadata = JSON.stringify({ name: GOOGLE_DRIVE_FILE_NAME, parents: ["appDataFolder"] })
	const multipartBody =
		`--${boundary}\r\ncontent-type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
		`--${boundary}\r\ncontent-type: application/json\r\n\r\n${body}\r\n--${boundary}--`
	const response = await fetch(`${UPLOAD_BASE}/files?uploadType=multipart`, {
		method: "POST",
		headers: { Authorization: `Bearer ${accessToken}`, "content-type": `multipart/related; boundary=${boundary}` },
		body: multipartBody,
	})
	if (!response.ok) throw new CloudSyncError(`Google Drive: file creation failed (${response.status})`)
	const data = await response.json()
	return data.id
}
