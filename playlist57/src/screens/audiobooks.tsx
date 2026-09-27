import { Ionicons } from "@expo/vector-icons";
import {
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AudioPlayer from "../components/AudioPlayer";
import type { ITunesMediaItem } from "../services/itunesService";
import { fetchAudiobooks } from "../services/itunesService";
import { styles } from "../styles/style";

const DEFAULT_AUDIOBOOK_SEARCH = "bestsellers";

const Audiobooks = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const [searchQuery, setSearchQuery] = useState("");
  const [audiobooks, setAudiobooks] = useState<ITunesMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBook, setActiveBook] =
    useState<ITunesMediaItem | null>(null);

  const search = async (term = searchQuery) => {
    const cleanTerm = term.trim() || DEFAULT_AUDIOBOOK_SEARCH;

    try {
      setLoading(true);
      setAudiobooks(await fetchAudiobooks(cleanTerm));
    } catch (error) {
      console.error("Failed to load audiobooks:", error);
      setAudiobooks([]);
    } finally {
      setLoading(false);
    }
  };

  // Load bestseller results while keeping the search input empty.
  useEffect(() => {
    void search(DEFAULT_AUDIOBOOK_SEARCH);
  }, []);

  // Remove this screen's player when navigating to another screen.
  useEffect(() => {
    if (!isFocused) {
      setActiveBook(null);
    }
  }, [isFocused]);

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate("AppTabs")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Audiobooks</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search audiobooks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => void search()}
          returnKeyType="search"
          style={styles.searchInput}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
        </View>
      ) : audiobooks.length === 0 ? (
        <Text
          style={{
            textAlign: "center",
            marginTop: 50,
            color: "gray",
          }}
        >
          No results found.
        </Text>
      ) : (
        <FlatList
          data={audiobooks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            activeBook ? { paddingBottom: 220 } : undefined
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.songCard}
              onPress={() =>
                navigation.navigate("AudiobookChapters", {
                  audiobook: JSON.stringify(item),
                })
              }
            >
              {item.artworkUrl && (
                <Image
                  source={{ uri: item.artworkUrl }}
                  style={styles.songImage}
                />
              )}

              <View style={styles.songDetails}>
                <Text style={styles.songTitle} numberOfLines={1}>
                  {item.title}
                </Text>

                <Text style={styles.songArtist} numberOfLines={1}>
                  {item.creator}
                </Text>
              </View>

              {item.audioUrl && (
                <TouchableOpacity
                  onPress={(event) => {
                    event.stopPropagation();
                    setActiveBook(item);
                  }}
                >
                  <Ionicons
                    name="play-circle"
                    size={28}
                    color="#1DB954"
                  />
                </TouchableOpacity>
              )}

              <Ionicons
                name="chevron-forward"
                size={22}
                color="gray"
              />
            </TouchableOpacity>
          )}
        />
      )}

      {isFocused && activeBook?.audioUrl && (
        <AudioPlayer
          previewUrl={activeBook.audioUrl}
          songName={activeBook.title}
          artistName={activeBook.creator}
          onClose={() => setActiveBook(null)}
          onNext={() => {}}
          onPrevious={() => {}}
          disableNext
          disablePrevious
          sourceAttribution="Preview provided by Apple"
          sourceLabel="Apple Books"
          sourceUrl={activeBook.externalUrl}
        />
      )}
    </SafeAreaView>
  );
};

export default Audiobooks;






