export async function fetchPosterInfo(
	title: string,
	mediaType: MediaType,
): Promise<{ posterPath: string | null; mediaType: MediaType } | null> {
	const locale = navigator?.language || "en-US"
	const queryType = mediaType ?? "multi"
	const url = `https://api.themoviedb.org/3/search/${queryType}?query=${encodeURIComponent(title)}&include_adult=false&language=${locale}&page=1`
	try {
		const response = await fetch(url, {
			method: "GET",
			headers: {
				accept: "application/json",
				Authorization: `Bearer ${__TMDB_TOKEN__}`,
			},
		})
		const data = await response.json()
		const movie = data?.results?.filter((item: { media_type?: string }) => item.media_type?.toLowerCase() !== "person")?.[0]
		if (!movie) return null
		return {
			posterPath: movie.poster_path ?? null,
			mediaType: mediaType ?? (movie.media_type as MediaType) ?? null,
		}
	} catch (error) {
		console.error("fetchPosterInfo failed", title, error)
		return null
	}
}