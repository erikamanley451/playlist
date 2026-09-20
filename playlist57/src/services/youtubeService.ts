
const YOUTUBE_API_KEY =
  process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;

const YOUTUBE_SEARCH_URL =
  "https://www.googleapis.com/youtube/v3/search";

const YOUTUBE_VIDEOS_URL =
  "https://www.googleapis.com/youtube/v3/videos";

// Generic fetch function
async function fetchYouTube(endpoint: string): Promise<any> {
  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      console.error(
        `Failed to fetch ${endpoint}:`,
        response.status,
        response.statusText
      );
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching YouTube data:", error);
    return null;
  }
}

// Search YouTube videos
export async function fetchVideos(
  query: string,
  maxResults: number = 20,
  pageToken: string = ""
) {
  const encodedQuery = encodeURIComponent(query);

  const url =
    `${YOUTUBE_SEARCH_URL}?part=snippet` +
    `&type=video` +
    `&q=${encodedQuery}` +
    `&maxResults=${maxResults}` +
    `&pageToken=${pageToken}` +
    `&regionCode=US` +
    `&key=${YOUTUBE_API_KEY}`;

  const data = await fetchYouTube(url);

  console.log("YouTube Search Videos:", data);

  return {
    videos: data?.items || [],
    nextPageToken: data?.nextPageToken || null,
  };
}

// Get general/popular YouTube videos
export async function fetchPopularVideos(
  maxResults: number = 20,
  pageToken: string = ""
) {
  const url =
    `${YOUTUBE_VIDEOS_URL}?part=snippet,contentDetails,statistics` +
    `&chart=mostPopular` +
    `&maxResults=${maxResults}` +
    `&pageToken=${pageToken}` +
    `&regionCode=US` +
    `&key=${YOUTUBE_API_KEY}`;

  const data = await fetchYouTube(url);

  console.log("Popular YouTube Videos:", data);

  return {
    videos: data?.items || [],
    nextPageToken: data?.nextPageToken || null,
  };
}

