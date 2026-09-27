import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  doc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type { ITunesMediaItem } from "./itunesService";

export type StoredPlaylist = {
  id: string;
  name: string;
  songs: ITunesMediaItem[];
};

export const playlistStorageKey = (uid: string) => `playlists:${uid}`;
const playlistMigrationKey = (uid: string) => `playlists:migrated:${uid}`;
const playlistSyncPendingKey = (uid: string) =>
  `playlists:sync-pending:${uid}`;

const playlistsCollection = (uid: string) =>
  collection(db, "users", uid, "playlists");

const removeUndefined = <T>(value: T): T =>
  JSON.parse(JSON.stringify(value)) as T;

const readCachedPlaylists = async (
  uid: string
): Promise<StoredPlaylist[]> => {
  const stored = await AsyncStorage.getItem(playlistStorageKey(uid));
  return stored ? JSON.parse(stored) : [];
};

export const loadPlaylists = async (uid: string): Promise<StoredPlaylist[]> => {
  const cachedPlaylists = await readCachedPlaylists(uid);
  const hasMigrated =
    (await AsyncStorage.getItem(playlistMigrationKey(uid))) === "true";
  const hasPendingChanges =
    (await AsyncStorage.getItem(playlistSyncPendingKey(uid))) === "true";

  // Retry local changes that were made while Firestore was unavailable.
  if (hasPendingChanges) {
    await savePlaylists(uid, cachedPlaylists);
    return cachedPlaylists;
  }

  try {
    const snapshot = await getDocs(playlistsCollection(uid));

    const firestorePlaylists = snapshot.docs
      .map((playlistDocument) => {
        const data = playlistDocument.data();

        return {
          id: playlistDocument.id,
          name: typeof data.name === "string" ? data.name : "Untitled Playlist",
          songs: Array.isArray(data.songs) ? data.songs : [],
          position: typeof data.position === "number" ? data.position : 0,
        };
      })
      .sort((first, second) => first.position - second.position)
      .map(({ position, ...playlist }) => playlist as StoredPlaylist);

    // On the first Firestore-enabled launch, preserve existing local playlists.
    if (
      !hasMigrated &&
      firestorePlaylists.length === 0 &&
      cachedPlaylists.length > 0
    ) {
      await savePlaylists(uid, cachedPlaylists);
      return cachedPlaylists;
    }

    await AsyncStorage.setItem(
      playlistStorageKey(uid),
      JSON.stringify(firestorePlaylists)
    );
    await AsyncStorage.setItem(playlistMigrationKey(uid), "true");

    return firestorePlaylists;
  } catch (error) {
    console.warn("Using cached playlists because Firestore is unavailable:", error);
    return cachedPlaylists;
  }
};

export const savePlaylists = async (
  uid: string,
  playlists: StoredPlaylist[]
) => {
  // Update the device cache immediately for responsive/offline behavior.
  await AsyncStorage.setItem(
    playlistStorageKey(uid),
    JSON.stringify(playlists)
  );
  await AsyncStorage.setItem(playlistSyncPendingKey(uid), "true");

  try {
    const playlistCollection = playlistsCollection(uid);
    const currentSnapshot = await getDocs(playlistCollection);
    const currentIds = new Set(
      currentSnapshot.docs.map((playlistDocument) => playlistDocument.id)
    );
    const savedIds = new Set(playlists.map((playlist) => playlist.id));
    const batch = writeBatch(db);

    playlists.forEach((playlist, position) => {
      batch.set(
          doc(playlistCollection, playlist.id),
          removeUndefined({
            name: playlist.name,
            songs: playlist.songs,
            position,
          })
        );
    });

    [...currentIds]
      .filter((playlistId) => !savedIds.has(playlistId))
      .forEach((playlistId) => {
        batch.delete(doc(playlistCollection, playlistId));
      });

    await batch.commit();
    await AsyncStorage.setItem(playlistMigrationKey(uid), "true");
    await AsyncStorage.setItem(playlistSyncPendingKey(uid), "false");
  } catch (error) {
    console.warn(
      "Playlists were saved locally but could not sync with Firestore:",
      error
    );
  }
};

export const createPlaylist = (name: string, firstItem?: ITunesMediaItem | null): StoredPlaylist => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  name: name.trim(),
  songs: firstItem ? [firstItem] : [],
});
