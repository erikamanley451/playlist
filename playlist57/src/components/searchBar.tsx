import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
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
  const inputRef = useRef<TextInput>(null);

  const clearSearch = () => {
    onChangeText("");

    // Restore focus after the controlled value has been cleared.
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  return (
    <View style={styles.searchContainer}>
      <View style={localStyles.inputWrapper}>
        <TextInput
          ref={inputRef}
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
            onPress={clearSearch}
            style={localStyles.clearButton}
            hitSlop={10}
            activeOpacity={0.8}
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
    marginTop: -18,
    borderRadius: 11,
    backgroundColor: "#1DB954",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SearchBar;



