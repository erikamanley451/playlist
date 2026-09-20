
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../styles/style";

const Playlist = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();

  const [playlists, setPlaylists] = useState<any[]>([]);
  const [incomingSong, setIncomingSong] = useState<any | null>(null);
  const [songAdded, setSongAdded] = useState<boolean>(false);

  const { songToAdd } = route.params as {
    songToAdd?: string;
  };

  const parsedSong = songToAdd
    ? JSON.parse(songToAdd)
    : null;

  // Set incomingSong when a song is passed to this screen
  useEffect(() => {
    if (parsedSong) {
      setIncomingSong(parsedSong);
    }
  }, [songToAdd]);

  // Load playlists from AsyncStorage
  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        const stored =
          await AsyncStorage.getItem("playlists");

        if (stored) {
          setPlaylists(JSON.parse(stored));
        }
      } catch (error) {
        console.error(
          "Failed to load playlists:",
          error
        );
      }
    };

    loadPlaylists();
  }, []);

  const deletePlaylist = async (index: number) => {
    const updatedPlaylists = [...playlists];

    updatedPlaylists.splice(index, 1);

    setPlaylists(updatedPlaylists);

    await AsyncStorage.setItem(
      "playlists",
      JSON.stringify(updatedPlaylists)
    );
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Songs")}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="black"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Playlists
        </Text>
      </View>

      {/* List of Playlists */}
      {playlists.length === 0 ? (
        <View style={styles.centeredContent}>
          <Text style={styles.emptyText}>
            No playlists found. Create one from Songs page!
          </Text>
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item, index) =>
            index.toString()
          }
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.songCard}
              onPress={() =>
                navigation.navigate(
                  "PlaylistSongs",
                  {
                    playlist: JSON.stringify(item),
                  }
                )
              }
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.playlistName}>
                  {item.name}
                </Text>

                <Text style={styles.playlistSongCount}>
                  {item.songs.length} song(s)
                </Text>
              </View>

              {/* Plus Icon to Add Song to Playlist */}
              <TouchableOpacity
                onPress={async () => {
                  if (songAdded) {
                    Alert.alert(
                      "Song Already Added",
                      "You can only add the song to one playlist in this session."
                    );
                    return;
                  }

                  if (incomingSong) {
                    const updatedPlaylists = [
                      ...playlists,
                    ];

                    const alreadyExists =
                      updatedPlaylists[index].songs.some(
                        (song: any) =>
                          song.id === incomingSong.id
                      );

                    if (!alreadyExists) {
                      updatedPlaylists[index].songs.push(
                        incomingSong
                      );

                      await AsyncStorage.setItem(
                        "playlists",
                        JSON.stringify(updatedPlaylists)
                      );

                      setPlaylists(updatedPlaylists);
                      setSongAdded(true);
                      setIncomingSong(null);

                      Alert.alert(
                        "Song Added!",
                        `Added to playlist "${updatedPlaylists[index].name}"`
                      );
                    } else {
                      Alert.alert(
                        "Already Exists",
                        "This song is already in the selected playlist."
                      );
                    }
                  }
                }}
              >
                <Ionicons
                  name="add-circle"
                  size={28}
                  color="#1DB954"
                />
              </TouchableOpacity>

              {/* Trash Icon to Delete Playlist */}
              <TouchableOpacity
                onPress={() => deletePlaylist(index)}
              >
                <Ionicons
                  name="trash-outline"
                  size={24}
                  color="red"
                />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default Playlist;


