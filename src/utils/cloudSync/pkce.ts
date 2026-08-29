function base64UrlEncode(bytes: Uint8Array): string {
	let binary = ""
	for (const byte of bytes) binary += String.fromCharCode(byte)
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function randomBytes(length: number): Uint8Array {
	const bytes = new Uint8Array(length)
	crypto.getRandomValues(bytes)
	return bytes
}

export function generateCodeVerifier(): string {
	return base64UrlEncode(randomBytes(64))
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))
	return base64UrlEncode(new Uint8Array(digest))
}

export function generateState(): string {
	return base64UrlEncode(randomBytes(16))
}
