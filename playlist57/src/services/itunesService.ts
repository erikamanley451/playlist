export type MediaKind = "song" | "audiobook" | "podcast" | "podcastEpisode" | "video";

export type ITunesMediaItem = {
  id: string;
  mediaType: MediaKind;
  title: string;
  creator: string;
  artworkUrl: string | null;
  audioUrl: string | null;
  externalUrl: string | null;
  description: string;
  durationMs: number | null;
  collectionId?: string;
  feedUrl?: string | null;
  episodeCount?: number;
  releaseDate?: string | null;
  videoId?: string;
};

const SEARCH_URL = "https://itunes.apple.com/search";

const getResults = (data: any): any[] =>
  Array.isArray(data?.results) ? data.results : [];

const request = async (params: Record<string, string | number>) => {
  const allParams: Record<string, string | number> = {
    country: "US",
    limit: 50,
    ...params,
  };
  const queryParts: string[] = [];

  for (const key in allParams) {
    queryParts.push(
      `${key}=${encodeURIComponent(String(allParams[key]))}`
    );
  }

  const query = queryParts.join("&");

  const response = await fetch(`${SEARCH_URL}?${query}`);
  if (!response.ok) throw new Error(`iTunes request failed: ${response.status}`);
  return response.json();
};

const largerArtwork = (url?: string) =>
  url?.replace("100x100bb", "600x600bb").replace("100x100", "600x600") ?? null;

const normalizeSong = (item: any): ITunesMediaItem => ({
  id: String(item.trackId),
  mediaType: "song",
  title: item.trackName ?? "Untitled",
  creator: item.artistName ?? "Unknown Artist",
  artworkUrl: largerArtwork(item.artworkUrl100),
  audioUrl: item.previewUrl ?? null,
  externalUrl: item.trackViewUrl ?? null,
  description: item.collectionName ?? "",
  durationMs: item.trackTimeMillis ?? null,
  collectionId: item.collectionId ? String(item.collectionId) : undefined,
  releaseDate: item.releaseDate ?? null,
});

export const fetchSongs = async (term: string): Promise<ITunesMediaItem[]> => {
  const cleanTerm = term.trim();
  if (!cleanTerm) return [];

  const data = await request({ term: cleanTerm, media: "music", entity: "song" });
  return getResults(data).map((item: any) => normalizeSong(item));
};

export const fetchTopSongs = async (): Promise<ITunesMediaItem[]> => {
  const chartResponse = await fetch(
    "https://rss.marketingtools.apple.com/api/v2/us/music/most-played/50/songs.json"
  );

  if (!chartResponse.ok) {
    throw new Error(`Apple chart request failed: ${chartResponse.status}`);
  }

  const chartData = await chartResponse.json();
  const chartResults: any[] = Array.isArray(chartData?.feed?.results)
    ? chartData.feed.results
    : [];

  if (chartResults.length === 0) {
    throw new Error("Apple chart response did not contain any songs.");
  }

  const ids = chartResults
    .map((item: any) => item?.id)
    .filter((id: any) => id !== undefined && id !== null)
    .map((id: any) => String(id));

  if (ids.length === 0) return [];

  // Use small batches so the lookup URL remains reliable on mobile networks.
  const batches: string[][] = [];
  for (let index = 0; index < ids.length; index += 25) {
    batches.push(ids.slice(index, index + 25));
  }

  const songsById: Record<string, ITunesMediaItem> = {};

  // Process batches one at a time. This is more reliable in React Native and
  // prevents one malformed lookup response from discarding the whole chart.
  for (const batch of batches) {
    try {
      const response = await fetch(
        `https://itunes.apple.com/lookup?id=${batch.join(",")}&entity=song&country=US`
      );

      if (!response.ok) {
        throw new Error(`iTunes lookup failed: ${response.status}`);
      }

      const data = await response.json();
      getResults(data)
      .filter((item: any) => item.wrapperType === "track" && item.trackId)
      .forEach((item: any) => {
        songsById[String(item.trackId)] = normalizeSong(item);
      });
    } catch (error) {
      console.warn("A top-song preview batch could not be loaded:", error);
    }
  }

  // Preserve Apple's ranking. When lookup enrichment fails, keep the chart
  // metadata and simply omit the play button by setting audioUrl to null.
  return chartResults.map((chartItem: any): ITunesMediaItem => {
    const id = String(chartItem?.id ?? "");
    const enrichedSong = songsById[id];

    if (enrichedSong) return enrichedSong;

    return {
      id,
      mediaType: "song",
      title: chartItem?.name ?? "Untitled",
      creator: chartItem?.artistName ?? "Unknown Artist",
      artworkUrl: largerArtwork(chartItem?.artworkUrl100),
      audioUrl: null,
      externalUrl: chartItem?.url ?? null,
      description: "",
      durationMs: null,
      releaseDate: chartItem?.releaseDate ?? null,
    };
  });
};

export const fetchAudiobooks = async (term: string): Promise<ITunesMediaItem[]> => {
  const data = await request({ term: term || "bestsellers", media: "audiobook" });
  return getResults(data).map((item: any) => ({
    id: String(item.collectionId),
    mediaType: "audiobook" as const,
    title: item.collectionName ?? "Untitled Audiobook",
    creator: item.artistName ?? "Unknown Author",
    artworkUrl: largerArtwork(item.artworkUrl100),
    audioUrl: item.previewUrl ?? null,
    externalUrl: item.collectionViewUrl ?? null,
    description: item.description ?? "",
    durationMs: null,
    collectionId: String(item.collectionId),
    releaseDate: item.releaseDate ?? null,
  }));
};

export const fetchPodcasts = async (term: string): Promise<ITunesMediaItem[]> => {
  const data = await request({ term: term || "popular", media: "podcast", entity: "podcast" });
  return getResults(data).map((item: any) => ({
    id: String(item.collectionId),
    mediaType: "podcast" as const,
    title: item.collectionName ?? "Untitled Podcast",
    creator: item.artistName ?? "Unknown Publisher",
    artworkUrl: largerArtwork(item.artworkUrl600 ?? item.artworkUrl100),
    audioUrl: null,
    externalUrl: item.collectionViewUrl ?? null,
    description: item.genres?.join(" • ") ?? "",
    durationMs: null,
    collectionId: String(item.collectionId),
    feedUrl: item.feedUrl ?? null,
    episodeCount: item.trackCount ?? 0,
    releaseDate: item.releaseDate ?? null,
  }));
};

export const fetchPodcastEpisodes = async (
  podcast: ITunesMediaItem
): Promise<ITunesMediaItem[]> => {
  const data = await request({
    term: podcast.title,
    media: "podcast",
    entity: "podcastEpisode",
    limit: 200,
  });

  return getResults(data)
    .filter((item: any) => String(item.collectionId) === String(podcast.collectionId ?? podcast.id))
    .map((item: any) => ({
      id: String(item.episodeGuid ?? item.trackId),
      mediaType: "podcastEpisode" as const,
      title: item.trackName ?? "Untitled Episode",
      creator: item.collectionName ?? podcast.creator,
      artworkUrl: largerArtwork(item.artworkUrl600 ?? item.artworkUrl100) ?? podcast.artworkUrl,
      audioUrl: item.episodeUrl ?? item.previewUrl ?? null,
      externalUrl: item.episodeContentLink ?? item.trackViewUrl ?? podcast.externalUrl,
      description: item.description ?? item.shortDescription ?? "",
      durationMs: item.trackTimeMillis ?? null,
      collectionId: String(item.collectionId),
      releaseDate: item.releaseDate ?? null,
    }));
};