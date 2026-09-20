
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
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

  const [fullName, setFullName] = useState("there");

  // Fetch user's name from Firestore
  // to display a greeting to the user
  useEffect(() => {
    const fetchUserName = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setFullName(data.fullName);
      }
    };

    fetchUserName();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();

    const greeting =
      hour < 12
        ? "Good morning"
        : hour < 18
        ? "Good afternoon"
        : "Good evening";

    return `${greeting}${fullName ? ", " + fullName : ""}!`;
  };

  const tiles = [
    { title: "Songs", icon: "musical-notes", screen: "Songs" },
    { title: "Podcasts", icon: "mic", screen: "Podcasts" },
    { title: "Audiobooks", icon: "book", screen: "Audiobooks" },
    { title: "Videos", icon: "videocam", screen: "Videos" },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={style.container}>
        {/* Header + Divider */}
        <View style={style.headerContainer}>
          <View style={style.header}>
            <Image
              source={require("../assets/images/myicon.png")}
              style={style.icon}
            />

            <Text style={style.headerText}>Dashboard</Text>
          </View>

          <View style={style.divider} />
        </View>

        <Text style={{ color: "grey", fontSize: 18 }}>
          {getGreeting()}
        </Text>

        <View style={styles.dashboardImage}>
          <Image
            source={require("../assets/images/playlist-logo.png")}
            style={{ width: 390, resizeMode: "contain" }}
          />
        </View>

        <View style={styles.tilesContainer}>
          {tiles.map((tile, index) => (
            <TouchableOpacity
              key={index}
              style={styles.tile}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(tile.screen as never)}
            >
              <Ionicons
                name={tile.icon as any}
                size={50}
                color="#fff"
              />

              <Text style={styles.tileText}>{tile.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Dashboard;

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


