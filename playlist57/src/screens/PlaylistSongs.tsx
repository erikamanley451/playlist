import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AudioPlayer from "../components/AudioPlayer";
import { auth } from "../services/firebase";
import type { ITunesMediaItem } from "../services/itunesService";
import type { StoredPlaylist } from "../services/playlistStorage";
import { loadPlaylists, savePlaylists } from "../services/playlistStorage";
import { styles } from "../styles/style";

const extractYouTubeVideoId = (value?: string | null): string | null => {
  if (!value) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;

  const storedIdMatch = value.match(/^youtube:([A-Za-z0-9_-]{11})$/);
  if (storedIdMatch) return storedIdMatch[1];

  const match = value.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?.*?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/
  );
  return match?.[1] ?? null;
};

const getYouTubeVideoId = (item: ITunesMediaItem): string | null => {
  if (item.mediaType !== "video") return null;

  return (
    extractYouTubeVideoId(item.videoId) ??
    extractYouTubeVideoId(item.id) ??
    extractYouTubeVideoId(item.externalUrl) ??
    extractYouTubeVideoId(item.audioUrl)
  );
};

const isPlayable = (item: ITunesMediaItem) =>
  Boolean(item.audioUrl || getYouTubeVideoId(item));

const PlaylistSongs = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const isFocused = useIsFocused();
  const { playlist } = route.params as { playlist?: string };

  const passedPlaylist = useMemo<StoredPlaylist | null>(() => {
    if (!playlist) return null;
    try {
      return JSON.parse(playlist);
    } catch {
      return null;
    }
  }, [playlist]);

  const [uid, setUid] = useState(auth.currentUser?.uid ?? null);
  const [songs, setSongs] = useState<ITunesMediaItem[]>([]);
  const [activeItem, setActiveItem] = useState<ITunesMediaItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const playableIndices = useMemo(
    () =>
      songs.reduce<number[]>((indices, item, index) => {
        if (isPlayable(item)) indices.push(index);
        return indices;
      }, []),
    [songs]
  );

  useEffect(
    () => onAuthStateChanged(auth, (user) => setUid(user?.uid ?? null)),
    []
  );

  useEffect(() => {
    if (!uid || !passedPlaylist) {
      setSongs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    loadPlaylists(uid)
      .then((all) => {
        const current =
          all.find((item) => item.id === passedPlaylist.id) ??
          all.find((item) => item.name === passedPlaylist.name);
        setSongs(current?.songs ?? []);
      })
      .catch((error) => {
        console.error("Failed to load playlist:", error);
        setSongs([]);
      })
      .finally(() => setLoading(false));
  }, [uid, passedPlaylist]);

  useEffect(() => {
    if (!isFocused) {
      setActiveItem(null);
      setCurrentIndex(null);
      setShuffleMode(false);
    }
  }, [isFocused]);

  const playableIndex = (start: number, direction: 1 | -1) => {
    for (
      let index = start + direction;
      index >= 0 && index < songs.length;
      index += direction
    ) {
      if (isPlayable(songs[index])) return index;
    }
    return null;
  };

  const playAt = (index: number) => {
    const item = songs[index];
    if (!item || !isPlayable(item)) return;
    setCurrentIndex(index);
    setActiveItem(item);
  };

  const playFromBeginning = () => {
    const firstPlayableIndex = playableIndices[0];
    if (firstPlayableIndex === undefined) return;

    setShuffleMode(false);
    playAt(firstPlayableIndex);
  };

  const randomPlayableIndex = (indexToExclude?: number | null) => {
    const choices = playableIndices.filter(
      (index) => index !== indexToExclude
    );

    if (choices.length === 0) {
      return playableIndices[0] ?? null;
    }

    return choices[Math.floor(Math.random() * choices.length)] ?? null;
  };

  const startShuffle = () => {
    const randomIndex = randomPlayableIndex(currentIndex);
    if (randomIndex === null) return;

    setShuffleMode(true);
    playAt(randomIndex);
  };

  const playNext = () => {
    if (currentIndex === null) return;

    const next = shuffleMode
      ? randomPlayableIndex(currentIndex)
      : playableIndex(currentIndex, 1);

    if (next !== null) playAt(next);
  };

  const playPrevious = () => {
    if (shuffleMode || currentIndex === null) return;

    const previous = playableIndex(currentIndex, -1);
    if (previous !== null) playAt(previous);
  };

  const closePlayer = () => {
    setActiveItem(null);
    setCurrentIndex(null);
    setShuffleMode(false);
  };

  const handleDelete = async (indexToRemove: number) => {
    if (!uid || !passedPlaylist) return;

    const updatedSongs = songs.filter((_, index) => index !== indexToRemove);
    const playlists = await loadPlaylists(uid);
    const updatedPlaylists = playlists.map((item) => {
      const matches = passedPlaylist.id
        ? item.id === passedPlaylist.id
        : item.name === passedPlaylist.name;
      return matches ? { ...item, songs: updatedSongs } : item;
    });

    await savePlaylists(uid, updatedPlaylists);
    setSongs(updatedSongs);

    if (currentIndex === indexToRemove) {
      closePlayer();
    } else if (currentIndex !== null && indexToRemove < currentIndex) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const activeYouTubeId = activeItem
    ? getYouTubeVideoId(activeItem)
    : null;

  const sourceProps = activeItem
    ? activeItem.mediaType === "song"
      ? {
          sourceAttribution: "Preview provided courtesy of iTunes",
          sourceLabel: "Apple Music",
          sourceUrl: activeItem.externalUrl,
        }
      : activeItem.mediaType === "audiobook"
        ? {
            sourceAttribution: "Preview provided by Apple",
            sourceLabel: "Apple Books",
            sourceUrl: activeItem.externalUrl,
          }
        : activeItem.mediaType === "video"
          ? {
              sourceLabel: "YouTube",
              sourceUrl: activeItem.externalUrl ?? activeItem.audioUrl,
            }
          : {
              sourceLabel: "Apple Podcasts",
              sourceUrl: activeItem.externalUrl,
            }
    : {};

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, localStyles.headerTitle]}
          numberOfLines={1}
        >
          {passedPlaylist?.name || "Playlist"}
        </Text>

        <View style={localStyles.headerActions}>
          <TouchableOpacity
            onPress={startShuffle}
            disabled={playableIndices.length === 0}
            style={[
              localStyles.headerActionButton,
              shuffleMode && localStyles.activeShuffleButton,
              playableIndices.length === 0 && localStyles.disabledButton,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Shuffle playlist"
          >
            <Ionicons name="shuffle" size={17} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={playFromBeginning}
            disabled={playableIndices.length === 0}
            style={[
              localStyles.headerActionButton,
              playableIndices.length === 0 && localStyles.disabledButton,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Play playlist from beginning"
          >
            <Ionicons name="play" size={17} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#1DB954"
          style={{ marginTop: 50 }}
        />
      ) : songs.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 50 }}>
          No media in this playlist.
        </Text>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            activeItem
              ? { paddingBottom: activeYouTubeId ? 470 : 200 }
              : undefined
          }
          renderItem={({ item, index }) => (
            <View style={styles.songCard}>
              {item.artworkUrl && (
                <Image
                  source={{ uri: item.artworkUrl }}
                  style={styles.songImage}
                />
              )}
              <View style={styles.songDetails}>
                <Text style={styles.songTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.songArtist} numberOfLines={1}>
                  {item.creator}
                </Text>
              </View>

              {isPlayable(item) && (
                <TouchableOpacity
                  onPress={() => {
                    setShuffleMode(false);
                    playAt(index);
                  }}
                >
                  <Ionicons
                    name="play-circle"
                    size={28}
                    color="#1DB954"
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={() => void handleDelete(index)}>
                <Ionicons name="trash" size={24} color="red" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {isFocused &&
        activeItem &&
        currentIndex !== null &&
        (activeItem.audioUrl || activeYouTubeId) && (
          <AudioPlayer
            key={`${activeItem.mediaType}:${activeItem.id}`}
            previewUrl={
              activeItem.mediaType === "video"
                ? ""
                : activeItem.audioUrl ?? ""
            }
            youtubeVideoId={activeYouTubeId}
            songName={activeItem.title}
            artistName={activeItem.creator}
            onClose={closePlayer}
            onNext={playNext}
            onPrevious={playPrevious}
            disableNext={
              shuffleMode
                ? playableIndices.length <= 1
                : playableIndex(currentIndex, 1) === null
            }
            disablePrevious={
              shuffleMode || playableIndex(currentIndex, -1) === null
            }
            {...sourceProps}
          />
        )}
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  headerTitle: {
    flex: 1,
    marginRight: 8,
  },
  headerActions: {
    marginLeft: "auto",
    marginRight: 16, 
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1DB954",
    alignItems: "center",
    justifyContent: "center",
  },
  activeShuffleButton: {
    backgroundColor: "#159447",
  },
  disabledButton: {
    backgroundColor: "#A7A7A7",
  },
});

export default PlaylistSongs;










