import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ITunesMediaItem } from "../services/itunesService";
import { fetchPodcasts } from "../services/itunesService";
import { styles } from "../styles/style";

const categories = ["Comedy", "Technology", "Sports", "Health", "Finance", "News"];

const Podcasts = () => {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Comedy");
  const [podcasts, setPodcasts] = useState<ITunesMediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const search = async (term: string) => {
    try {
      setLoading(true);
      setPodcasts(await fetchPodcasts(term.trim() || selectedCategory));
    } catch (error) {
      console.error("Failed to load podcasts:", error);
      setPodcasts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setSearchQuery(""); void search(selectedCategory); }, [selectedCategory]);

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.navigate("AppTabs")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Podcasts</Text>
        <Picker selectedValue={selectedCategory} onValueChange={setSelectedCategory}
          mode="dropdown" style={{ height: 32, width: 110, marginLeft: "auto" }}>
          {categories.map((category) => <Picker.Item key={category} label={category} value={category} />)}
        </Picker>
      </View>

      <View style={styles.searchContainer}>
        <TextInput placeholder="Search podcasts..." value={searchQuery} onChangeText={setSearchQuery}
          onSubmitEditing={() => void search(searchQuery)} returnKeyType="search" style={styles.searchInput} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1DB954" /></View>
      ) : podcasts.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 50, color: "gray" }}>No results found.</Text>
      ) : (
        <FlatList data={podcasts} keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.songCard}
              onPress={() => navigation.navigate("PodcastEpisodes", { podcast: JSON.stringify(item) })}>
              {item.artworkUrl && <Image source={{ uri: item.artworkUrl }} style={styles.songImage} />}
              <View style={styles.songDetails}>
                <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.songArtist} numberOfLines={1}>{item.creator}</Text>
              </View>
              {/* A podcast show has no audio URL. Its episodes may have playable audio. */}
              <Ionicons name="chevron-forward" size={24} color="#1DB954" />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default Podcasts;


