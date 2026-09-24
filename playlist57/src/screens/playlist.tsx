import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../services/firebase";
import type { ITunesMediaItem } from "../services/itunesService";
import { loadPlaylists, savePlaylists } from "../services/playlistStorage";
import type { StoredPlaylist } from "../services/playlistStorage";
import { styles } from "../styles/style";

const Playlist = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as { songToAdd?: string; mediaToAdd?: string } | undefined;
  const incomingParam = params?.mediaToAdd ?? params?.songToAdd;
  const incomingItem = useMemo<ITunesMediaItem | null>(() => {
    if (!incomingParam) return null;
    try { return JSON.parse(incomingParam); }
    catch { return null; }
  }, [incomingParam]);

  const [uid, setUid] = useState(auth.currentUser?.uid ?? null);
  const [playlists, setPlaylists] = useState<StoredPlaylist[]>([]);
  const [itemAdded, setItemAdded] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (user) => setUid(user?.uid ?? null)), []);
  useEffect(() => {
    if (uid) loadPlaylists(uid).then(setPlaylists).catch(console.error);
    else setPlaylists([]);
  }, [uid]);

  const persist = async (updated: StoredPlaylist[]) => {
    if (!uid) return Alert.alert("Not signed in", "Please sign in before changing playlists.");
    await savePlaylists(uid, updated);
    setPlaylists(updated);
  };

  const deletePlaylist = async (index: number) => {
    await persist(playlists.filter((_, playlistIndex) => playlistIndex !== index));
  };

  const addIncomingItem = async (index: number) => {
    if (!incomingItem) return;
    if (itemAdded) return Alert.alert("Media already added", "Choose one playlist per visit to this screen.");
    if (playlists[index].songs.some((item) => item.id === incomingItem.id))
      return Alert.alert("Already exists", "This media is already in the selected playlist.");

    const updated = playlists.map((playlist, playlistIndex) =>
      playlistIndex === index ? { ...playlist, songs: [...playlist.songs, incomingItem] } : playlist
    );
    await persist(updated);
    setItemAdded(true);
    Alert.alert("Added!", `Added to playlist “${playlists[index].name}”.`);
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Playlists</Text>
      </View>

      {playlists.length === 0 ? (
        <View style={styles.centeredContent}>
          <Text style={styles.emptyText}>No playlists found. Add media and create a playlist first.</Text>
        </View>
      ) : (
        <FlatList data={playlists} keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={styles.songCard}
              onPress={() => navigation.navigate("PlaylistSongs", { playlist: JSON.stringify(item) })}>
              <View style={{ flex: 1 }}>
                <Text style={styles.playlistName}>{item.name}</Text>
                <Text style={styles.playlistSongCount}>{item.songs.length} media item(s)</Text>
              </View>
              {incomingItem && !itemAdded && (
                <TouchableOpacity onPress={() => void addIncomingItem(index)}>
                  <Ionicons name="add-circle" size={28} color="#1DB954" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => void deletePlaylist(index)}>
                <Ionicons name="trash-outline" size={24} color="red" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default Playlist;


