import {
    addDoc,
    collection,
    serverTimestamp,
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

export const publishPlaylist = async ({
  ownerId,
  playlistName,
  items,
}: {
  ownerId: string;
  playlistName: string;
  items: ITunesMediaItem[];
}) => {
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

  const documentReference = await addDoc(
    collection(db, "sharedPlaylists"),
    {
      ownerId,
      name: playlistName,
      items: safeItems,
      published: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );

  return documentReference.id;
};