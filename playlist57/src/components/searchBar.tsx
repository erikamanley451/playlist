import { Ionicons } from "@expo/vector-icons";
import {
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { styles } from "../styles/style";

type SearchBarProps = {
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
};

const SearchBar = ({
  value,
  placeholder,
  onChangeText,
  onSubmit,
}: SearchBarProps) => {
  return (
    <View style={styles.searchContainer}>
      <View style={localStyles.inputWrapper}>
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.searchInput, localStyles.input]}
        />

        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => onChangeText("")}
            style={localStyles.clearButton}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close" size={14} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  inputWrapper: {
    position: "relative",
    width: "100%",
  },
  input: {
    width: "100%",
    paddingRight: 44,
  },
  clearButton: {
    position: "absolute",
    right: 16,
    top: "50%",
    width: 22,
    height: 22,
    // The shared searchInput style includes vertical spacing, so move the
    // button slightly above the wrapper's mathematical center to center it
    // visually inside the gray input field.
    marginTop: -18,
    borderRadius: 11,
    backgroundColor: "#1DB954",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SearchBar;



