export const EXTRACTOR_VERSION: number;
export function extractKeywords(text: string): string[];
export function filterArtworks<T extends { tags: string[] }>(artworks: T[], selectedTags: string[]): T[];
