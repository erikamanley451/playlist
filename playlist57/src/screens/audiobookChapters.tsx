
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import usePaginatedData from "../hooks/usePaginatedData";
import { fetchAudiobookChapter } from "../services/spotifyService";
import { styles } from "../styles/style";

const AudiobookChapters = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { audiobook } = route.params as {
    audiobook: string;
  };

  const show = JSON.parse(audiobook);

  const [showFullDescription, setShowFullDescription] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlaylistModalVisible, setNewPlaylistModalVisible] = useState(false);
  const [existingPlaylistModalVisible, setExistingPlaylistModalVisible] =
    useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<any | null>(null);

  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        const stored = await AsyncStorage.getItem("playlists");

        if (stored) {
          setPlaylists(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Failed to load playlists:", error);
      }
    };

    loadPlaylists();
  }, []);

  const savePlaylists = async (updated: any[]) => {
    await AsyncStorage.setItem("playlists", JSON.stringify(updated));
    setPlaylists(updated);
  };

  const closeAllModals = () => {
    setModalVisible(false);
    setNewPlaylistModalVisible(false);
    setExistingPlaylistModalVisible(false);
    setSelectedChapter(null);
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      Toast.show({
        type: "error",
        text1: "Please enter a playlist name.",
      });
      return;
    }

    const exists = playlists.some(
      (p) => p.name.toLowerCase() === newPlaylistName.toLowerCase()
    );

    if (exists) {
      Toast.show({
        type: "error",
        text1: "Playlist already exists.",
      });
      return;
    }

    const newPlaylist = {
      name: newPlaylistName,
      songs: [selectedChapter],
    };

    const updated = [...playlists, newPlaylist];

    savePlaylists(updated);

    Toast.show({
      type: "success",
      text1: `Created ${newPlaylistName}`,
    });

    setNewPlaylistName("");
    closeAllModals();
  };

  const handleAddToExisting = (index: number) => {
    if (!selectedChapter) return;

    const updated = [...playlists];
    const playlist = updated[index];

    const alreadyIn = playlist.songs.some(
      (ch: any) => ch.id === selectedChapter.id
    );

    if (alreadyIn) {
      Toast.show({
        type: "info",
        text1: "Chapter already in playlist",
      });
    } else {
      playlist.songs.push(selectedChapter);

      savePlaylists(updated);

      Toast.show({
        type: "success",
        text1: `Added to ${playlist.name}`,
      });
    }

    closeAllModals();
  };

  const fetchPaginatedChapters = useCallback(
    async (offset: number, limit: number) =>
      await fetchAudiobookChapter(show.id, offset, limit),
    [show.id]
  );

  const {
    data: chapters,
    isFetchingMore,
    hasMore,
    fetchData,
  } = usePaginatedData(fetchPaginatedChapters, 50);

  const formatDuration = (durationMs: number) => {
    if (!durationMs) return "Duration unknown";

    const totalMinutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  const renderChapter = ({ item }: any) => (
    <View style={styles.songCard}>
      <Image
        source={{ uri: item.images?.[0]?.url }}
        style={styles.songImage}
      />

      <View style={styles.songDetails}>
        <Text style={styles.songTitle}>
          {item.name.length > 25
            ? item.name.slice(0, 25) + "..."
            : item.name}
        </Text>

        <Text style={styles.songArtist}>
          {formatDuration(item.duration_ms)}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => Linking.openURL(item.external_urls.spotify)}
      >
        <Ionicons
          name="play-circle"
          size={28}
          color="#1DB954"
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          setSelectedChapter(item);
          setModalVisible(true);
        }}
      >
        <Ionicons
          name="add-circle"
          size={28}
          color="#1DB954"
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Audiobooks" as never)}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="black"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {show.name}
        </Text>
      </View>

      <View
        style={{
          paddingHorizontal: 16,
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            marginBottom: 6,
          }}
        >
          About
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: "#444",
            lineHeight: 22,
          }}
        >
          {showFullDescription
            ? show.description
            : show.description.slice(0, 250) +
              (show.description.length > 250 ? "..." : "")}
        </Text>

        {show.description.length > 250 && (
          <TouchableOpacity onPress={toggleDescription}>
            <Text
              style={{
                color: "#1DB954",
                marginTop: 4,
                fontWeight: "600",
              }}
            >
              {showFullDescription ? "Show less" : "Show more"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          marginBottom: 10,
          paddingHorizontal: 16,
        }}
      >
        All Chapters
      </Text>

      <FlatList
        data={chapters}
        keyExtractor={(item) => item.id}
        renderItem={renderChapter}
        onEndReached={() => {
          if (hasMore && !isFetchingMore) {
            fetchData();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingMore ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator
                size="large"
                color="#1DB954"
              />
            </View>
          ) : !hasMore ? (
            <Text
              style={{
                textAlign: "center",
                padding: 10,
                color: "gray",
              }}
            >
              No more chapters
            </Text>
          ) : null
        }
      />

      {/* Add to Playlist Modal */}
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

            <TouchableOpacity onPress={closeAllModals}>
              <Text style={styles.modalCancelText}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create New Playlist Modal */}
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

            <TouchableOpacity onPress={closeAllModals}>
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
                onPress={() => handleAddToExisting(index)}
              >
                <Text style={styles.modalButtonText}>
                  {playlist.name}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity onPress={closeAllModals}>
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

export default AudiobookChapters;


