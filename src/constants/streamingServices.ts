export const streamingServices = ["Amazon", "Netflix", "Disney", "Crunchyroll", "HBO", "Paramount"] as const

export type StreamingService = (typeof streamingServices)[number]
