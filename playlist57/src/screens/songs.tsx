import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import AudioPlayer from "../components/AudioPlayer";
import SearchBar from "../components/searchBar";
import { auth } from "../services/firebase";
import type { ITunesMediaItem } from "../services/itunesService";
import { fetchSongs, fetchTopSongs } from "../services/itunesService";
import type { StoredPlaylist } from "../services/playlistStorage";
import { createPlaylist, loadPlaylists, savePlaylists } from "../services/playlistStorage";
import { styles } from "../styles/style";

const Songs = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const isFocused = useIsFocused();
  const initialQuery = (route.params as { initialQuery?: string } | undefined)?.initialQuery;
  const [searchQuery, setSearchQuery] = useState(initialQuery ?? "");
  const [songs, setSongs] = useState<ITunesMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSong, setActiveSong] = useState<ITunesMediaItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [uid, setUid] = useState(auth.currentUser?.uid ?? null);
  const [playlists, setPlaylists] = useState<StoredPlaylist[]>([]);
  const [selectedSong, setSelectedSong] = useState<ITunesMediaItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlaylistModalVisible, setNewPlaylistModalVisible] = useState(false);
  const [existingPlaylistModalVisible, setExistingPlaylistModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const loadTopSongs = async () => {
    try { setLoading(true); setSongs(await fetchTopSongs()); }
    catch (error) { console.error("Failed to load top songs:", error); setSongs([]); }
    finally { setLoading(false); }
  };

  const search = async (term = searchQuery) => {
    const cleanTerm = term.trim();
    if (!cleanTerm) return loadTopSongs();

    try { setLoading(true); setSongs(await fetchSongs(cleanTerm)); }
    catch (error) { console.error("Failed to load songs:", error); setSongs([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    setSearchQuery(initialQuery ?? "");
    if (initialQuery?.trim()) void search(initialQuery);
    else void loadTopSongs();
  }, [initialQuery]);

  useEffect(() => onAuthStateChanged(auth, (user) => setUid(user?.uid ?? null)), []);

  useEffect(() => {
    if (uid) loadPlaylists(uid).then(setPlaylists).catch(console.error);
    else setPlaylists([]);
  }, [uid]);

  const closePlayer = () => {
    setActiveSong(null);
    setCurrentIndex(null);
  };

  useEffect(() => {
    if (!isFocused) closePlayer();
  }, [isFocused]);

  const playableIndex = (start: number, direction: 1 | -1) => {
    for (let index = start + direction; index >= 0 && index < songs.length; index += direction)
      if (songs[index].audioUrl) return index;
    return null;
  };
  const playAt = (index: number) => {
    if (!songs[index]?.audioUrl) return;
    setActiveSong(songs[index]);
    setCurrentIndex(index);
  };

  const persist = async (updated: StoredPlaylist[]) => {
    if (!uid) {
      Toast.show({ type: "error", text1: "Please sign in first." });
      return false;
    }
    await savePlaylists(uid, updated);
    setPlaylists(updated);
    return true;
  };

  const closeAllModals = () => {
    setModalVisible(false);
    setNewPlaylistModalVisible(false);
    setExistingPlaylistModalVisible(false);
    setSelectedSong(null);
  };

  const openAddModal = (song: ITunesMediaItem) => {
    setSelectedSong(song);
    setModalVisible(true);
  };

  const handleCreatePlaylist = async () => {
    const name = newPlaylistName.trim();

    if (!name || !selectedSong) {
      Toast.show({ type: "error", text1: "Please enter a playlist name." });
      return;
    }

    const playlistAlreadyExists = playlists.some(
      (playlist) =>
        playlist.name.trim().toLowerCase() === name.toLowerCase()
    );

    if (playlistAlreadyExists) {
      Toast.show({ type: "error", text1: "Playlist already exists." });
      return;
    }

    const updated = [...playlists, createPlaylist(name, selectedSong)];

    if (await persist(updated)) {
      setNewPlaylistName("");
      Toast.show({
        type: "success",
        text1: `Created ${name} — song added`,
        visibilityTime: 1500,
      });

      // Keep the modal mounted long enough for its Toast to be visible.
      setTimeout(closeAllModals, 1500);
    }
  };

  const handleAddToExisting = async (index: number) => {
    if (!selectedSong) return;

    const selectedPlaylist = playlists[index];

    if (
      selectedPlaylist.songs.some((item) => item.id === selectedSong.id)
    ) {
      Toast.show({
        type: "info",
        text1: "Song already in playlist",
        visibilityTime: 1200,
      });

      setTimeout(closeAllModals, 1200);

      return;
    }

    const updated = playlists.map((playlist, playlistIndex) =>
      playlistIndex === index
        ? { ...playlist, songs: [...playlist.songs, selectedSong] }
        : playlist
    );

    if (await persist(updated)) {
      Toast.show({
        type: "success",
        text1: `Added to ${selectedPlaylist.name}`,
        visibilityTime: 1200,
      });

      setTimeout(closeAllModals, 1200);

      return;
    }

    closeAllModals();
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.navigate("AppTabs")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Songs</Text>
      </View>
      <SearchBar
        placeholder="Search songs..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmit={() => void search()}
      />
      {loading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1DB954" /></View>
      ) : songs.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 50, color: "gray" }}>No results found.</Text>
      ) : (
        <FlatList data={songs} keyExtractor={(item) => item.id}
          contentContainerStyle={activeSong ? { paddingBottom: 190 } : undefined}
          renderItem={({ item, index }) => (
            <View style={styles.songCard}>
              {item.artworkUrl && <Image source={{ uri: item.artworkUrl }} style={styles.songImage} />}
              <View style={styles.songDetails}>
                <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.songArtist} numberOfLines={1}>{item.creator}</Text>
              </View>
              {item.audioUrl && (
                <TouchableOpacity onPress={() => playAt(index)}>
                  <Ionicons name="play-circle" size={28} color="#1DB954" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => openAddModal(item)}>
                <Ionicons name="add-circle" size={28} color="#1DB954" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
      {isFocused && activeSong?.audioUrl && currentIndex !== null && (
        <AudioPlayer
          previewUrl={activeSong.audioUrl}
          songName={activeSong.title}
          artistName={activeSong.creator}
          onClose={closePlayer}
          onNext={() => {
            const next = playableIndex(currentIndex, 1);
            if (next !== null) playAt(next);
          }}
          onPrevious={() => {
            const previous = playableIndex(currentIndex, -1);
            if (previous !== null) playAt(previous);
          }}
          disableNext={playableIndex(currentIndex, 1) === null}
          disablePrevious={playableIndex(currentIndex, -1) === null}
          sourceAttribution="Preview provided courtesy of iTunes"
          sourceLabel="Apple Music"
          sourceUrl={activeSong.externalUrl}
        />
      )}

      <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={closeAllModals}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>ADD TO</Text>
          <TouchableOpacity style={styles.modalButton} onPress={() => {
            setModalVisible(false);
            setExistingPlaylistModalVisible(true);
          }}>
            <Text style={styles.modalButtonText}>Existing Playlist</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalButton} onPress={() => {
            setModalVisible(false);
            setNewPlaylistModalVisible(true);
          }}>
            <Text style={styles.modalButtonText}>New Playlist</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={closeAllModals}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        </View>
      </Modal>

      <Modal transparent visible={newPlaylistModalVisible} animationType="slide" onRequestClose={closeAllModals}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create New Playlist</Text>
          <TextInput
            style={styles.input}
            placeholder="Playlist Name"
            value={newPlaylistName}
            onChangeText={setNewPlaylistName}
          />
          <TouchableOpacity style={styles.modalButton} onPress={() => void handleCreatePlaylist()}>
            <Text style={styles.modalButtonText}>Create</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={closeAllModals}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        {newPlaylistModalVisible && <Toast />}
        </View>
      </Modal>

      <Modal transparent visible={existingPlaylistModalVisible} animationType="slide" onRequestClose={closeAllModals}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Playlist</Text>
          {playlists.length === 0 ? (
            <Text style={{ color: "#666", textAlign: "center", marginVertical: 12 }}>
              No playlists yet. Create a new playlist first.
            </Text>
          ) : (
            playlists.map((playlist, index) => (
              <TouchableOpacity key={playlist.id} style={styles.modalButton}
                onPress={() => void handleAddToExisting(index)}>
                <Text style={styles.modalButtonText}>{playlist.name}</Text>
              </TouchableOpacity>
            ))
          )}
          <TouchableOpacity onPress={closeAllModals}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        {existingPlaylistModalVisible && <Toast />}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Songs;








































