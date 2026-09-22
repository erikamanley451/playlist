import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AudioPlayer from "../components/AudioPlayer";
import type { ITunesMediaItem } from "../services/itunesService";
import { fetchSongs, fetchTopSongs } from "../services/itunesService";
import { styles } from "../styles/style";

const Songs = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const initialQuery = (route.params as { initialQuery?: string } | undefined)?.initialQuery;
  const [searchQuery, setSearchQuery] = useState(initialQuery ?? "");
  const [songs, setSongs] = useState<ITunesMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSong, setActiveSong] = useState<ITunesMediaItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [playerVisible, setPlayerVisible] = useState(false);

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

  const playableIndex = (start: number, direction: 1 | -1) => {
    for (let index = start + direction; index >= 0 && index < songs.length; index += direction)
      if (songs[index].audioUrl) return index;
    return null;
  };
  const playAt = (index: number) => {
    if (!songs[index]?.audioUrl) return;
    setActiveSong(songs[index]);
    setCurrentIndex(index);
    setPlayerVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.navigate("AppTabs")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Songs</Text>
      </View>
      <View style={styles.searchContainer}>
        <TextInput style={styles.searchInput} placeholder="Search songs..." value={searchQuery}
          onChangeText={setSearchQuery} onSubmitEditing={() => void search()} returnKeyType="search" />
      </View>
      {loading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1DB954" /></View>
      ) : songs.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 50, color: "gray" }}>No results found.</Text>
      ) : (
        <FlatList data={songs} keyExtractor={(item) => item.id}
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
              <TouchableOpacity onPress={() => navigation.navigate("Playlist", { mediaToAdd: JSON.stringify(item) })}>
                <Ionicons name="add-circle" size={28} color="#1DB954" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
      {activeSong?.audioUrl && currentIndex !== null && (
      <AudioPlayer
        previewUrl={activeSong.audioUrl}
        songName={activeSong.title}
        artistName={activeSong.creator}
        visible={playerVisible}
        onClose={() => setPlayerVisible(false)}
        onNext={() => {
          if (currentIndex === null) return;
          const next = playableIndex(currentIndex, 1);
          if (next !== null) playAt(next);
        }}
        onPrevious={() => {
          if (currentIndex === null) return;
          const previous = playableIndex(currentIndex, -1);
          if (previous !== null) playAt(previous);
        }}
        disableNext={currentIndex === null || playableIndex(currentIndex, 1) === null}
        disablePrevious={currentIndex === null || playableIndex(currentIndex, -1) === null}
      />
      )}
    </SafeAreaView>
  );
};

export default Songs;

