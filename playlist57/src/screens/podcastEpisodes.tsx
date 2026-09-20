
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import { SafeAreaView } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { styles } from "../styles/style";

import { fetchPodcastEpisodes } from "../services/spotifyService";

import usePaginatedData from "../hooks/usePaginatedData";

import AudioPlayer from "../components/AudioPlayer";

import Toast from "react-native-toast-message";


const PodcastEpisodes = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();

  const { podcast } = route.params as {
    podcast: string;
  };

  const show = JSON.parse(podcast);


  const [showFullDescription, setShowFullDescription] =
    useState(false);

  const [previewUrl, setPreviewUrl] = useState("");

  const [activeEpisode, setActiveEpisode] =
    useState<any | null>(null);

  const [currentIndex, setCurrentIndex] =
    useState<number | null>(null);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [newPlaylistModalVisible, setNewPlaylistModalVisible] =
    useState(false);

  const [
    existingPlaylistModalVisible,
    setExistingPlaylistModalVisible,
  ] = useState(false);

  const [playlists, setPlaylists] =
    useState<any[]>([]);

  const [selectedEpisode, setSelectedEpisode] =
    useState<any | null>(null);

  const [newPlaylistName, setNewPlaylistName] =
    useState("");


  const fetchPaginatedEpisodes = useCallback(
    async (offset: number, limit: number) => {
      return await fetchPodcastEpisodes(
        show.id,
        offset,
        limit
      );
    },
    [show.id]
  );


  const {
    data: episodes,
    isFetchingMore,
    hasMore,
    fetchData,
  } = usePaginatedData(
    fetchPaginatedEpisodes,
    50
  );


  useEffect(() => {
    const loadPlaylists = async () => {
      const stored =
        await AsyncStorage.getItem("playlists");

      if (stored) {
        setPlaylists(JSON.parse(stored));
      }
    };

    loadPlaylists();
  }, []);


  const savePlaylists = async (updated: any[]) => {
    await AsyncStorage.setItem(
      "playlists",
      JSON.stringify(updated)
    );

    setPlaylists(updated);
  };


  const openModal = (episode: any) => {
    setSelectedEpisode(episode);
    setModalVisible(true);
  };


  const closeAllModals = () => {
    setModalVisible(false);
    setNewPlaylistModalVisible(false);
    setExistingPlaylistModalVisible(false);
    setSelectedEpisode(null);
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
      songs: [selectedEpisode],
    };

    const updated = [
      ...playlists,
      newPlaylist,
    ];

    savePlaylists(updated);

    Toast.show({
      type: "success",
      text1: `Created ${newPlaylistName}`,
      text2: "Episode added.",
    });

    setNewPlaylistName("");

    closeAllModals();
  };


  const handleAddToExisting = (
    playlistIndex: number
  ) => {
    const updated = [...playlists];

    const playlist =
      updated[playlistIndex];

    const alreadyIn =
      playlist.songs.some(
        (song: any) =>
          song.id === selectedEpisode?.id
      );

    if (alreadyIn) {
      Toast.show({
        type: "info",
        text1: "Episode already in playlist",
      });
    } else {
      playlist.songs.push(selectedEpisode);

      savePlaylists(updated);

      Toast.show({
        type: "success",
        text1: `Added to ${playlist.name}`,
      });
    }

    closeAllModals();
  };


  const formatDuration = (
    durationMs: number
  ) => {
    if (!durationMs) {
      return "Duration unknown";
    }

    const totalMinutes =
      Math.floor(durationMs / 60000);

    const hours =
      Math.floor(totalMinutes / 60);

    const minutes =
      totalMinutes % 60;

    return hours > 0
      ? `${hours}h ${minutes}m`
      : `${minutes}m`;
  };


  const handlePlay = (
    item: any,
    index: number
  ) => {
    if (!item.audio_preview_url) {
      Alert.alert(
        "Playback not available",
        "This episode does not have a preview."
      );

      return;
    }

    setPreviewUrl(
      item.audio_preview_url
    );

    setActiveEpisode(item);

    setCurrentIndex(index);
  };


  const handleNextEpisode = () => {
    if (
      currentIndex !== null &&
      currentIndex < episodes.length - 1
    ) {
      const next =
        episodes[currentIndex + 1];

      if (!next.audio_preview_url) {
        return;
      }

      setCurrentIndex(
        currentIndex + 1
      );

      setActiveEpisode(next);

      setPreviewUrl(
        next.audio_preview_url
      );
    }
  };


  const handlePreviousEpisode = () => {
    if (
      currentIndex !== null &&
      currentIndex > 0
    ) {
      const previous =
        episodes[currentIndex - 1];

      if (!previous.audio_preview_url) {
        return;
      }

      setCurrentIndex(
        currentIndex - 1
      );

      setActiveEpisode(previous);

      setPreviewUrl(
        previous.audio_preview_url
      );
    }
  };


  const renderEpisode = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => {
    const isCurrent =
      currentIndex === index;

    return (
      <View style={styles.songCard}>

        <Image
          source={{
            uri: item.images?.[0]?.url,
          }}
          style={styles.songImage}
        />

        <View style={styles.songDetails}>

          <Text style={styles.songTitle}>
            {item.name.length > 25
              ? item.name.slice(0, 25) + "..."
              : item.name}
          </Text>

          <Text style={styles.songArtist}>
            {formatDuration(
              item.duration_ms
            )}
          </Text>

        </View>

        <TouchableOpacity
          onPress={() =>
            handlePlay(item, index)
          }
        >
          <Ionicons
            name={
              isCurrent
                ? "play-circle"
                : "play-circle"
            }
            size={28}
            color="#1DB954"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            openModal(item)
          }
        >
          <Ionicons
            name="add-circle"
            size={28}
            color="#1DB954"
          />
        </TouchableOpacity>

      </View>
    );
  };


  return (
    <SafeAreaView
      style={styles.safeAreaContainer}
    >

      {/* Header */}

      <View style={styles.headerContainer}>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate("Podcasts")
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
          {show.name} -{" "}
          {show.total_episodes} Episodes
        </Text>

      </View>


      {/* About */}

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
            : show.description.slice(
                0,
                250
              ) +
              (show.description.length > 250
                ? "..."
                : "")}
        </Text>

        {show.description.length > 250 && (
          <TouchableOpacity
            onPress={() =>
              setShowFullDescription(
                !showFullDescription
              )
            }
          >
            <Text
              style={{
                color: "#1DB954",
                marginTop: 4,
                fontWeight: "600",
              }}
            >
              {showFullDescription
                ? "Show less"
                : "Show more"}
            </Text>
          </TouchableOpacity>
        )}

      </View>


      {/* Episodes title */}

      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          marginBottom: 10,
          paddingHorizontal: 16,
        }}
      >
        All Episodes
      </Text>


      {/* Episodes */}

      <FlatList
        data={episodes}
        keyExtractor={(item) => item.id}
        renderItem={renderEpisode}
        onEndReached={() => {
          if (
            hasMore &&
            !isFetchingMore
          ) {
            fetchData();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingMore ? (
            <View
              style={{
                paddingVertical: 16,
              }}
            >
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
              No more episodes
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
                setNewPlaylistModalVisible(
                  true
                );
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


      {/* Existing Playlist Modal */}

      <Modal
        transparent
        visible={
          existingPlaylistModalVisible
        }
        animationType="slide"
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


      {/* Audio Player */}

      {activeEpisode && (
        <AudioPlayer
          previewUrl={previewUrl}
          songName={activeEpisode.name}
          artistName={show.publisher}
          onClose={() => {
            setPreviewUrl("");
            setActiveEpisode(null);
            setCurrentIndex(null);
          }}
          onNext={handleNextEpisode}
          onPrevious={
            handlePreviousEpisode
          }
          disableNext={
            currentIndex ===
            episodes.length - 1
          }
          disablePrevious={
            currentIndex === 0
          }
        />
      )}

    </SafeAreaView>
  );
};


export default PodcastEpisodes;


