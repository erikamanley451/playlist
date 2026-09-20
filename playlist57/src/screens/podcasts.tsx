
import {
  useCallback,
  useState,
} from "react";

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

import { Ionicons } from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native";

import { SafeAreaView } from "react-native-safe-area-context";

import { Picker } from "@react-native-picker/picker";

import { styles } from "../styles/style";

import { fetchPodcasts } from "../services/spotifyService";

import usePaginatedData from "../hooks/usePaginatedData";


const Podcasts = () => {
  const navigation = useNavigation<any>();

  const [searchQuery, setSearchQuery] =
    useState("");

  const [showFullName, setShowFullName] =
    useState(false);

  const [selectedCategory, setSelectedCategory] =
    useState("Comedy");


  // Fetch podcasts based on category
  const fetchFunction = useCallback(
    (offset = 0, limit = 50) =>
      fetchPodcasts(
        selectedCategory,
        offset,
        limit
      ),
    [selectedCategory]
  );


  const {
    data: podcasts,
    isFetchingMore,
    hasMore,
    fetchData: fetchMorePodcasts,
  } = usePaginatedData(
    fetchFunction,
    50
  );


  // Filter podcasts by title or publisher
  const filteredPodcasts =
    podcasts.filter((item: any) => {
      const title = item?.name || "";
      const publisher =
        item?.publisher || "";

      return (
        title
          .toLowerCase()
          .includes(
            searchQuery.toLowerCase()
          ) ||
        publisher
          .toLowerCase()
          .includes(
            searchQuery.toLowerCase()
          )
      );
    });


  // Loading indicator
  if (
    podcasts.length === 0 &&
    isFetchingMore
  ) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#1DB954"
        />
      </View>
    );
  }


  return (
    <SafeAreaView
      style={styles.safeAreaContainer}
    >

      {/* Header */}

      <View style={styles.headerContainer}>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate("AppTabs")
          }
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="black"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Podcasts
        </Text>


        {/* Category Picker */}

        <Picker
          selectedValue={selectedCategory}
          onValueChange={(itemValue) =>
            setSelectedCategory(itemValue)
          }
          mode="dropdown"
          style={{
            height: 32,
            width: 92,
            marginLeft: 70,
          }}
        >
          <Picker.Item
            label="Comedy"
            value="Comedy"
          />

          <Picker.Item
            label="Technology"
            value="Technology"
          />

          <Picker.Item
            label="Sports"
            value="Sports"
          />

          <Picker.Item
            label="Health"
            value="Health"
          />

          <Picker.Item
            label="Finance"
            value="Finance"
          />

          <Picker.Item
            label="News"
            value="News"
          />
        </Picker>

      </View>


      {/* Search */}

      <View style={styles.searchContainer}>

        <TextInput
          placeholder="Search podcasts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />

      </View>


      {/* Podcast List */}

      {filteredPodcasts.length === 0 ? (

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
          data={filteredPodcasts}

          keyExtractor={(item: any) =>
            item.id
          }

          renderItem={({
            item,
          }: {
            item: any;
          }) => (

            <View>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate(
                    "PodcastEpisodes",
                    {
                      podcast:
                        JSON.stringify(item),
                    }
                  )
                }
                style={styles.songCard}
              >

                {/* Podcast Image */}

                <Image
                  source={{
                    uri:
                      item.images?.[0]?.url,
                  }}
                  style={styles.songImage}
                />


                {/* Podcast Information */}

                <View
                  style={styles.songDetails}
                >

                  <Text
                    style={styles.songTitle}
                  >
                    {showFullName
                      ? item.name
                      : item.name.slice(
                          0,
                          25
                        ) +
                        (item.name.length >
                        25
                          ? "..."
                          : "")}
                  </Text>


                  <Text
                    style={styles.songArtist}
                  >
                    {showFullName
                      ? item.publisher
                      : item.publisher.slice(
                          0,
                          25
                        ) +
                        (item.publisher.length >
                        25
                          ? "..."
                          : "")}
                  </Text>

                </View>


                {/* Open Spotify */}

                <TouchableOpacity
                  onPress={() => {
                    if (
                      item.external_urls
                        ?.spotify
                    ) {
                      Linking.openURL(
                        item.external_urls
                          .spotify
                      );
                    }
                  }}
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

          onEndReached={() => {
            if (
              hasMore &&
              !isFetchingMore
            ) {
              fetchMorePodcasts();
            }
          }}

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
                No more songs
              </Text>

            ) : null
          }
        />

      )}

    </SafeAreaView>
  );
};


export default Podcasts;


