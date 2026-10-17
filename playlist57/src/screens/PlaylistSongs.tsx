import { Ionicons } from "@expo/vector-icons";
import {
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import AudioPlayer from "../components/AudioPlayer";
import { auth } from "../services/firebase";
import type { ITunesMediaItem } from "../services/itunesService";
import {
  isPlaylistShared,
  publishPlaylist,
  unsharePlaylist,
} from "../services/playlistSharing";
import type { StoredPlaylist } from "../services/playlistStorage";
import {
  loadPlaylists,
  savePlaylists,
} from "../services/playlistStorage";
import { styles } from "../styles/style";

const SHARED_PLAYLIST_SITE =
  process.env.EXPO_PUBLIC_SHARED_PLAYLIST_URL;

const extractYouTubeVideoId = (
  value?: string | null
): string | null => {
  if (!value) return null;

  if (/^[A-Za-z0-9_-]{11}$/.test(value)) {
    return value;
  }

  const storedIdMatch = value.match(
    /^youtube:([A-Za-z0-9_-]{11})$/
  );

  if (storedIdMatch) {
    return storedIdMatch[1];
  }

  const urlMatch = value.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?.*?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/
  );

  return urlMatch?.[1] ?? null;
};

const getYouTubeVideoId = (
  item: ITunesMediaItem
): string | null => {
  if (item.mediaType !== "video") {
    return null;
  }

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

  const { playlist } = route.params as {
    playlist?: string;
  };

  const passedPlaylist =
    useMemo<StoredPlaylist | null>(() => {
      if (!playlist) return null;

      try {
        return JSON.parse(playlist);
      } catch {
        return null;
      }
    }, [playlist]);

  const [uid, setUid] = useState(
    auth.currentUser?.uid ?? null
  );

  const [songs, setSongs] = useState<
    ITunesMediaItem[]
  >([]);

  const [activeItem, setActiveItem] =
    useState<ITunesMediaItem | null>(null);

  const [currentIndex, setCurrentIndex] =
    useState<number | null>(null);

  const [shuffleMode, setShuffleMode] =
    useState(false);

  const [loading, setLoading] = useState(true);

  // Playlist rename state
  const [playlistName, setPlaylistName] =
    useState(
      passedPlaylist?.name ?? "Playlist"
    );

  const [renameVisible, setRenameVisible] =
    useState(false);

  const [renameValue, setRenameValue] =
    useState(
      passedPlaylist?.name ?? ""
    );

  const [renaming, setRenaming] =
    useState(false);

  // Playlist sharing state
  const [sharing, setSharing] =
    useState(false);

  const [unsharing, setUnsharing] =
    useState(false);

  const [shared, setShared] =
    useState(false);

  const playableIndices = useMemo(
    () =>
      songs.reduce<number[]>(
        (indices, item, index) => {
          if (isPlayable(item)) {
            indices.push(index);
          }

          return indices;
        },
        []
      ),
    [songs]
  );

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        setUid(user?.uid ?? null);
      }),
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
      .then((allPlaylists) => {
        const current =
          allPlaylists.find(
            (item) =>
              item.id === passedPlaylist.id
          ) ??
          allPlaylists.find(
            (item) =>
              item.name === passedPlaylist.name
          );

        setSongs(current?.songs ?? []);

        if (current) {
          setPlaylistName(current.name);
          setRenameValue(current.name);
        }
      })
      .catch((error) => {
        console.error(
          "Failed to load playlist:",
          error
        );

        setSongs([]);

        Toast.show({
          type: "error",
          text1: "Could not load playlist",
          text2: "Please try again.",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [uid, passedPlaylist]);

  /*
   * Check whether the stable shared document already exists.
   * This makes the Unshare button return after reopening the screen.
   */
  useEffect(() => {
    if (!uid || !passedPlaylist?.id) {
      setShared(false);
      return;
    }

    let cancelled = false;

    isPlaylistShared({
      ownerId: uid,
      playlistId: passedPlaylist.id,
    })
      .then((isShared) => {
        if (!cancelled) {
          setShared(isShared);
        }
      })
      .catch((error) => {
        console.warn(
          "Could not check sharing status:",
          error
        );

        if (!cancelled) {
          setShared(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [uid, passedPlaylist?.id]);

  /*
   * If an already-shared playlist changes, update its public
   * Firestore snapshot after a short delay.
   */
  useEffect(() => {
    if (
      !shared ||
      !uid ||
      !passedPlaylist?.id ||
      loading ||
      songs.length === 0
    ) {
      return;
    }

    const timeout = setTimeout(() => {
      publishPlaylist({
        ownerId: uid,
        playlistId: passedPlaylist.id,
        playlistName,
        items: songs,
      }).catch((error) => {
        console.error(
          "Failed to synchronize shared playlist:",
          error
        );
      });
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [
    shared,
    uid,
    passedPlaylist?.id,
    playlistName,
    songs,
    loading,
  ]);

  useEffect(() => {
    if (!isFocused) {
      setActiveItem(null);
      setCurrentIndex(null);
      setShuffleMode(false);
      setRenameVisible(false);
    }
  }, [isFocused]);

  const openRenameModal = () => {
    setRenameValue(playlistName);
    setRenameVisible(true);
  };

  const closeRenameModal = () => {
    if (renaming) return;

    setRenameValue(playlistName);
    setRenameVisible(false);
  };

  const renamePlaylist = async () => {
    if (
      !uid ||
      !passedPlaylist ||
      renaming
    ) {
      return;
    }

    const newName = renameValue.trim();

    if (!newName) {
      Toast.show({
        type: "error",
        text1: "Enter a playlist name",
        text2:
          "The playlist name cannot be empty.",
      });

      return;
    }

    if (newName === playlistName) {
      setRenameVisible(false);
      return;
    }

    try {
      setRenaming(true);

      const allPlaylists =
        await loadPlaylists(uid);

      const duplicateExists =
        allPlaylists.some((item) => {
          const isCurrentPlaylist =
            passedPlaylist.id
              ? item.id === passedPlaylist.id
              : item.name === playlistName;

          return (
            !isCurrentPlaylist &&
            item.name
              .trim()
              .toLowerCase() ===
              newName.toLowerCase()
          );
        });

      if (duplicateExists) {
        Toast.show({
          type: "error",
          text1: "Playlist already exists",
          text2:
            `You already have a playlist named “${newName}”.`,
        });

        return;
      }

      const updatedPlaylists =
        allPlaylists.map((item) => {
          const matches =
            passedPlaylist.id
              ? item.id === passedPlaylist.id
              : item.name === playlistName;

          return matches
            ? {
                ...item,
                name: newName,
              }
            : item;
        });

      await savePlaylists(
        uid,
        updatedPlaylists
      );

      setPlaylistName(newName);
      setRenameValue(newName);
      setRenameVisible(false);

      Toast.show({
        type: "success",
        text1: "Playlist renamed",
        text2: `Renamed to “${newName}”.`,
      });
    } catch (error) {
      console.error(
        "Failed to rename playlist:",
        error
      );

      Toast.show({
        type: "error",
        text1: "Could not rename playlist",
        text2: "Please try again.",
      });
    } finally {
      setRenaming(false);
    }
  };

  const handleSharePlaylist = async () => {
    if (sharing || unsharing) return;

    if (!uid) {
      Toast.show({
        type: "error",
        text1: "Please sign in",
        text2:
          "You must be signed in to share a playlist.",
      });

      return;
    }

    if (!passedPlaylist?.id) {
      Toast.show({
        type: "error",
        text1: "Could not share playlist",
        text2:
          "This playlist does not have an ID.",
      });

      return;
    }

    if (songs.length === 0) {
      Toast.show({
        type: "info",
        text1: "Playlist is empty",
        text2:
          "Add media before sharing this playlist.",
      });

      return;
    }

    if (!SHARED_PLAYLIST_SITE) {
      Toast.show({
        type: "error",
        text1: "Sharing is not configured",
        text2:
          "EXPO_PUBLIC_SHARED_PLAYLIST_URL is missing.",
      });

      return;
    }

    try {
      setSharing(true);

      const shareId =
        await publishPlaylist({
          ownerId: uid,
          playlistId: passedPlaylist.id,
          playlistName,
          items: songs,
        });

      setShared(true);

      const baseUrl =
        SHARED_PLAYLIST_SITE.replace(
          /\/+$/,
          ""
        );

      const shareUrl =
        `${baseUrl}/?playlist=${encodeURIComponent(
          shareId
        )}`;

      await Share.share({
        title: playlistName,
        message:
          `Check out my playlist “${playlistName}”:\n${shareUrl}`,
        url: shareUrl,
      });
    } catch (error) {
      console.error(
        "Failed to share playlist:",
        error
      );

      Toast.show({
        type: "error",
        text1: "Could not share playlist",
        text2: "Please try again.",
      });
    } finally {
      setSharing(false);
    }
  };

  const handleUnsharePlaylist =
    async () => {
      if (
        !uid ||
        !passedPlaylist?.id ||
        unsharing
      ) {
        return;
      }

      try {
        setUnsharing(true);

        await unsharePlaylist({
          ownerId: uid,
          playlistId: passedPlaylist.id,
        });

        setShared(false);

        Toast.show({
          type: "success",
          text1: "Playlist unshared",
          text2:
            "The public link is no longer available.",
        });
      } catch (error) {
        console.error(
          "Failed to unshare playlist:",
          error
        );

        Toast.show({
          type: "error",
          text1:
            "Could not unshare playlist",
          text2: "Please try again.",
        });
      } finally {
        setUnsharing(false);
      }
    };

  const confirmUnsharePlaylist = () => {
    Alert.alert(
      "Unshare playlist?",
      "Anyone with the public link will no longer be able to view this playlist.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Unshare",
          style: "destructive",
          onPress: () =>
            void handleUnsharePlaylist(),
        },
      ]
    );
  };

  const playableIndex = (
    start: number,
    direction: 1 | -1
  ) => {
    for (
      let index = start + direction;
      index >= 0 &&
      index < songs.length;
      index += direction
    ) {
      if (isPlayable(songs[index])) {
        return index;
      }
    }

    return null;
  };

  const playAt = (index: number) => {
    const item = songs[index];

    if (!item || !isPlayable(item)) {
      return;
    }

    setCurrentIndex(index);
    setActiveItem(item);
  };

  const playFromBeginning = () => {
    const firstPlayableIndex =
      playableIndices[0];

    if (
      firstPlayableIndex === undefined
    ) {
      return;
    }

    setShuffleMode(false);
    playAt(firstPlayableIndex);
  };

  const randomPlayableIndex = (
    indexToExclude?: number | null
  ) => {
    const choices =
      playableIndices.filter(
        (index) =>
          index !== indexToExclude
      );

    if (choices.length === 0) {
      return playableIndices[0] ?? null;
    }

    return (
      choices[
        Math.floor(
          Math.random() * choices.length
        )
      ] ?? null
    );
  };

  const startShuffle = () => {
    const randomIndex =
      randomPlayableIndex(currentIndex);

    if (randomIndex === null) {
      return;
    }

    setShuffleMode(true);
    playAt(randomIndex);
  };

  const playNext = () => {
    if (currentIndex === null) return;

    const next = shuffleMode
      ? randomPlayableIndex(currentIndex)
      : playableIndex(currentIndex, 1);

    if (next !== null) {
      playAt(next);
    }
  };

  const playPrevious = () => {
    if (
      shuffleMode ||
      currentIndex === null
    ) {
      return;
    }

    const previous =
      playableIndex(currentIndex, -1);

    if (previous !== null) {
      playAt(previous);
    }
  };

  const closePlayer = () => {
    setActiveItem(null);
    setCurrentIndex(null);
    setShuffleMode(false);
  };

  const handleDelete = async (
    indexToRemove: number
  ) => {
    if (!uid || !passedPlaylist) {
      return;
    }

    try {
      const updatedSongs = songs.filter(
        (_, index) =>
          index !== indexToRemove
      );

      const allPlaylists =
        await loadPlaylists(uid);

      const updatedPlaylists =
        allPlaylists.map((item) => {
          const matches =
            passedPlaylist.id
              ? item.id === passedPlaylist.id
              : item.name === playlistName;

          return matches
            ? {
                ...item,
                songs: updatedSongs,
              }
            : item;
        });

      await savePlaylists(
        uid,
        updatedPlaylists
      );

      setSongs(updatedSongs);

      if (
        currentIndex === indexToRemove
      ) {
        closePlayer();
      } else if (
        currentIndex !== null &&
        indexToRemove < currentIndex
      ) {
        setCurrentIndex(
          currentIndex - 1
        );
      }
    } catch (error) {
      console.error(
        "Failed to delete playlist item:",
        error
      );

      Toast.show({
        type: "error",
        text1: "Could not remove media",
        text2: "Please try again.",
      });
    }
  };

  const activeYouTubeId = activeItem
    ? getYouTubeVideoId(activeItem)
    : null;

  const sourceProps = activeItem
    ? activeItem.mediaType === "song"
      ? {
          sourceAttribution:
            "Preview provided courtesy of iTunes",
          sourceLabel: "Apple Music",
          sourceUrl:
            activeItem.externalUrl,
        }
      : activeItem.mediaType ===
          "audiobook"
        ? {
            sourceAttribution:
              "Preview provided by Apple",
            sourceLabel: "Apple Books",
            sourceUrl:
              activeItem.externalUrl,
          }
        : activeItem.mediaType ===
            "video"
          ? {
              sourceLabel: "YouTube",
              sourceUrl:
                activeItem.externalUrl ??
                activeItem.audioUrl,
            }
          : {
              sourceLabel:
                "Apple Podcasts",
              sourceUrl:
                activeItem.externalUrl,
            }
    : {};

  return (
    <SafeAreaView
      style={styles.safeAreaContainer}
    >
      <View
        style={styles.headerContainer}
      >
        <TouchableOpacity
          onPress={() =>
            navigation.goBack()
          }
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="black"
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            localStyles.headerTitle,
          ]}
          numberOfLines={1}
        >
          {playlistName}
        </Text>

        <View
          style={localStyles.headerActions}
        >
          <TouchableOpacity
            onPress={openRenameModal}
            style={
              localStyles.secondaryHeaderButton
            }
            accessibilityRole="button"
            accessibilityLabel="Rename playlist"
          >
            <Ionicons
              name="pencil-outline"
              size={20}
              color="#1DB954"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              void handleSharePlaylist()
            }
            disabled={
              sharing ||
              unsharing ||
              songs.length === 0
            }
            style={
              localStyles.secondaryHeaderButton
            }
            accessibilityRole="button"
            accessibilityLabel={
              shared
                ? "Share updated playlist"
                : "Share playlist"
            }
          >
            {sharing ? (
              <ActivityIndicator
                size="small"
                color="#1DB954"
              />
            ) : (
              <Ionicons
                name="share-outline"
                size={21}
                color={
                  songs.length === 0
                    ? "#A7A7A7"
                    : "#1DB954"
                }
              />
            )}
          </TouchableOpacity>

          {shared && (
            <TouchableOpacity
              onPress={
                confirmUnsharePlaylist
              }
              disabled={
                sharing || unsharing
              }
              style={
                localStyles.secondaryHeaderButton
              }
              accessibilityRole="button"
              accessibilityLabel="Unshare playlist"
            >
              {unsharing ? (
                <ActivityIndicator
                  size="small"
                  color="#D32F2F"
                />
              ) : (
                <Ionicons
                  name="cloud-offline-outline"
                  size={20}
                  color="#D32F2F"
                />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={startShuffle}
            disabled={
              playableIndices.length === 0
            }
            style={[
              localStyles.headerActionButton,
              shuffleMode &&
                localStyles.activeShuffleButton,
              playableIndices.length ===
                0 &&
                localStyles.disabledButton,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Shuffle playlist"
          >
            <Ionicons
              name="shuffle"
              size={17}
              color="white"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={playFromBeginning}
            disabled={
              playableIndices.length === 0
            }
            style={[
              localStyles.headerActionButton,
              playableIndices.length ===
                0 &&
                localStyles.disabledButton,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Play playlist from beginning"
          >
            <Ionicons
              name="play"
              size={17}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#1DB954"
          style={{
            marginTop: 50,
          }}
        />
      ) : songs.length === 0 ? (
        <Text
          style={localStyles.emptyText}
        >
          No media in this playlist.
        </Text>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) =>
            `${item.mediaType}:${item.id}`
          }
          contentContainerStyle={
            activeItem
              ? {
                  paddingBottom:
                    activeYouTubeId
                      ? 470
                      : 200,
                }
              : undefined
          }
          renderItem={({
            item,
            index,
          }) => (
            <View style={styles.songCard}>
              {item.artworkUrl && (
                <Image
                  source={{
                    uri: item.artworkUrl,
                  }}
                  style={styles.songImage}
                />
              )}

              <View
                style={styles.songDetails}
              >
                <Text
                  style={styles.songTitle}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>

                <Text
                  style={styles.songArtist}
                  numberOfLines={1}
                >
                  {item.creator}
                </Text>
              </View>

              {isPlayable(item) && (
                <TouchableOpacity
                  onPress={() => {
                    setShuffleMode(false);
                    playAt(index);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={
                    `Play ${item.title}`
                  }
                >
                  <Ionicons
                    name="play-circle"
                    size={28}
                    color="#1DB954"
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() =>
                  void handleDelete(index)
                }
                accessibilityRole="button"
                accessibilityLabel={
                  `Remove ${item.title}`
                }
              >
                <Ionicons
                  name="trash"
                  size={24}
                  color="red"
                />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal
        transparent
        visible={renameVisible}
        animationType="fade"
        onRequestClose={
          closeRenameModal
        }
      >
        <KeyboardAvoidingView
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
          style={
            localStyles.modalOverlay
          }
        >
          <View
            style={
              localStyles.modalContent
            }
          >
            <Text
              style={localStyles.modalTitle}
            >
              Rename Playlist
            </Text>

            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder="Playlist name"
              autoFocus
              selectTextOnFocus
              maxLength={60}
              returnKeyType="done"
              editable={!renaming}
              onSubmitEditing={() =>
                void renamePlaylist()
              }
              style={
                localStyles.renameInput
              }
            />

            <TouchableOpacity
              onPress={() =>
                void renamePlaylist()
              }
              disabled={
                renaming ||
                renameValue.trim()
                  .length === 0
              }
              style={[
                localStyles.saveButton,
                (renaming ||
                  renameValue.trim()
                    .length === 0) &&
                  localStyles.disabledButton,
              ]}
            >
              {renaming ? (
                <ActivityIndicator
                  size="small"
                  color="white"
                />
              ) : (
                <Text
                  style={
                    localStyles.saveButtonText
                  }
                >
                  Save
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={closeRenameModal}
              disabled={renaming}
              style={
                localStyles.cancelButton
              }
            >
              <Text
                style={
                  localStyles.cancelButtonText
                }
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {isFocused &&
        activeItem &&
        currentIndex !== null &&
        (activeItem.audioUrl ||
          activeYouTubeId) && (
          <AudioPlayer
            key={
              `${activeItem.mediaType}:${activeItem.id}`
            }
            previewUrl={
              activeItem.mediaType ===
              "video"
                ? ""
                : activeItem.audioUrl ??
                  ""
            }
            youtubeVideoId={
              activeYouTubeId
            }
            expandVideoOnLoad
            songName={activeItem.title}
            artistName={
              activeItem.creator
            }
            onClose={closePlayer}
            onNext={playNext}
            onPrevious={playPrevious}
            disableNext={
              shuffleMode
                ? playableIndices.length <=
                  1
                : playableIndex(
                    currentIndex,
                    1
                  ) === null
            }
            disablePrevious={
              shuffleMode ||
              playableIndex(
                currentIndex,
                -1
              ) === null
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
    marginRight: 2,
  },

  headerActions: {
    marginLeft: "auto",
    marginRight: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  secondaryHeaderButton: {
    width: 28,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
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

  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#666",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor:
      "rgba(0, 0, 0, 0.5)",
  },

  modalContent: {
    width: "100%",
    padding: 20,
    borderRadius: 16,
    backgroundColor: "white",
  },

  modalTitle: {
    marginBottom: 16,
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
  },

  renameInput: {
    height: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 10,
    backgroundColor: "#F7F7F7",
    fontSize: 16,
    color: "#222",
  },

  saveButton: {
    height: 48,
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: "#1DB954",
    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },

  cancelButton: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 4,
  },

  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PlaylistSongs;











