
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Linking,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AudioPlayer from "../components/AudioPlayer";
import { styles } from "../styles/style";

const PlaylistSongs = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();

  const { playlist } = route.params as {
    playlist?: string;
  };

  const parsed = playlist ? JSON.parse(playlist) : null;

  const [songs, setSongs] = useState<any[]>(parsed?.songs || []);
  const [previewUrl, setPreviewUrl] = useState("");
  const [activeSong, setActiveSong] = useState<any | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  useEffect(() => {
    setSongs(parsed?.songs || []);
  }, [playlist]);

  const hasPreview = (item: any) =>
    item.preview_url ||
    item.audio_preview_url ||
    item.attributes?.previews?.[0]?.url;

  const getPreviewUrl = (item: any) =>
    item.preview_url ||
    item.audio_preview_url ||
    item.attributes?.previews?.[0]?.url;

  const getImageUrl = (item: any) =>
    item.album?.images?.[0]?.url ||
    item.images?.[0]?.url ||
    item.attributes?.artwork?.url
      ?.replace("{w}", "300")
      .replace("{h}", "300") ||
    item.snippet?.thumbnails?.medium?.url ||
    null;

  const getArtist = (item: any) =>
    item.artists?.[0]?.name ||
    item.publisher ||
    item.attributes?.artistName ||
    item.narrator ||
    item.snippet?.channelTitle ||
    item.show?.publisher ||
    "Unknown Artist";

  const getTitle = (item: any) =>
    item.name ||
    item.snippet?.title ||
    item.attributes?.name ||
    "Untitled";

  const findNextPlayableIndex = (
    startIndex: number
  ): number | null => {
    for (let i = startIndex + 1; i < songs.length; i++) {
      if (hasPreview(songs[i])) {
        return i;
      }
    }

    return null;
  };

  const findPreviousPlayableIndex = (
    startIndex: number
  ): number | null => {
    for (let i = startIndex - 1; i >= 0; i--) {
      if (hasPreview(songs[i])) {
        return i;
      }
    }

    return null;
  };

  const handlePlay = (item: any, index: number) => {
    const preview = getPreviewUrl(item);

    if (!preview) {
      return;
    }

    setPreviewUrl(preview);
    setActiveSong(item);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex === null) {
      return;
    }

    const nextIndex = findNextPlayableIndex(currentIndex);

    if (nextIndex !== null) {
      handlePlay(songs[nextIndex], nextIndex);
    }
  };

  const handlePrevious = () => {
    if (currentIndex === null) {
      return;
    }

    const previousIndex =
      findPreviousPlayableIndex(currentIndex);

    if (previousIndex !== null) {
      handlePlay(songs[previousIndex], previousIndex);
    }
  };

  const handleDelete = async (indexToRemove: number) => {
    const updated = [...songs];

    updated.splice(indexToRemove, 1);

    setSongs(updated);

    if (parsed?.name) {
      const stored =
        await AsyncStorage.getItem("playlists");

      if (stored) {
        const playlists = JSON.parse(stored);

        const playlistIndex = playlists.findIndex(
          (p: any) => p.name === parsed.name
        );

        if (playlistIndex !== -1) {
          playlists[playlistIndex].songs = updated;

          await AsyncStorage.setItem(
            "playlists",
            JSON.stringify(playlists)
          );
        }
      }
    }

    if (currentIndex === indexToRemove) {
      setActiveSong(null);
      setPreviewUrl("");
      setCurrentIndex(null);
    }
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => {
    const imageUrl = getImageUrl(item);
    const preview = getPreviewUrl(item);

    return (
      <View style={styles.songCard}>
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.songImage}
          />
        )}

        <View style={styles.songDetails}>
          <Text style={styles.songTitle}>
            {getTitle(item)}
          </Text>

          <Text style={styles.songArtist}>
            {getArtist(item)}
          </Text>
        </View>

        {preview ? (
          <TouchableOpacity
            onPress={() => handlePlay(item, index)}
          >
            <Ionicons
              name="play-circle"
              size={28}
              color="#1DB954"
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => {
              const url =
                item.external_urls?.spotify ||
                item.attributes?.url;

              if (url) {
                Linking.openURL(url);
              }
            }}
          >
            <Ionicons
              name="open-outline"
              size={24}
              color="#1DB954"
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => handleDelete(index)}
        >
          <Ionicons
            name="trash"
            size={24}
            color="red"
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="black"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {parsed?.name || "Playlist"}
        </Text>
      </View>

      {songs.length === 0 ? (
        <Text
          style={{
            textAlign: "center",
            marginTop: 50,
          }}
        >
          No media in this playlist.
        </Text>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item, index) =>
            item.id ||
            item.attributes?.url ||
            index.toString()
          }
          renderItem={renderItem}
        />
      )}

      {previewUrl && activeSong && (
        <AudioPlayer
          previewUrl={previewUrl}
          songName={getTitle(activeSong)}
          artistName={getArtist(activeSong)}
          onClose={() => {
            setPreviewUrl("");
            setActiveSong(null);
            setCurrentIndex(null);
          }}
          onNext={handleNext}
          onPrevious={handlePrevious}
          disableNext={
            findNextPlayableIndex(
              currentIndex ?? -1
            ) === null
          }
          disablePrevious={
            findPreviousPlayableIndex(
              currentIndex ?? songs.length
            ) === null
          }
        />
      )}
    </SafeAreaView>
  );
};

export default PlaylistSongs;






