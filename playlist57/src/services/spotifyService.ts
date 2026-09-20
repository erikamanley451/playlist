import { Buffer } from "buffer";

const SPOTIFY_CLIENT_ID = '';
const SPOTIFY_CLIENT_SECRET = '';
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;


// Internal function to fetch new token
async function fetchNewToken(): Promise<string | null> {
  try {
    console.log("Fetching new Spotify Token...");

    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64"),
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      console.error("Token request failed:", response.statusText);
      return null;
    }

    const data = await response.json();
    if (data.access_token) {
      cachedToken = data.access_token;
      tokenExpiresAt = Date.now() + data.expires_in * 1000 - 60_000; // buffer before expiry
      return cachedToken;
    }

    return null;
  } catch (error) {
    console.error("Error fetching new token:", error);
    return null;
  }
}

// Public function to get a valid token
async function getSpotifyToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }
  return await fetchNewToken();
}

// Generic fetch helper
async function fetchSpotify(endpoint: string): Promise<any> {
  const token = await getSpotifyToken();
  if (!token) return null;

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error(`Failed to fetch ${endpoint}:`, response.statusText);
    return null;
  }

  return await response.json();
}

// Specific API functions
export async function fetchSongs(offset: number = 0, limit: number = 50) {
  const data = await fetchSpotify(`https://api.spotify.com/v1/search?q=year%3A1995-2025&type=track&limit=${limit}&offset=${offset}`);
  // const data = await fetchSpotify(`https://api.spotify.com/v1/search?q=isrc&type=track&limit=${limit}&offset=${offset}`);
  // const data = await fetchSpotify("https://api.spotify.com/v1/search?q=country%3DUS&type=track&limit=50");
  // return data?.tracks?.items || [];
  console.log("Songs: ", data)
  return {
    tracks: data?.tracks?.items || [],
    total: data?.tracks?.total || [],
  };
}

//async function to fetch podcasts based on category
export async function fetchPodcasts(category = "Comedy", offset = 0, limit = 50) {
  const query = category === "Categories..." ? "Comedy" : category; // default to Comedy if "Categories..." is selected

  //Spotify API request
  const data = await fetchSpotify(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=show&limit=${limit}&offset=${offset}`);

  //to determine category of fetched podcasts
  console.log("Fetching Podcasts for Category:", query);

  return {
    //return list and total of podcasts that match
    tracks: data?.shows?.items || [],
    total: data?.shows?.total || [],
  };
}

export async function fetchPodcastEpisodes(podcastId, offset: number = 0, limit: number = 50) {
  const data = await fetchSpotify(`https://api.spotify.com/v1/shows/${podcastId}/episodes?limit=${limit}&offset=${offset}`);
  // return data?.items || [];
  console.log("Podcast Episodes: ", data)
  return {
      tracks: data?.items || [],
      total: data?.total || [],
    };
}

export async function fetchAudiobooks(offset: number = 0, limit: number = 50) {
  const data = await fetchSpotify(`https://api.spotify.com/v1/search?q=comedy&type=audiobook&limit=${limit}&offset=${offset}`);
  // return data?.audiobooks?.items || [];
  console.log("Audiobooks: ", data)
  return {
    tracks: data?.audiobooks?.items || [],
    total: data?.audiobooks?.total || [],
  };
}

export async function fetchAudiobookChapter(audiobookId, offset: number = 0, limit: number = 50) {
  const data = await fetchSpotify(`https://api.spotify.com/v1/audiobooks/${audiobookId}/chapters?limit=${limit}&offset=${offset}`);
  // return data?.items || [];
  console.log("Audiobook Chapters: ", data)
    return {
        tracks: data?.items || [],
        total: data?.total || [],
      };
}

export async function fetchCategories() {
  const data = await fetchSpotify("https://api.spotify.com/v1/browse/categories?country=US&limit=50");
  return data?.categories?.items || [];
}

export async function fetchCategoricalPlaylist(category: string) {
  const encodedCategory = encodeURIComponent(category);
  const data = await fetchSpotify(`https://api.spotify.com/v1/search?q=${encodedCategory}&type=playlist`);
  return data?.playlists?.items?.filter((item: any) => item !== null) || [];
}

export async function fetchRelatedArtistTracks(trackId: string){
  const token = await getSpotifyToken();
  const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {headers: { Authorization: `Bearer ${token}` },});

  const data = await response.json();

  const responseTracks = await fetch(`https://api.spotify.com/v1/artists/${data.artists[0].id}/top-tracks`, {headers: { Authorization: `Bearer ${token}` },});

  const artistTracks = await responseTracks.json();
  return artistTracks.tracks;
}
