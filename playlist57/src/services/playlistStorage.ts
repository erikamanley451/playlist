import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ITunesMediaItem } from "./itunesService";

export type StoredPlaylist = {
  id: string;
  name: string;
  songs: ITunesMediaItem[];
};

export const playlistStorageKey = (uid: string) => `playlists:${uid}`;

export const loadPlaylists = async (uid: string): Promise<StoredPlaylist[]> => {
  const stored = await AsyncStorage.getItem(playlistStorageKey(uid));
  return stored ? JSON.parse(stored) : [];
};

export const savePlaylists = async (uid: string, playlists: StoredPlaylist[]) => {
  await AsyncStorage.setItem(playlistStorageKey(uid), JSON.stringify(playlists));
};

export const createPlaylist = (name: string, firstItem?: ITunesMediaItem | null): StoredPlaylist => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  name: name.trim(),
  songs: firstItem ? [firstItem] : [],
});