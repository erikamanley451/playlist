
import { Ionicons } from "@expo/vector-icons";
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { WebView } from "react-native-webview";

type YouTubePlayerProps = {
  videoId: string;
  visible: boolean;
  title?: string;
  onClose: () => void;
};

export default function YouTubePlayer({
  videoId,
  visible,
  title,
  onClose,
}: YouTubePlayerProps) {
  if (!videoId) {
    return null;
  }

  const youtubeUrl =
    `https://www.youtube.com/embed/${videoId}` +
    `?playsinline=1&controls=1`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>

        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
          >
            <Ionicons
              name="arrow-back"
              size={26}
              color="white"
            />
          </TouchableOpacity>

          <Text
            style={styles.title}
            numberOfLines={1}
          >
            {title || "YouTube Video"}
          </Text>
        </View>

        <View style={styles.playerContainer}>
          <WebView
            source={{
              uri: youtubeUrl,
              headers: {
                Referer: "https://com.anonymous.playList",
              },
            }}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={true}
            originWhitelist={["*"]}
          />
        </View>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  header: {
    height: 90,
    paddingTop: 40,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
  },

  closeButton: {
    marginRight: 12,
  },

  title: {
    flex: 1,
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  playerContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
  },

  webview: {
    flex: 1,
    backgroundColor: "#000",
  },
});







