
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import AudioPlayer from "../../components/AudioPlayer";
import { fetchCategoricalPlaylist } from "../../services/spotifyService";
import { styles } from "../../styles/style";

const CategoryPlaylists = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();

  const { id } = route.params as {
    id: string;
  };

  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [newPlaylistModalVisible, setNewPlaylistModalVisible] =
    useState(false);

  const [existingPlaylistModalVisible, setExistingPlaylistModalVisible] =
    useState(false);

  const [selectedItem, setSelectedItem] =
    useState<any | null>(null);

  const [playlistsStore, setPlaylistsStore] =
    useState<any[]>([]);

  const [newPlaylistName, setNewPlaylistName] =
    useState("");

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [activeItem, setActiveItem] =
    useState<any | null>(null);

  useEffect(() => {
    async function loadPlaylists() {
      try {
        const data =
          await fetchCategoricalPlaylist(id);

        setPlaylists(data);
      } catch (error) {
        console.error(
          "Failed to load category playlists:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadPlaylists();
    loadStoredPlaylists();
  }, [id]);

  const loadStoredPlaylists = async () => {
    try {
      const stored =
        await AsyncStorage.getItem(
          "playlists"
        );

      if (stored) {
        setPlaylistsStore(
          JSON.parse(stored)
        );
      }
    } catch (error) {
      console.error(
        "Failed to load stored playlists:",
        error
      );
    }
  };

  const savePlaylists = async (
    updated: any[]
  ) => {
    await AsyncStorage.setItem(
      "playlists",
      JSON.stringify(updated)
    );

    setPlaylistsStore(updated);
  };

  const openModal = (item: any) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const closeAllModals = () => {
    setModalVisible(false);
    setNewPlaylistModalVisible(false);
    setExistingPlaylistModalVisible(false);
    setSelectedItem(null);
  };

  const handleCreatePlaylist = () => {
    if (!selectedItem) return;

    if (!newPlaylistName.trim()) {
      Toast.show({
        type: "error",
        text1:
          "Please enter a playlist name.",
      });

      return;
    }

    const exists = playlistsStore.some(
      (p) =>
        p.name.toLowerCase() ===
        newPlaylistName
          .trim()
          .toLowerCase()
    );

    if (exists) {
      Toast.show({
        type: "error",
        text1:
          "Playlist already exists.",
      });

      return;
    }

    const newPlaylist = {
      name: newPlaylistName.trim(),
      songs: [selectedItem],
    };

    const updated = [
      ...playlistsStore,
      newPlaylist,
    ];

    savePlaylists(updated);

    Toast.show({
      type: "success",
      text1: `Created ${newPlaylistName.trim()}`,
      text2: "Item added.",
    });

    setNewPlaylistName("");
    closeAllModals();
  };

  const handleAddToExisting = (
    index: number
  ) => {
    if (!selectedItem) return;

    const updated = [
      ...playlistsStore,
    ];

    const playlist =
      updated[index];

    if (!playlist) return;

    const exists =
      playlist.songs?.some(
        (song: any) =>
          song.id ===
          selectedItem.id
      );

    if (exists) {
      Toast.show({
        type: "info",
        text1:
          "Already in playlist",
      });
    } else {
      playlist.songs = [
        ...(playlist.songs || []),
        selectedItem,
      ];

      savePlaylists(updated);

      Toast.show({
        type: "success",
        text1:
          `Added to ${playlist.name}`,
      });
    }

    closeAllModals();
  };

  if (loading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#1DB954"
        />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={
        styles.safeAreaContainer
      }
    >
      {/* Header */}

      <View
        style={
          styles.headerContainer
        }
      >
        <TouchableOpacity
          onPress={() =>
            navigation.navigate(
              "AppTabs"
            )
          }
          style={
            styles.backButton
          }
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="black"
          />
        </TouchableOpacity>

        <Text
          style={
            styles.headerTitle
          }
        >
          {id} Playlists
        </Text>
      </View>

      {/* Category Playlists */}

      <FlatList
        data={playlists}
        keyExtractor={(item) =>
          item.id
        }
        renderItem={({
          item,
        }) => (
          <View
            style={
              styles.songCard
            }
          >
            <Image
              source={{
                uri:
                  item.images?.[0]
                    ?.url,
              }}
              style={
                styles.songImage
              }
            />

            <View
              style={
                styles.songDetails
              }
            >
              <Text
                style={
                  styles.songTitle
                }
              >
                {item.name}
              </Text>

              <Text
                style={
                  styles.songArtist
                }
              >
                {item.owner
                  ?.display_name}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                Linking.openURL(
                  item.external_urls
                    .spotify
                )
              }
            >
              <Ionicons
                name="play-circle"
                size={24}
                color="#1DB954"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                openModal(item)
              }
            >
              <Ionicons
                name="add-circle"
                size={24}
                color="#1DB954"
              />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Playlist Modal */}

      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modalContent
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              Add to Playlist
            </Text>

            <TouchableOpacity
              style={
                styles.modalButton
              }
              onPress={() => {
                setModalVisible(
                  false
                );

                setExistingPlaylistModalVisible(
                  true
                );
              }}
            >
              <Text
                style={
                  styles.modalButtonText
                }
              >
                Existing Playlist
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.modalButton
              }
              onPress={() => {
                setModalVisible(
                  false
                );

                setNewPlaylistModalVisible(
                  true
                );
              }}
            >
              <Text
                style={
                  styles.modalButtonText
                }
              >
                New Playlist
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={
                closeAllModals
              }
            >
              <Text
                style={
                  styles.modalCancelText
                }
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create New Playlist Modal */}

      <Modal
        transparent
        visible={
          newPlaylistModalVisible
        }
        animationType="slide"
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modalContent
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              Create New Playlist
            </Text>

            <TextInput
              style={
                styles.input
              }
              placeholder="Playlist Name"
              value={
                newPlaylistName
              }
              onChangeText={
                setNewPlaylistName
              }
            />

            <TouchableOpacity
              style={
                styles.modalButton
              }
              onPress={
                handleCreatePlaylist
              }
            >
              <Text
                style={
                  styles.modalButtonText
                }
              >
                Create
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={
                closeAllModals
              }
            >
              <Text
                style={
                  styles.modalCancelText
                }
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Existing Playlist Modal */}

      <Modal
        transparent
        visible={
          existingPlaylistModalVisible
        }
        animationType="slide"
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modalContent
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              Select Playlist
            </Text>

            {playlistsStore.map(
              (
                pl,
                idx
              ) => (
                <TouchableOpacity
                  key={idx}
                  style={
                    styles.modalButton
                  }
                  onPress={() =>
                    handleAddToExisting(
                      idx
                    )
                  }
                >
                  <Text
                    style={
                      styles.modalButtonText
                    }
                  >
                    {pl.name}
                  </Text>
                </TouchableOpacity>
              )
            )}

            <TouchableOpacity
              onPress={
                closeAllModals
              }
            >
              <Text
                style={
                  styles.modalCancelText
                }
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Audio Player */}

      {previewUrl &&
        activeItem && (
          <AudioPlayer
            previewUrl={
              previewUrl
            }
            songName={
              activeItem.name
            }
            artistName={
              activeItem.owner
                ?.display_name ||
              ""
            }
            onClose={() => {
              setPreviewUrl(
                ""
              );

              setActiveItem(
                null
              );
            }}
            onNext={() => {}}
            onPrevious={() => {}}
          />
        )}
    </SafeAreaView>
  );
};

export default CategoryPlaylists;



