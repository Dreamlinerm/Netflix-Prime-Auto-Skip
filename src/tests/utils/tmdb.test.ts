import { beforeEach, describe, expect, it, vi } from "vitest"
import { fetchPosterInfo } from "../../utils/tmdb"
beforeEach(() => vi.stubGlobal("fetch", vi.fn()))
describe("poster lookup", () => {
	it("falls back to English without a browser language", async () => {
		const language = vi.spyOn(navigator, "language", "get").mockReturnValue("")
		vi.mocked(fetch).mockResolvedValue({ json: async () => ({ results: [] }) } as Response)
		await fetchPosterInfo("Title", null)
		expect(fetch).toHaveBeenCalledWith(expect.stringContaining("language=en-US"), expect.anything())
		language.mockRestore()
	})
	it("encodes the title and excludes people before selecting a result", async () => {
		vi.mocked(fetch).mockResolvedValue({
			json: async () => ({ results: [{ media_type: "person" }, { poster_path: "/poster", media_type: "tv" }] }),
		} as Response)
		expect(await fetchPosterInfo("A & B?", null)).toEqual({ posterPath: "/poster", mediaType: "tv" })
		expect(fetch).toHaveBeenCalledWith(
			expect.stringContaining("query=A%20%26%20B%3F"),
			expect.objectContaining({
				method: "GET",
				headers: expect.objectContaining({ Authorization: "Bearer test-token" }),
			}),
		)
	})
	it.each(["tv", "movie"] as const)("preserves the explicit %s media type", async (type) => {
		vi.mocked(fetch).mockResolvedValue({ json: async () => ({ results: [{}] }) } as Response)
		expect(await fetchPosterInfo("Title", type)).toEqual({ posterPath: null, mediaType: type })
	})
	it("returns nullable values when the result has no poster or type", async () => {
		vi.mocked(fetch).mockResolvedValue({ json: async () => ({ results: [{}] }) } as Response)
		expect(await fetchPosterInfo("Title", null)).toEqual({ posterPath: null, mediaType: null })
	})
	it.each([undefined, null, {}, { results: [] }, { results: [{ media_type: "PERSON" }] }])(
		"handles missing results: %j",
		async (data) => {
			vi.mocked(fetch).mockResolvedValue({ json: async () => data } as Response)
			expect(await fetchPosterInfo("Title", null)).toBeNull()
		},
	)
	it("handles network errors", async () => {
		vi.mocked(fetch).mockRejectedValue(new Error("offline"))
		expect(await fetchPosterInfo("Title", null)).toBeNull()
	})
})
