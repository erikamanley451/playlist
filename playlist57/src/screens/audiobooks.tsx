
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import usePaginatedData from "../hooks/usePaginatedData";
import { fetchAudiobooks } from "../services/spotifyService";
import { styles } from "../styles/style";

const Audiobooks = () => {
  const navigation = useNavigation<any>();

  const [searchQuery, setSearchQuery] = useState("");
  const [showFullName] = useState(false);

  const {
    data: audiobooks,
    isFetchingMore,
    hasMore,
    fetchData: fetchMoreAudiobooks,
  } = usePaginatedData(fetchAudiobooks, 50);

  const filteredAudiobooks = audiobooks.filter((item) => {
    const title = item?.name || "";
    const publisher = item?.publisher || "";

    return (
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      publisher.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (audiobooks.length === 0 && isFetchingMore) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

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
          style={styles.searchInput}
        />
      </View>

      {filteredAudiobooks.length === 0 ? (
        <View style={{ padding: 20 }}>
          <Text
            style={{
              textAlign: "center",
              fontSize: 16,
              color: "gray",
            }}
          >
            No results found.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAudiobooks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View>
              <TouchableOpacity
                style={styles.songCard}
                onPress={() =>
                  navigation.navigate("AudiobookChapters", {
                    audiobook: JSON.stringify(item),
                  })
                }
              >
                <Image
                  source={{ uri: item.images?.[0]?.url }}
                  style={styles.songImage}
                />

                <View style={styles.songDetails}>
                  <Text style={styles.songTitle}>
                    {showFullName
                      ? item.name
                      : item.name.slice(0, 25) +
                        (item.name.length > 25 ? "..." : "")}
                  </Text>

                  <Text style={styles.songArtist}>
                    {showFullName
                      ? item.publisher
                      : item.publisher.slice(0, 25) +
                        (item.publisher.length > 25 ? "..." : "")}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(item.external_urls.spotify)
                  }
                >
                  <Ionicons
                    name="play-circle"
                    size={28}
                    color="#1DB954"
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          )}
          onEndReached={
            hasMore ? fetchMoreAudiobooks : undefined
          }
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            isFetchingMore ? (
              <ActivityIndicator
                size="small"
                color="#1DB954"
              />
            ) : !hasMore ? (
              <Text
                style={{
                  textAlign: "center",
                  padding: 10,
                  color: "gray",
                }}
              >
                No more audiobooks
              </Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

export default Audiobooks;





