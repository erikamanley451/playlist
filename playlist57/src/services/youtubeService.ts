const YOUTUBE_API_KEY = '';
const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

// Generic fetch function
async function fetchYouTube(endpoint: string): Promise<any> {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      console.error(`Failed to fetch ${endpoint}:`, response.statusText);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching YouTube data:", error);
    return null;
  }
}

export async function fetchVideos(query: string, maxResults: number = 20, pageToken: string = '') {
  const encodedQuery = encodeURIComponent(query);
  const url = `${YOUTUBE_SEARCH_URL}?part=snippet&type=video&q=${encodedQuery}&maxResults=${maxResults}&pageToken=${pageToken}&regionCode=US&key=${YOUTUBE_API_KEY}`;

  const data = await fetchYouTube(url);

  console.log("Videos: ", data);

  return {
    videos: data?.items || [],
    nextPageToken: data?.nextPageToken || null,
  };
}
