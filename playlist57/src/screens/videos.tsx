
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import YouTubePlayer from "../components/YouTubePlayer";
import {
  fetchPopularVideos,
  fetchVideos,
} from "../services/youtubeService";

import { styles } from "../styles/style";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 15;

const Videos = () => {
  const navigation = useNavigation<any>();

  const [searchQuery, setSearchQuery] = useState("");

  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // YouTube player
  const [selectedYouTubeVideo, setSelectedYouTubeVideo] =
    useState<any | null>(null);

  const [playerVisible, setPlayerVisible] = useState(false);

  // Playlists
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

  const [modalVisible, setModalVisible] = useState(false);

  const [newPlaylistModalVisible, setNewPlaylistModalVisible] =
    useState(false);

  const [existingPlaylistModalVisible, setExistingPlaylistModalVisible] =
    useState(false);

  const [newPlaylistName, setNewPlaylistName] = useState("");

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------

  useEffect(() => {
    loadPopularVideos();
    loadPlaylists();
  }, []);

  // --------------------------------------------------
  // LOAD POPULAR YOUTUBE VIDEOS
  // --------------------------------------------------

  const loadPopularVideos = async () => {
    setLoading(true);

    try {
      const { videos: popularVideos } =
        await fetchPopularVideos();

      setVideos(popularVideos || []);
    } catch (error) {
      console.error(
        "Error loading popular videos:",
        error
      );

      Toast.show({
        type: "error",
        text1: "Unable to load videos",
      });
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // SEARCH YOUTUBE
  // --------------------------------------------------

  const handleSearch = async () => {
    const query = searchQuery.trim();

    if (!query) {
      loadPopularVideos();
      return;
    }

    setLoading(true);

    try {
      const { videos: searchResults } =
        await fetchVideos(query);

      setVideos(searchResults || []);
    } catch (error) {
      console.error(
        "Error searching YouTube:",
        error
      );

      Toast.show({
        type: "error",
        text1: "Search failed",
        text2: "Unable to load YouTube results.",
      });
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // PLAYLISTS
  // --------------------------------------------------

  const loadPlaylists = async () => {
    try {
      const stored =
        await AsyncStorage.getItem("playlists");

      if (stored) {
        setPlaylists(JSON.parse(stored));
      }
    } catch (error) {
      console.error(
        "Error loading playlists:",
        error
      );
    }
  };

  const savePlaylists = async (updated: any[]) => {
    try {
      await AsyncStorage.setItem(
        "playlists",
        JSON.stringify(updated)
      );

      setPlaylists(updated);
    } catch (error) {
      console.error(
        "Error saving playlists:",
        error
      );
    }
  };

  // --------------------------------------------------
  // PLAY YOUTUBE VIDEO
  // --------------------------------------------------

  const handlePlay = (item: any) => {
    const videoId =
      item.id?.videoId || item.id;

    if (!videoId) {
      Toast.show({
        type: "error",
        text1: "Unable to play video",
      });

      return;
    }

    setSelectedYouTubeVideo({
      id: videoId,
      title: item.snippet?.title || "YouTube Video",
    });

    setPlayerVisible(true);
  };

  const closePlayer = () => {
    setPlayerVisible(false);
    setSelectedYouTubeVideo(null);
  };

  // --------------------------------------------------
  // ADD TO PLAYLIST
  // --------------------------------------------------

  const openModal = (video: any) => {
    setSelectedVideo(video);
    setModalVisible(true);
  };

  const closeAllModals = () => {
    setModalVisible(false);
    setNewPlaylistModalVisible(false);
    setExistingPlaylistModalVisible(false);
    setSelectedVideo(null);
  };

  // --------------------------------------------------
  // CREATE PLAYLIST
  // --------------------------------------------------

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim() || !selectedVideo) {
      return;
    }

    const exists = playlists.some(
      (p) =>
        p.name.toLowerCase() ===
        newPlaylistName.trim().toLowerCase()
    );

    if (exists) {
      Toast.show({
        type: "error",
        text1: "Playlist already exists.",
      });

      return;
    }

    const newPlaylist = {
      name: newPlaylistName.trim(),
      songs: [selectedVideo],
    };

    const updated = [
      ...playlists,
      newPlaylist,
    ];

    await savePlaylists(updated);

    Toast.show({
      type: "success",
      text1: `Created ${newPlaylistName.trim()}`,
      text2: "Video added.",
    });

    setNewPlaylistName("");
    closeAllModals();
  };

  // --------------------------------------------------
  // ADD TO EXISTING PLAYLIST
  // --------------------------------------------------

  const handleAddToExisting = async (
    index: number
  ) => {
    if (!selectedVideo) return;

    const updated = [...playlists];

    const playlist = updated[index];

    if (!playlist) return;

    const alreadyIn = playlist.songs?.some(
      (song: any) => {
        const songId =
          song.id?.videoId || song.id;

        const selectedId =
          selectedVideo.id?.videoId ||
          selectedVideo.id;

        return songId === selectedId;
      }
    );

    if (alreadyIn) {
      Toast.show({
        type: "info",
        text1: "Video already in playlist",
      });
    } else {
      playlist.songs = [
        ...(playlist.songs || []),
        selectedVideo,
      ];

      await savePlaylists(updated);

      Toast.show({
        type: "success",
        text1: `Added to ${playlist.name}`,
      });
    }

    closeAllModals();
  };

  // --------------------------------------------------
  // RENDER VIDEO CARD
  // --------------------------------------------------

  const renderItem = ({
    item,
  }: {
    item: any;
  }) => {
    const videoId =
      item.id?.videoId || item.id;

    const name =
      item.snippet?.title ||
      "Untitled";

    const channel =
      item.snippet?.channelTitle ||
      "Unknown Channel";

    const image =
      item.snippet?.thumbnails?.medium?.url ||
      item.snippet?.thumbnails?.high?.url ||
      item.snippet?.thumbnails?.default?.url;

    return (
      <View style={style.card}>
        {/* VIDEO THUMBNAIL */}

        <TouchableOpacity
          onPress={() => handlePlay(item)}
        >
          {image ? (
            <Image
              source={{ uri: image }}
              style={style.thumbnail}
            />
          ) : (
            <View
              style={style.thumbnailPlaceholder}
            >
              <Ionicons
                name="videocam-outline"
                size={40}
                color="gray"
              />
            </View>
          )}
        </TouchableOpacity>

        {/* VIDEO INFO */}

        <View style={{ padding: 10 }}>
          <Text
            style={style.videoTitle}
            numberOfLines={2}
          >
            {name}
          </Text>

          <View style={style.videoFooter}>
            <Text
              numberOfLines={1}
              style={style.channelName}
            >
              {channel}
            </Text>

            <View
              style={{
                flexDirection: "row",
                gap: 6,
              }}
            >
              {/* PLAY */}

              <TouchableOpacity
                onPress={() =>
                  handlePlay(item)
                }
              >
                <Ionicons
                  name="play-circle"
                  size={24}
                  color="#1DB954"
                />
              </TouchableOpacity>

              {/* ADD TO PLAYLIST */}

              <TouchableOpacity
                onPress={() =>
                  openModal(item)
                }
              >
                <Ionicons
                  name="add-circle"
                  size={24}
                  color="#1DB954"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#f5f5f5",
      }}
    >
      {/* HEADER */}

      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("AppTabs")
          }
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="black"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Videos
        </Text>
      </View>

      {/* SEARCH */}

      <View style={{ padding: 10 }}>
        <TextInput
          placeholder="Search YouTube videos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchInput}
        />
      </View>

      {/* CONTENT */}

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#1DB954"
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item, index) =>
            item.id?.videoId ||
            item.id ||
            index.toString()
          }
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingBottom: 100,
          }}
          columnWrapperStyle={{
            justifyContent:
              "space-between",
          }}
          ListEmptyComponent={
            <Text
              style={{
                textAlign: "center",
                marginTop: 30,
                color: "gray",
              }}
            >
              No videos found.
            </Text>
          }
        />
      )}

      {/* YOUTUBE PLAYER */}

      {selectedYouTubeVideo && (
        <YouTubePlayer
          videoId={selectedYouTubeVideo.id}
          title={selectedYouTubeVideo.title}
          visible={playerVisible}
          onClose={closePlayer}
        />
      )}

      {/* PLAYLIST ACTION MODAL */}

      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={closeAllModals}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              ADD TO
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                setExistingPlaylistModalVisible(
                  true
                );
              }}
            >
              <Text style={styles.modalButtonText}>
                Existing Playlist
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                setNewPlaylistModalVisible(true);
              }}
            >
              <Text style={styles.modalButtonText}>
                New Playlist
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={closeAllModals}
            >
              <Text style={styles.modalCancelText}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* NEW PLAYLIST MODAL */}

      <Modal
        transparent
        visible={newPlaylistModalVisible}
        animationType="slide"
        onRequestClose={closeAllModals}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Create New Playlist
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Playlist Name"
              value={newPlaylistName}
              onChangeText={
                setNewPlaylistName
              }
            />

            <TouchableOpacity
              style={styles.modalButton}
              onPress={
                handleCreatePlaylist
              }
            >
              <Text style={styles.modalButtonText}>
                Create
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={closeAllModals}
            >
              <Text style={styles.modalCancelText}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EXISTING PLAYLIST MODAL */}

      <Modal
        transparent
        visible={
          existingPlaylistModalVisible
        }
        animationType="slide"
        onRequestClose={closeAllModals}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Select Playlist
            </Text>

            {playlists.map(
              (playlist, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalButton}
                  onPress={() =>
                    handleAddToExisting(
                      index
                    )
                  }
                >
                  <Text
                    style={
                      styles.modalButtonText
                    }
                  >
                    {playlist.name}
                  </Text>
                </TouchableOpacity>
              )
            )}

            {playlists.length === 0 && (
              <Text
                style={{
                  textAlign: "center",
                  color: "gray",
                  marginBottom: 15,
                }}
              >
                No playlists yet.
              </Text>
            )}

            <TouchableOpacity
              onPress={closeAllModals}
            >
              <Text
                style={
                  styles.modalCancelText
                }
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
};

// --------------------------------------------------
// CARD STYLES
// --------------------------------------------------

const style = {
  ...styles,

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden" as const,
    width: CARD_WIDTH,
    elevation: 4,
  },

  thumbnail: {
    width: "100%" as const,
    height: 120,
  },

  thumbnailPlaceholder: {
    width: "100%" as const,
    height: 120,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#ddd",
  },

  videoTitle: {
    fontWeight: "600" as const,
    fontSize: 14,
  },

  videoFooter: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginTop: 2,
  },

  channelName: {
    fontSize: 12,
    color: "gray",
    flexShrink: 1,
  },
};

export default Videos;






