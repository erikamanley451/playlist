import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";
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
import SearchBar from "../components/searchBar";
import YouTubePlayer from "../components/YouTubePlayer";
import { auth } from "../services/firebase";
import type { ITunesMediaItem } from "../services/itunesService";
import type { StoredPlaylist } from "../services/playlistStorage";
import { createPlaylist, loadPlaylists, savePlaylists } from "../services/playlistStorage";
import { fetchPopularVideos, fetchVideos } from "../services/youtubeService";
import { styles } from "../styles/style";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 15;

const normalizeVideo = (item: any): ITunesMediaItem => {
  // Search results use item.id.videoId, chart results use item.id, and an
  // already-normalized item may use item.videoId or a `youtube:`-prefixed id.
  const rawVideoId = item.videoId ?? item.id?.videoId ?? item.id;
  const videoId =
    typeof rawVideoId === "string"
      ? rawVideoId.replace(/^youtube:/, "")
      : "";

  return {
    id: `youtube:${videoId}`,
    mediaType: "video",
    title: item.snippet?.title || "YouTube Video",
    creator: item.snippet?.channelTitle || "Unknown Channel",
    artworkUrl:
      item.snippet?.thumbnails?.medium?.url ||
      item.snippet?.thumbnails?.high?.url ||
      item.snippet?.thumbnails?.default?.url ||
      null,
    audioUrl: null,
    externalUrl: videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : null,
    description: item.snippet?.description || "",
    durationMs: null,
    releaseDate: item.snippet?.publishedAt || null,
    videoId,
  };
};

const Videos = () => {
  const navigation = useNavigation<any>();
  const [uid, setUid] = useState(auth.currentUser?.uid ?? null);
  const [searchQuery, setSearchQuery] = useState("");
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYouTubeVideo, setSelectedYouTubeVideo] = useState<ITunesMediaItem | null>(null);
  const [playerVisible, setPlayerVisible] = useState(false);
  const [playlists, setPlaylists] = useState<StoredPlaylist[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<ITunesMediaItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlaylistModalVisible, setNewPlaylistModalVisible] = useState(false);
  const [existingPlaylistModalVisible, setExistingPlaylistModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  useEffect(() => onAuthStateChanged(auth, (user) => setUid(user?.uid ?? null)), []);

  useEffect(() => {
    void loadPopularVideos();
  }, []);

  useEffect(() => {
    if (!uid) {
      setPlaylists([]);
      return;
    }

    loadPlaylists(uid)
      .then(setPlaylists)
      .catch((error) => console.error("Error loading playlists:", error));
  }, [uid]);

  const loadPopularVideos = async () => {
    setLoading(true);

    try {
      const { videos: popularVideos } = await fetchPopularVideos();
      setVideos(popularVideos || []);
    } catch (error) {
      console.error("Error loading popular videos:", error);
      Toast.show({ type: "error", text1: "Unable to load videos" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();

    if (!query) {
      await loadPopularVideos();
      return;
    }

    setLoading(true);

    try {
      const { videos: searchResults } = await fetchVideos(query);
      setVideos(searchResults || []);
    } catch (error) {
      console.error("Error searching YouTube:", error);
      Toast.show({
        type: "error",
        text1: "Search failed",
        text2: "Unable to load YouTube results.",
      });
    } finally {
      setLoading(false);
    }
  };

  const persistPlaylists = async (updated: StoredPlaylist[]) => {
    if (!uid) {
      Toast.show({ type: "error", text1: "Please sign in first." });
      return false;
    }

    try {
      await savePlaylists(uid, updated);
      setPlaylists(updated);
      return true;
    } catch (error) {
      console.error("Error saving playlists:", error);
      Toast.show({ type: "error", text1: "Unable to save playlist." });
      return false;
    }
  };

  const handlePlay = (item: any) => {
    const video = normalizeVideo(item);

    if (!video.videoId) {
      Toast.show({ type: "error", text1: "Unable to play video" });
      return;
    }

    setSelectedYouTubeVideo(video);
    setPlayerVisible(true);
  };

  const closePlayer = () => {
    setPlayerVisible(false);
    setSelectedYouTubeVideo(null);
  };

  const openModal = (item: any) => {
    const video = normalizeVideo(item);

    if (!video.videoId) {
      Toast.show({ type: "error", text1: "Unable to add this video" });
      return;
    }

    setSelectedVideo(video);
    setModalVisible(true);
  };

  const closeAllModals = () => {
    setModalVisible(false);
    setNewPlaylistModalVisible(false);
    setExistingPlaylistModalVisible(false);
    setSelectedVideo(null);
  };

  const handleCreatePlaylist = async () => {
    const name = newPlaylistName.trim();

    if (!name || !selectedVideo) return;

    if (playlists.some((playlist) => playlist.name.toLowerCase() === name.toLowerCase())) {
      Toast.show({ type: "error", text1: "Playlist already exists." });
      return;
    }

    const updated = [...playlists, createPlaylist(name, selectedVideo)];

    if (await persistPlaylists(updated)) {
      Toast.show({
        type: "success",
        text1: `Created ${name}`,
        text2: "Video added.",
      });
      setNewPlaylistName("");
      closeAllModals();
    }
  };

  const handleAddToExisting = async (index: number) => {
    if (!selectedVideo || !playlists[index]) return;

    if (playlists[index].songs.some((item) => item.id === selectedVideo.id)) {
      Toast.show({ type: "info", text1: "Video already in playlist" });
      closeAllModals();
      return;
    }

    const updated = playlists.map((playlist, playlistIndex) =>
      playlistIndex === index
        ? { ...playlist, songs: [...playlist.songs, selectedVideo] }
        : playlist
    );

    if (await persistPlaylists(updated)) {
      Toast.show({ type: "success", text1: `Added to ${playlists[index].name}` });
    }

    closeAllModals();
  };

  const renderItem = ({ item }: { item: any }) => {
    const video = normalizeVideo(item);

    return (
      <View style={style.card}>
        <TouchableOpacity onPress={() => handlePlay(item)}>
          {video.artworkUrl ? (
            <Image source={{ uri: video.artworkUrl }} style={style.thumbnail} />
          ) : (
            <View style={style.thumbnailPlaceholder}>
              <Ionicons name="videocam-outline" size={40} color="gray" />
            </View>
          )}
        </TouchableOpacity>

        <View style={{ padding: 10 }}>
          <Text style={style.videoTitle} numberOfLines={2}>{video.title}</Text>
          <View style={style.videoFooter}>
            <Text numberOfLines={1} style={style.channelName}>{video.creator}</Text>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <TouchableOpacity onPress={() => handlePlay(item)}>
                <Ionicons name="play-circle" size={24} color="#1DB954" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openModal(item)}>
                <Ionicons name="add-circle" size={24} color="#1DB954" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.navigate("AppTabs")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Videos</Text>
      </View>

      <SearchBar
        placeholder="Search YouTube videos..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmit={() => void handleSearch()}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#1DB954" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item, index) => item.id?.videoId || item.id || index.toString()}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 100 }}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 30, color: "gray" }}>
              No videos found.
            </Text>
          }
        />
      )}

      {selectedYouTubeVideo?.videoId && (
        <YouTubePlayer
          videoId={selectedYouTubeVideo.videoId}
          title={selectedYouTubeVideo.title}
          visible={playerVisible}
          onClose={closePlayer}
        />
      )}

      <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={closeAllModals}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>ADD TO</Text>
          <TouchableOpacity style={styles.modalButton} onPress={() => { setModalVisible(false); setExistingPlaylistModalVisible(true); }}>
            <Text style={styles.modalButtonText}>Existing Playlist</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalButton} onPress={() => { setModalVisible(false); setNewPlaylistModalVisible(true); }}>
            <Text style={styles.modalButtonText}>New Playlist</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={closeAllModals}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
        </View></View>
      </Modal>

      <Modal transparent visible={newPlaylistModalVisible} animationType="slide" onRequestClose={closeAllModals}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create New Playlist</Text>
          <TextInput style={styles.input} placeholder="Playlist Name" value={newPlaylistName} onChangeText={setNewPlaylistName} />
          <TouchableOpacity style={styles.modalButton} onPress={() => void handleCreatePlaylist()}>
            <Text style={styles.modalButtonText}>Create</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={closeAllModals}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
        </View></View>
      </Modal>

      <Modal transparent visible={existingPlaylistModalVisible} animationType="slide" onRequestClose={closeAllModals}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Playlist</Text>
          {playlists.map((playlist, index) => (
            <TouchableOpacity key={playlist.id} style={styles.modalButton} onPress={() => void handleAddToExisting(index)}>
              <Text style={styles.modalButtonText}>{playlist.name}</Text>
            </TouchableOpacity>
          ))}
          {playlists.length === 0 && (
            <Text style={{ textAlign: "center", color: "gray", marginBottom: 15 }}>No playlists yet.</Text>
          )}
          <TouchableOpacity onPress={closeAllModals}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
        </View></View>
      </Modal>

      <Toast />
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
  thumbnail: { width: "100%" as const, height: 120 },
  thumbnailPlaceholder: {
    width: "100%" as const,
    height: 120,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#ddd",
  },
  videoTitle: { fontWeight: "600" as const, fontSize: 14 },
  videoFooter: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginTop: 2,
  },
  channelName: { fontSize: 12, color: "gray", flexShrink: 1 },
};

export default Videos;

















