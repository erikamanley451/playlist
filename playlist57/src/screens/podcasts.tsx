import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ITunesMediaItem } from "../services/itunesService";
import {
  fetchPodcasts,
  fetchTopPodcasts,
} from "../services/itunesService";
import { styles } from "../styles/style";

const PODCAST_CATEGORIES = [
  "Comedy",
  "Fitness",
  "Technology",
  "Business",
  "Sports",
  "News",
] as const;

const Podcasts = () => {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string | null>("Top Shows");
  const [filterVisible, setFilterVisible] = useState(false);
  const [podcasts, setPodcasts] = useState<ITunesMediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTopShows = async () => {
    try {
      setLoading(true);
      setPodcasts(await fetchTopPodcasts());
      setSelectedFilter("Top Shows");
    } catch (error) {
      console.error("Failed to load Top Shows:", error);
      setPodcasts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTopShows();
  }, []);

  const search = async () => {
    const cleanTerm = searchQuery.trim();
    if (!cleanTerm) return void loadTopShows();

    try {
      setLoading(true);
      setSelectedFilter(null);
      setPodcasts(await fetchPodcasts(cleanTerm));
    } catch (error) {
      console.error("Failed to search podcasts:", error);
      setPodcasts([]);
    } finally {
      setLoading(false);
    }
  };

  const selectTopShows = () => {
    setSearchQuery("");
    setFilterVisible(false);
    void loadTopShows();
  };

  const selectCategory = async (category: string) => {
    setSearchQuery("");
    setFilterVisible(false);
    setSelectedFilter(category);

    try {
      setLoading(true);
      setPodcasts(await fetchPodcasts(category));
    } catch (error) {
      console.error(`Failed to load ${category} podcasts:`, error);
      setPodcasts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate("AppTabs")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Podcasts</Text>

        <TouchableOpacity
          onPress={() => setFilterVisible(true)}
          style={localStyles.filterButton}
        >
          <Ionicons name="filter-outline" size={25} color="#1DB954" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search podcasts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => void search()}
          returnKeyType="search"
          style={styles.searchInput}
        />
      </View>

      <Text style={localStyles.resultLabel}>
        {selectedFilter ? `Showing: ${selectedFilter}` : "Search results"}
      </Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
        </View>
      ) : podcasts.length === 0 ? (
        <Text style={localStyles.emptyText}>No results found.</Text>
      ) : (
        <FlatList
          data={podcasts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.songCard}
              onPress={() =>
                navigation.navigate("PodcastEpisodes", {
                  podcast: JSON.stringify(item),
                })
              }
            >
              {item.artworkUrl && (
                <Image source={{ uri: item.artworkUrl }} style={styles.songImage} />
              )}
              <View style={styles.songDetails}>
                <Text style={styles.songTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.songArtist} numberOfLines={1}>
                  {item.creator}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#1DB954" />
            </TouchableOpacity>
          )}
        />
      )}

      <Modal
        visible={filterVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={localStyles.modalOverlay}
          onPress={() => setFilterVisible(false)}
        >
          <View style={localStyles.filterModal}>
            <Text style={localStyles.filterTitle}>Filter Podcasts</Text>

            <FilterOption
              label="Top Shows"
              selected={selectedFilter === "Top Shows"}
              onPress={selectTopShows}
            />

            {PODCAST_CATEGORIES.map((category) => (
              <FilterOption
                key={category}
                label={category}
                selected={selectedFilter === category}
                onPress={() => void selectCategory(category)}
              />
            ))}

            <TouchableOpacity
              style={localStyles.cancelButton}
              onPress={() => setFilterVisible(false)}
            >
              <Text style={localStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const FilterOption = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[localStyles.filterOption, selected && localStyles.selectedOption]}
    onPress={onPress}
  >
    <Text style={[localStyles.filterText, selected && localStyles.selectedText]}>
      {label}
    </Text>
    {selected && <Ionicons name="checkmark" size={22} color="#1DB954" />}
  </TouchableOpacity>
);

const localStyles = StyleSheet.create({
  filterButton: {
    marginLeft: "auto",
    padding: 8,
  },
  resultLabel: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    color: "#666",
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "gray",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 24,
  },
  filterModal: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  selectedOption: {
    backgroundColor: "#EAF8EF",
  },
  filterText: {
    fontSize: 16,
    color: "#222",
  },
  selectedText: {
    color: "#1DB954",
    fontWeight: "700",
  },
  cancelButton: {
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 12,
  },
  cancelText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Podcasts;


