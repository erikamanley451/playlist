
import { useState } from "react";
import { TextInput, View } from "react-native";
import { styles } from "../styles/style";

const PlayListSearch = () => {
  const [search, setSearch] = useState("");

  const handleSearch = () => {
    if (search.trim()) {
      // Search functionality can be added here later.
    }
  };

  return (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search"
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
      />
    </View>
  );
};

export default PlayListSearch;


