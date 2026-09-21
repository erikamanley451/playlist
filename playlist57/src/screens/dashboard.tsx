import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../services/firebase";
import { styles } from "../styles/style";

const Dashboard: React.FC = () => {
  const navigation = useNavigation();

  // Empty name displays only "Good morning/afternoon/evening!"
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setFullName("");
      return;
    }

    const userRef = doc(db, "users", user.uid);

    /*
     * Listen for profile changes.
     * The Dashboard updates when the user changes their name.
     */
    const unsubscribe = onSnapshot(
      userRef,
      (documentSnapshot) => {
        if (documentSnapshot.exists()) {
          const data = documentSnapshot.data();

          setFullName(data.fullName?.trim() || "");
        } else {
          setFullName("");
        }
      },
      (error) => {
        console.error(
          "Error listening for profile changes:",
          error.code,
          error.message
        );

        // Keep the greeting clean if the profile cannot load.
        setFullName("");
      }
    );

    // Remove the listener when Dashboard unmounts.
    return unsubscribe;
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();

    const greeting =
      hour < 12
        ? "Good morning"
        : hour < 18
        ? "Good afternoon"
        : "Good evening";

    if (fullName) {
      return `${greeting}, ${fullName}!`;
    }

    return `${greeting}!`;
  };

  const tiles = [
    {
      title: "Songs",
      icon: "musical-notes",
      screen: "Songs",
    },
    {
      title: "Podcasts",
      icon: "mic",
      screen: "Podcasts",
    },
    {
      title: "Audiobooks",
      icon: "book",
      screen: "Audiobooks",
    },
    {
      title: "Videos",
      icon: "videocam",
      screen: "Videos",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={localStyles.container}>
        {/* Header */}
        <View style={localStyles.headerContainer}>
          <View style={localStyles.header}>
            <Image
              source={require(
                "../assets/images/myicon.png"
              )}
              style={localStyles.icon}
            />

            <Text style={localStyles.headerText}>
              Dashboard
            </Text>
          </View>

          <View style={localStyles.divider} />
        </View>

        {/* Greeting */}
        <Text style={localStyles.greeting}>
          {getGreeting()}
        </Text>

        {/* Playlist logo */}
        <View style={styles.dashboardImage}>
          <Image
            source={require(
              "../assets/images/playlist-logo.png"
            )}
            style={localStyles.dashboardLogo}
          />
        </View>

        {/* Dashboard tiles */}
        <View style={styles.tilesContainer}>
          {tiles.map((tile) => (
            <TouchableOpacity
              key={tile.screen}
              style={styles.tile}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate(tile.screen as never)
              }
            >
              <Ionicons
                name={tile.icon as any}
                size={50}
                color="#fff"
              />

              <Text style={styles.tileText}>
                {tile.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Dashboard;

const localStyles = StyleSheet.create({
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
    width: 50,
    height: 50,
    marginRight: 10,
  },

  headerText: {
    fontSize: 20,
    fontWeight: "600",
  },

  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#000",
  },

  greeting: {
    color: "grey",
    fontSize: 18,
  },

  dashboardLogo: {
    width: 390,
    resizeMode: "contain",
  },
});


