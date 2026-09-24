import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../styles/style";

// The iTunes Search API has no category-list endpoint, so these are search terms.
const categories = [
  { name: "Pop", icon: "musical-notes", searchTerm: "pop" },
  { name: "Hip-Hop / Rap", icon: "mic", searchTerm: "hip hop" },
  { name: "Rock", icon: "radio", searchTerm: "rock" },
  { name: "R&B / Soul", icon: "heart", searchTerm: "r&b soul" },
  { name: "Country", icon: "musical-note", searchTerm: "country" },
  { name: "Jazz", icon: "headset", searchTerm: "jazz" },
  { name: "Classical", icon: "library", searchTerm: "classical" },
  { name: "Electronic", icon: "pulse", searchTerm: "electronic" },
];

const Categories = () => {
  const navigation = useNavigation<any>();
  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.navigate("AppTabs")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
      </View>
      <FlatList data={categories} keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate("Songs", { initialQuery: item.searchTerm })}>
            <View style={styles.songCard}>
              <Ionicons name={item.icon as any} size={42} color="#1DB954" style={styles.songImage} />
              <View style={styles.songDetails}><Text style={styles.songTitle}>{item.name}</Text></View>
              <Ionicons name="chevron-forward" size={24} color="#1DB954" />
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

export default Categories;

