import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "./firebase";
import type { ITunesMediaItem } from "./itunesService";

export type SharedPlaylistItem = {
  id: string;
  mediaType: ITunesMediaItem["mediaType"];
  title: string;
  creator: string;
  artworkUrl: string | null;
  externalUrl: string | null;
};

const getShareableUrl = (
  item: ITunesMediaItem
): string | null => {
  if (item.externalUrl) {
    return item.externalUrl;
  }

  if (item.mediaType === "video" && item.videoId) {
    return `https://www.youtube.com/watch?v=${item.videoId}`;
  }

  return null;
};

/*
 * Each private playlist receives one predictable shared document.
 * Sharing again updates the existing document instead of creating
 * another Firestore document.
 */
const getShareId = (
  ownerId: string,
  playlistId: string
) => `${ownerId}_${playlistId}`;

export const publishPlaylist = async ({
  ownerId,
  playlistId,
  playlistName,
  items,
}: {
  ownerId: string;
  playlistId: string;
  playlistName: string;
  items: ITunesMediaItem[];
}) => {
  const shareId = getShareId(ownerId, playlistId);

  const safeItems: SharedPlaylistItem[] = items
    .slice(0, 250)
    .map((item) => ({
      id: String(item.id),
      mediaType: item.mediaType,
      title: item.title,
      creator: item.creator,
      artworkUrl: item.artworkUrl ?? null,
      externalUrl: getShareableUrl(item),
    }));

  const sharedPlaylistReference = doc(
    db,
    "sharedPlaylists",
    shareId
  );

  /*
   * A get for a document that does not exist can be rejected by
   * security rules. Treat that as a new shared playlist.
   */
  const existingSnapshot = await getDoc(
    sharedPlaylistReference
  ).catch(() => null);

  await setDoc(
    sharedPlaylistReference,
    {
      ownerId,
      sourcePlaylistId: playlistId,
      name: playlistName,
      items: safeItems,
      published: true,

      ...(!existingSnapshot?.exists()
        ? {
            createdAt: serverTimestamp(),
          }
        : {}),

      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    }
  );

  return shareId;
};

export const isPlaylistShared = async ({
  ownerId,
  playlistId,
}: {
  ownerId: string;
  playlistId: string;
}) => {
  try {
    const shareId = getShareId(ownerId, playlistId);

    const snapshot = await getDoc(
      doc(db, "sharedPlaylists", shareId)
    );

    return (
      snapshot.exists() &&
      snapshot.data().published === true
    );
  } catch {
    return false;
  }
};

export const unsharePlaylist = async ({
  ownerId,
  playlistId,
}: {
  ownerId: string;
  playlistId: string;
}) => {
  const shareId = getShareId(ownerId, playlistId);

  await deleteDoc(
    doc(db, "sharedPlaylists", shareId)
  );
};