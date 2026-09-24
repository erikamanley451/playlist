import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import AudioPlayer from "../components/AudioPlayer";
import { auth } from "../services/firebase";
import type { ITunesMediaItem } from "../services/itunesService";
import { fetchPodcastEpisodes } from "../services/itunesService";
import type { StoredPlaylist } from "../services/playlistStorage";
import { createPlaylist, loadPlaylists, savePlaylists } from "../services/playlistStorage";
import { styles } from "../styles/style";

const PodcastEpisodes = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const isFocused = useIsFocused();
  const { podcast } = route.params as { podcast: string };
  const show: ITunesMediaItem = JSON.parse(podcast);

  const [uid, setUid] = useState(auth.currentUser?.uid ?? null);
  const [episodes, setEpisodes] = useState<ITunesMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEpisode, setActiveEpisode] = useState<ITunesMediaItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [playlists, setPlaylists] = useState<StoredPlaylist[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<ITunesMediaItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlaylistModalVisible, setNewPlaylistModalVisible] = useState(false);
  const [existingPlaylistModalVisible, setExistingPlaylistModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (user) => setUid(user?.uid ?? null)), []);
  useEffect(() => {
    fetchPodcastEpisodes(show)
      .then(setEpisodes)
      .catch((error) => { console.error("Failed to load episodes:", error); setEpisodes([]); })
      .finally(() => setLoading(false));
  }, [podcast]);
  useEffect(() => {
    if (uid) loadPlaylists(uid).then(setPlaylists).catch(console.error);
    else setPlaylists([]);
  }, [uid]);

  useEffect(() => {
    if (!isFocused) {
      setActiveEpisode(null);
      setCurrentIndex(null);
    }
  }, [isFocused]);

  const persist = async (updated: StoredPlaylist[]) => {
    if (!uid) { Toast.show({ type: "error", text1: "Please sign in first." }); return false; }
    await savePlaylists(uid, updated);
    setPlaylists(updated);
    return true;
  };

  const closeAllModals = () => {
    setModalVisible(false);
    setNewPlaylistModalVisible(false);
    setExistingPlaylistModalVisible(false);
    setSelectedEpisode(null);
  };

  const openModal = (episode: ITunesMediaItem) => {
    setSelectedEpisode(episode);
    setModalVisible(true);
  };

  const handleCreatePlaylist = async () => {
    const name = newPlaylistName.trim();
    if (!name || !selectedEpisode) return;
    if (playlists.some((p) => p.name.toLowerCase() === name.toLowerCase()))
      return Toast.show({ type: "error", text1: "Playlist already exists." });
    if (await persist([...playlists, createPlaylist(name, selectedEpisode)])) {
      Toast.show({ type: "success", text1: `Created ${name}` });
      setNewPlaylistName("");
      closeAllModals();
    }
  };

  const handleAddToExisting = async (index: number) => {
    if (!selectedEpisode) return;
    const exists = playlists[index].songs.some((item) => item.id === selectedEpisode.id);
    if (exists) {
      Toast.show({ type: "info", text1: "Episode already in playlist" });
      return closeAllModals();
    }
    const updated = playlists.map((playlist, playlistIndex) =>
      playlistIndex === index ? { ...playlist, songs: [...playlist.songs, selectedEpisode] } : playlist
    );
    if (await persist(updated)) Toast.show({ type: "success", text1: `Added to ${playlists[index].name}` });
    closeAllModals();
  };

  const playableIndex = (start: number, direction: 1 | -1) => {
    for (let index = start + direction; index >= 0 && index < episodes.length; index += direction) {
      if (episodes[index].audioUrl) return index;
    }
    return null;
  };

  const playAt = (index: number) => {
    if (!episodes[index]?.audioUrl) return;
    setCurrentIndex(index);
    setActiveEpisode(episodes[index]);
  };

  const formatDuration = (durationMs: number | null) => {
    if (!durationMs) return "Duration unknown";
    const totalMinutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    return hours ? `${hours}h ${totalMinutes % 60}m` : `${totalMinutes}m`;
  };

  const description = show.description || "Podcast episodes from the iTunes Search API.";

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.navigate("Podcasts")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{show.title}</Text>
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 6 }}>About</Text>
        <Text style={{ fontSize: 16, color: "#444", lineHeight: 22 }}>
          {showFullDescription ? description : description.slice(0, 250) + (description.length > 250 ? "..." : "")}
        </Text>
        {description.length > 250 && (
          <TouchableOpacity onPress={() => setShowFullDescription((value) => !value)}>
            <Text style={{ color: "#1DB954", marginTop: 4, fontWeight: "600" }}>
              {showFullDescription ? "Show less" : "Show more"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 10, paddingHorizontal: 16 }}>Episodes</Text>

      {loading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1DB954" /></View>
      ) : episodes.length === 0 ? (
        <Text style={{ textAlign: "center", color: "gray", padding: 20 }}>No episodes were returned.</Text>
      ) : (
        <FlatList data={episodes} keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View style={styles.songCard}>
              {item.artworkUrl && <Image source={{ uri: item.artworkUrl }} style={styles.songImage} />}
              <View style={styles.songDetails}>
                <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.songArtist}>{formatDuration(item.durationMs)}</Text>
              </View>
              {item.audioUrl && (
                <TouchableOpacity onPress={() => playAt(index)}>
                  <Ionicons name="play-circle" size={28} color="#1DB954" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => openModal(item)}>
                <Ionicons name="add-circle" size={28} color="#1DB954" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal transparent visible={modalVisible} animationType="fade">
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

      <Modal transparent visible={newPlaylistModalVisible} animationType="slide">
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create New Playlist</Text>
          <TextInput style={styles.input} placeholder="Playlist Name" value={newPlaylistName} onChangeText={setNewPlaylistName} />
          <TouchableOpacity style={styles.modalButton} onPress={() => void handleCreatePlaylist()}>
            <Text style={styles.modalButtonText}>Create</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={closeAllModals}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
        </View></View>
      </Modal>

      <Modal transparent visible={existingPlaylistModalVisible} animationType="slide">
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Playlist</Text>
          {playlists.map((playlist, index) => (
            <TouchableOpacity key={playlist.id} style={styles.modalButton} onPress={() => void handleAddToExisting(index)}>
              <Text style={styles.modalButtonText}>{playlist.name}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={closeAllModals}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
        </View></View>
      </Modal>

      {isFocused && activeEpisode?.audioUrl && currentIndex !== null && (
        <AudioPlayer previewUrl={activeEpisode.audioUrl} songName={activeEpisode.title} artistName={show.title}
          onClose={() => { setActiveEpisode(null); setCurrentIndex(null); }}
          onNext={() => { const next = playableIndex(currentIndex, 1); if (next !== null) playAt(next); }}
          onPrevious={() => { const previous = playableIndex(currentIndex, -1); if (previous !== null) playAt(previous); }}
          disableNext={playableIndex(currentIndex, 1) === null}
          disablePrevious={playableIndex(currentIndex, -1) === null} />
      )}
    </SafeAreaView>
  );
};

export default PodcastEpisodes;


