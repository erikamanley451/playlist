
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
import AudioPlayer from "../components/AudioPlayer";
import { searchAppleMusicVideos } from "../services/appleServices";
import { fetchVideos } from "../services/youtubeService";
import { styles } from "../styles/style";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 15;

const Videos = () => {
  const navigation = useNavigation<any>();

  const [searchQuery, setSearchQuery] = useState("kendrick lamar");
  const [youtubeVideos, setYoutubeVideos] = useState<any[]>([]);
  const [appleVideos, setAppleVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [previewUrl, setPreviewUrl] = useState("");
  const [activeVideo, setActiveVideo] = useState<any | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [newPlaylistModalVisible, setNewPlaylistModalVisible] =
    useState(false);
  const [existingPlaylistModalVisible, setExistingPlaylistModalVisible] =
    useState(false);

  const [newPlaylistName, setNewPlaylistName] = useState("");

  const allVideos = [...appleVideos, ...youtubeVideos];

  useEffect(() => {
    loadVideos();
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    const stored = await AsyncStorage.getItem("playlists");

    if (stored) {
      setPlaylists(JSON.parse(stored));
    }
  };

  const savePlaylists = async (updated: any[]) => {
    await AsyncStorage.setItem("playlists", JSON.stringify(updated));
    setPlaylists(updated);
  };

  const loadVideos = async () => {
    setLoading(true);

    try {
      const { videos } = await fetchVideos(searchQuery);
      const apple = await searchAppleMusicVideos(searchQuery);

      setYoutubeVideos(videos);
      setAppleVideos(apple);
    } catch (error) {
      console.error("Error loading videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);

    try {
      const { videos } = await fetchVideos(searchQuery);
      const apple = await searchAppleMusicVideos(searchQuery);

      setYoutubeVideos(videos);
      setAppleVideos(apple);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (item: any, index: number) => {
    const preview =
      item.preview_url || item.attributes?.previews?.[0]?.url;

    if (!preview) return;

    setPreviewUrl(preview);

    setActiveVideo({
      name: item.snippet?.title || item.attributes?.name,
      artist:
        item.snippet?.channelTitle ||
        item.attributes?.artistName,
    });

    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex === null) return;

    for (
      let i = currentIndex + 1;
      i < allVideos.length;
      i++
    ) {
      const item = allVideos[i];

      const preview =
        item.preview_url ||
        item.attributes?.previews?.[0]?.url;

      if (preview) {
        return handlePlay(item, i);
      }
    }
  };

  const handlePrevious = () => {
    if (currentIndex === null) return;

    for (let i = currentIndex - 1; i >= 0; i--) {
      const item = allVideos[i];

      const preview =
        item.preview_url ||
        item.attributes?.previews?.[0]?.url;

      if (preview) {
        return handlePlay(item, i);
      }
    }
  };

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

  const handleCreatePlaylist = () => {
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

    const updated = [...playlists, newPlaylist];

    savePlaylists(updated);

    Toast.show({
      type: "success",
      text1: `Created ${newPlaylistName.trim()}`,
      text2: "Video added.",
    });

    setNewPlaylistName("");
    closeAllModals();
  };

  const handleAddToExisting = (index: number) => {
    if (!selectedVideo) return;

    const updated = [...playlists];
    const playlist = updated[index];

    if (!playlist) return;

    const alreadyIn = playlist.songs?.some(
      (song: any) => song.id === selectedVideo.id
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

      savePlaylists(updated);

      Toast.show({
        type: "success",
        text1: `Added to ${playlist.name}`,
      });
    }

    closeAllModals();
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => {
    const artworkUrl =
      item.attributes?.artwork?.url
        ?.replace("{w}", "300")
        .replace("{h}", "300");

    const preview =
      item.preview_url ||
      item.attributes?.previews?.[0]?.url;

    const name =
      item.snippet?.title ||
      item.attributes?.name ||
      "Untitled";

    const artist =
      item.snippet?.channelTitle ||
      item.attributes?.artistName ||
      "Unknown Artist";

    const image =
      item.snippet?.thumbnails?.medium?.url ||
      artworkUrl;

    return (
      <View style={style.card}>
        <TouchableOpacity
          onPress={() =>
            preview && handlePlay(item, index)
          }
        >
          {image ? (
            <Image
              source={{ uri: image }}
              style={style.thumbnail}
            />
          ) : (
            <View style={style.thumbnailPlaceholder}>
              <Ionicons
                name="videocam-outline"
                size={40}
                color="gray"
              />
            </View>
          )}
        </TouchableOpacity>

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
              {artist}
            </Text>

            <View
              style={{
                flexDirection: "row",
                gap: 6,
              }}
            >
              {preview && (
                <TouchableOpacity
                  onPress={() =>
                    handlePlay(item, index)
                  }
                >
                  <Ionicons
                    name="play-circle"
                    size={24}
                    color="#1DB954"
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => openModal(item)}
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

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#f5f5f5",
      }}
    >
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

      <View style={{ padding: 10 }}>
        <TextInput
          placeholder="Search videos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchInput}
        />
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#1DB954"
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={allVideos}
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
            justifyContent: "space-between",
          }}
        />
      )}

      {previewUrl && activeVideo && (
        <AudioPlayer
          previewUrl={previewUrl}
          songName={activeVideo.name}
          artistName={activeVideo.artist}
          onClose={() => {
            setPreviewUrl("");
            setActiveVideo(null);
            setCurrentIndex(null);
          }}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      )}

      {/* Playlist Action Modal */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
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
                setExistingPlaylistModalVisible(true);
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

      {/* New Playlist Modal */}
      <Modal
        transparent
        visible={newPlaylistModalVisible}
        animationType="slide"
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
              onChangeText={setNewPlaylistName}
            />

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleCreatePlaylist}
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

      {/* Existing Playlist Modal */}
      <Modal
        transparent
        visible={existingPlaylistModalVisible}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Select Playlist
            </Text>

            {playlists.map((playlist, index) => (
              <TouchableOpacity
                key={index}
                style={styles.modalButton}
                onPress={() =>
                  handleAddToExisting(index)
                }
              >
                <Text style={styles.modalButtonText}>
                  {playlist.name}
                </Text>
              </TouchableOpacity>
            ))}

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
    </SafeAreaView>
  );
};

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


