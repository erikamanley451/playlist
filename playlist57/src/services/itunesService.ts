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
const CACHE_MS = 10 * 60 * 1000;

let topSongsCache: { songs: ITunesMediaItem[]; savedAt: number } | null = null;
let topPodcastsCache: { podcasts: ITunesMediaItem[]; savedAt: number } | null = null;

const getResults = (data: any): any[] =>
  Array.isArray(data?.results) ? data.results : [];

const request = async (params: Record<string, string | number>) => {
  const allParams: Record<string, string | number> = {
    country: "US",
    limit: 50,
    ...params,
  };
  const query = Object.entries(allParams)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join("&");

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

const normalizePodcast = (item: any): ITunesMediaItem => ({
  id: String(item.collectionId),
  mediaType: "podcast",
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
});

export const fetchSongs = async (term: string): Promise<ITunesMediaItem[]> => {
  const cleanTerm = term.trim();
  if (!cleanTerm) return [];
  const data = await request({ term: cleanTerm, media: "music", entity: "song" });
  return getResults(data).map(normalizeSong);
};

export const fetchTopSongs = async (): Promise<ITunesMediaItem[]> => {
  if (topSongsCache && Date.now() - topSongsCache.savedAt < CACHE_MS) {
    return topSongsCache.songs;
  }

  const chartLimits = [50, 20, 10];
  let chartResults: any[] = [];
  let lastChartError: unknown = null;

  for (const limit of chartLimits) {
    try {
      const response = await fetch(
        `https://rss.marketingtools.apple.com/api/v2/us/music/most-played/${limit}/songs.json`
      );
      if (!response.ok) throw new Error(`Apple chart request failed: ${response.status}`);
      const data = await response.json();
      chartResults = Array.isArray(data?.feed?.results) ? data.feed.results : [];
      if (chartResults.length > 0) break;
    } catch (error) {
      lastChartError = error;
      console.warn(`Top ${limit} chart request failed:`, error);
    }
  }

  if (chartResults.length === 0) {
    if (topSongsCache) return topSongsCache.songs;
    console.warn("Apple charts are unavailable; using iTunes search results.", lastChartError);
    return fetchSongs("popular hits");
  }

  const ids = chartResults
    .map((item: any) => item?.id)
    .filter((id: any) => id !== undefined && id !== null)
    .map(String);

  const songsById: Record<string, ITunesMediaItem> = {};
  for (let index = 0; index < ids.length; index += 25) {
    const batch = ids.slice(index, index + 25);
    try {
      const response = await fetch(
        `https://itunes.apple.com/lookup?id=${batch.join(",")}&entity=song&country=US`
      );
      if (!response.ok) throw new Error(`iTunes lookup failed: ${response.status}`);
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

  const songs = chartResults.map((item: any): ITunesMediaItem => {
    const id = String(item?.id ?? "");
    return songsById[id] ?? {
      id,
      mediaType: "song",
      title: item?.name ?? "Untitled",
      creator: item?.artistName ?? "Unknown Artist",
      artworkUrl: largerArtwork(item?.artworkUrl100),
      audioUrl: null,
      externalUrl: item?.url ?? null,
      description: "",
      durationMs: null,
      releaseDate: item?.releaseDate ?? null,
    };
  });

  topSongsCache = { songs, savedAt: Date.now() };
  return songs;
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
  const cleanTerm = term.trim();
  if (!cleanTerm) return [];
  const data = await request({ term: cleanTerm, media: "podcast", entity: "podcast" });
  return getResults(data).map(normalizePodcast);
};

export const fetchPodcastsByGenre = async (
  genreId: number
): Promise<ITunesMediaItem[]> => {
  const data = await request({
    term: genreId,
    media: "podcast",
    entity: "podcast",
    attribute: "genreIndex",
  });
  return getResults(data).map(normalizePodcast);
};

export const fetchTopPodcasts = async (): Promise<ITunesMediaItem[]> => {
  if (topPodcastsCache && Date.now() - topPodcastsCache.savedAt < CACHE_MS) {
    return topPodcastsCache.podcasts;
  }

  try {
    const response = await fetch(
      "https://rss.marketingtools.apple.com/api/v2/us/podcasts/top/50/podcasts.json"
    );
    if (!response.ok) {
      throw new Error(`Apple podcast chart failed: ${response.status}`);
    }

    const data = await response.json();
    const chartResults = Array.isArray(data?.feed?.results) ? data.feed.results : [];
    const podcasts = chartResults.map((item: any): ITunesMediaItem => ({
      id: String(item.id),
      mediaType: "podcast",
      title: item.name ?? "Untitled Podcast",
      creator: item.artistName ?? "Unknown Publisher",
      artworkUrl: largerArtwork(item.artworkUrl100),
      audioUrl: null,
      externalUrl: item.url ?? null,
      description: Array.isArray(item.genres)
        ? item.genres.map((genre: any) => genre.name).join(" • ")
        : "",
      durationMs: null,
      collectionId: String(item.id),
      feedUrl: null,
      episodeCount: 0,
      releaseDate: null,
    }));

    topPodcastsCache = { podcasts, savedAt: Date.now() };
    return podcasts;
  } catch (error) {
    console.warn("Top Shows could not be loaded:", error);
    if (topPodcastsCache) return topPodcastsCache.podcasts;
    return fetchPodcasts("podcast");
  }
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
    .filter(
      (item: any) =>
        String(item.collectionId) === String(podcast.collectionId ?? podcast.id)
    )
    .map((item: any) => ({
      id: String(item.episodeGuid ?? item.trackId),
      mediaType: "podcastEpisode" as const,
      title: item.trackName ?? "Untitled Episode",
      creator: item.collectionName ?? podcast.creator,
      artworkUrl:
        largerArtwork(item.artworkUrl600 ?? item.artworkUrl100) ?? podcast.artworkUrl,
      audioUrl: item.episodeUrl ?? item.previewUrl ?? null,
      externalUrl:
        item.episodeContentLink ?? item.trackViewUrl ?? podcast.externalUrl,
      description: item.description ?? item.shortDescription ?? "",
      durationMs: item.trackTimeMillis ?? null,
      collectionId: String(item.collectionId),
      releaseDate: item.releaseDate ?? null,
    }));
};