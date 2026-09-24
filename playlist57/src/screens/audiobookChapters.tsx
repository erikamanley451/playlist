import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { Image, Linking, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import AudioPlayer from "../components/AudioPlayer";
import { auth } from "../services/firebase";
import type { ITunesMediaItem } from "../services/itunesService";
import type { StoredPlaylist } from "../services/playlistStorage";
import { createPlaylist, loadPlaylists, savePlaylists } from "../services/playlistStorage";
import { styles } from "../styles/style";

const AudiobookChapters = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const isFocused = useIsFocused();
  const { audiobook } = route.params as { audiobook: string };
  const book: ITunesMediaItem = JSON.parse(audiobook);

  const [uid, setUid] = useState(auth.currentUser?.uid ?? null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlaylistModalVisible, setNewPlaylistModalVisible] = useState(false);
  const [existingPlaylistModalVisible, setExistingPlaylistModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [playlists, setPlaylists] = useState<StoredPlaylist[]>([]);

  useEffect(() => onAuthStateChanged(auth, (user) => setUid(user?.uid ?? null)), []);
  useEffect(() => {
    if (uid) loadPlaylists(uid).then(setPlaylists).catch(console.error);
    else setPlaylists([]);
  }, [uid]);
  useEffect(() => {
    if (!isFocused) setPlaying(false);
  }, [isFocused]);

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
  };

  const handleCreatePlaylist = async () => {
    const name = newPlaylistName.trim();
    if (!name) return Toast.show({ type: "error", text1: "Please enter a playlist name." });
    if (playlists.some((p) => p.name.toLowerCase() === name.toLowerCase()))
      return Toast.show({ type: "error", text1: "Playlist already exists." });

    const updated = [...playlists, createPlaylist(name, book)];
    if (await persist(updated)) {
      Toast.show({ type: "success", text1: `Created ${name}` });
      setNewPlaylistName("");
      closeAllModals();
    }
  };

  const handleAddToExisting = async (index: number) => {
    const updated = playlists.map((playlist, playlistIndex) => {
      if (playlistIndex !== index) return playlist;
      if (playlist.songs.some((item) => item.id === book.id)) return playlist;
      return { ...playlist, songs: [...playlist.songs, book] };
    });
    if (playlists[index].songs.some((item) => item.id === book.id)) {
      Toast.show({ type: "info", text1: "Audiobook already in playlist" });
    } else if (await persist(updated)) {
      Toast.show({ type: "success", text1: `Added to ${playlists[index].name}` });
    }
    closeAllModals();
  };

  const description = book.description || "No description is available.";

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.navigate("Audiobooks")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{book.title}</Text>
      </View>

      <View style={{ alignItems: "center", padding: 16 }}>
        {book.artworkUrl && <Image source={{ uri: book.artworkUrl }} style={[styles.songImage, { width: 150, height: 150 }]} />}
        <Text style={[styles.songTitle, { marginTop: 12, textAlign: "center" }]}>{book.title}</Text>
        <Text style={styles.songArtist}>{book.creator}</Text>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
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

      <View style={[styles.songCard, { marginTop: 20 }]}>
        <View style={styles.songDetails}>
          <Text style={styles.songTitle}>Audiobook preview</Text>
          <Text style={styles.songArtist}>{book.audioUrl ? "Preview available" : "Preview unavailable"}</Text>
        </View>
        {book.audioUrl && (
          <TouchableOpacity onPress={() => setPlaying(true)}>
            <Ionicons name="play-circle" size={28} color="#1DB954" />
          </TouchableOpacity>
        )}
        {book.externalUrl && (
          <TouchableOpacity onPress={() => Linking.openURL(book.externalUrl!)}>
            <Ionicons name="open-outline" size={25} color="#1DB954" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={28} color="#1DB954" />
        </TouchableOpacity>
      </View>

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

      {isFocused && playing && book.audioUrl && (
        <AudioPlayer previewUrl={book.audioUrl} songName={book.title} artistName={book.creator}
          onClose={() => setPlaying(false)} onNext={() => {}} onPrevious={() => {}}
          disableNext disablePrevious />
      )}
    </SafeAreaView>
  );
};

export default AudiobookChapters;


