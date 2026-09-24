import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Linking, SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import AudioPlayer from "../components/AudioPlayer";
import { auth } from "../services/firebase";
import type { ITunesMediaItem } from "../services/itunesService";
import { loadPlaylists, savePlaylists } from "../services/playlistStorage";
import type { StoredPlaylist } from "../services/playlistStorage";
import { styles } from "../styles/style";

const PlaylistSongs = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { playlist } = route.params as { playlist?: string };
  const passedPlaylist = useMemo<StoredPlaylist | null>(() => {
    if (!playlist) return null;
    try { return JSON.parse(playlist); }
    catch { return null; }
  }, [playlist]);

  const [uid, setUid] = useState(auth.currentUser?.uid ?? null);
  const [songs, setSongs] = useState<ITunesMediaItem[]>([]);
  const [activeItem, setActiveItem] = useState<ITunesMediaItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (user) => setUid(user?.uid ?? null)), []);
  useEffect(() => {
    if (!uid || !passedPlaylist) { setSongs([]); setLoading(false); return; }
    setLoading(true);
    loadPlaylists(uid)
      .then((all) => {
        const current = all.find((item) => item.id === passedPlaylist.id) ??
          all.find((item) => item.name === passedPlaylist.name);
        setSongs(current?.songs ?? []);
      })
      .catch((error) => { console.error("Failed to load playlist:", error); setSongs([]); })
      .finally(() => setLoading(false));
  }, [uid, passedPlaylist]);

  const playableIndex = (start: number, direction: 1 | -1) => {
    for (let index = start + direction; index >= 0 && index < songs.length; index += direction) {
      if (songs[index].audioUrl) return index;
    }
    return null;
  };

  const playAt = (index: number) => {
    if (!songs[index]?.audioUrl) return;
    setCurrentIndex(index);
    setActiveItem(songs[index]);
  };

  const handleDelete = async (indexToRemove: number) => {
    if (!uid || !passedPlaylist) return;
    const updatedSongs = songs.filter((_, index) => index !== indexToRemove);
    const playlists = await loadPlaylists(uid);
    const updatedPlaylists = playlists.map((item) => {
      const matches = passedPlaylist.id ? item.id === passedPlaylist.id : item.name === passedPlaylist.name;
      return matches ? { ...item, songs: updatedSongs } : item;
    });
    await savePlaylists(uid, updatedPlaylists);
    setSongs(updatedSongs);

    if (currentIndex === indexToRemove) {
      setActiveItem(null);
      setCurrentIndex(null);
    } else if (currentIndex !== null && indexToRemove < currentIndex) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{passedPlaylist?.name || "Playlist"}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1DB954" style={{ marginTop: 50 }} />
      ) : songs.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 50 }}>No media in this playlist.</Text>
      ) : (
        <FlatList data={songs} keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View style={styles.songCard}>
              {item.artworkUrl && <Image source={{ uri: item.artworkUrl }} style={styles.songImage} />}
              <View style={styles.songDetails}>
                <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.songArtist} numberOfLines={1}>{item.creator}</Text>
              </View>
              {item.audioUrl ? (
                <TouchableOpacity onPress={() => playAt(index)}>
                  <Ionicons name="play-circle" size={28} color="#1DB954" />
                </TouchableOpacity>
              ) : item.externalUrl ? (
                <TouchableOpacity onPress={() => Linking.openURL(item.externalUrl!)}>
                  <Ionicons name="open-outline" size={24} color="#1DB954" />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={() => void handleDelete(index)}>
                <Ionicons name="trash" size={24} color="red" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {activeItem?.audioUrl && currentIndex !== null && (
        <AudioPlayer previewUrl={activeItem.audioUrl} songName={activeItem.title} artistName={activeItem.creator}
          onClose={() => { setActiveItem(null); setCurrentIndex(null); }}
          onNext={() => { const next = playableIndex(currentIndex, 1); if (next !== null) playAt(next); }}
          onPrevious={() => { const previous = playableIndex(currentIndex, -1); if (previous !== null) playAt(previous); }}
          disableNext={playableIndex(currentIndex, 1) === null}
          disablePrevious={playableIndex(currentIndex, -1) === null} />
      )}
    </SafeAreaView>
  );
};

export default PlaylistSongs;





