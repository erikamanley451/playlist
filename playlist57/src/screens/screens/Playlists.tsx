
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../styles/style";

const Playlists = () => {
  const navigation = useNavigation<any>();

  const [playlists, setPlaylists] = useState<any[]>([]);

  // Load playlists from AsyncStorage
  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        const stored = await AsyncStorage.getItem("playlists");

        if (stored) {
          setPlaylists(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Failed to load playlists:", error);
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
    <SafeAreaView style={style.container}>
      {/* Header + Divider */}
      <View style={style.headerContainer}>
        <View style={style.header}>
          <Image
            source={require("../../assets/images/myicon.png")}
            style={style.icon}
          />

          <Text style={style.headerText}>Playlists</Text>
        </View>

        <View style={style.divider} />
      </View>

      {/* List of Playlists */}
      {playlists.length === 0 ? (
        <View style={styles.centeredContent}>
          <Text style={styles.emptyText}>
            No playlists found. Create one from the Home page!
          </Text>
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.songCard}
              onPress={() =>
                navigation.navigate("PlaylistSongs", {
                  playlist: JSON.stringify(item),
                })
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

              {/* Trash Icon to Delete Playlist */}
              <TouchableOpacity
                onPress={() => deletePlaylist(index)}
              >
                <Ionicons
                  name="trash"
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

export default Playlists;

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  headerContainer: {
    width: "100%",
    alignSelf: "center",
    marginBottom: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 10,
  },

  icon: {
    marginRight: 10,
    width: 50,
    height: 50,
  },

  headerText: {
    fontSize: 20,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#000",
    width: "100%",
  },

  profileCard: {
    flexDirection: "row",
    backgroundColor: "#E0E8FF",
    borderWidth: 2,
    borderColor: "#00C853",
    borderRadius: 12,
    padding: 20,
    alignSelf: "center",
    width: "90%",
    height: 160,
    marginBottom: 20,
  },

  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 20,
    backgroundColor: "#ccc",
  },

  profileDetails: {
    flex: 1,
    justifyContent: "center",
  },

  detailLabel: {
    fontWeight: "600",
    fontSize: 16,
  },

  detailValue: {
    fontSize: 16,
    marginBottom: 10,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "center",
    width: "90%",
    marginTop: 10,
  },

  button: {
    backgroundColor: "#1DB954",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    flex: 0.45,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});



