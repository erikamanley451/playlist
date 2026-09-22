import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

type AudioPlayerProps = {
  previewUrl: string | null;
  songName: string;
  artistName: string;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  disableNext?: boolean;
  disablePrevious?: boolean;
};

const AudioPlayer = ({
  previewUrl,
  songName,
  artistName,
  onClose,
  onNext,
  onPrevious,
  disableNext = false,
  disablePrevious = false,
}: AudioPlayerProps) => {
  // Initialize without a source. This avoids passing null into Expo's source
  // resolver, which calls endsWith() in some SDK versions.
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const closingRef = useRef(false);
  const [expanded, setExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!previewUrl) return;

    closingRef.current = false;
    setIsClosing(false);

    try {
      player.replace(previewUrl);
      player.play();
    } catch (error) {
      console.warn("Audio could not start:", error);
    }

    // No cleanup: useAudioPlayer releases its native player on unmount.
  }, [player, previewUrl]);

  useEffect(() => {
    const duration = status.duration ?? 0;
    const currentTime = status.currentTime ?? 0;
    const progress = duration > 0 ? currentTime / duration : 0;

    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 250,
      useNativeDriver: false,
    }).start();

    if (status.didJustFinish) progressAnim.setValue(0);
  }, [status.currentTime, status.duration, status.didJustFinish, progressAnim]);

  const closePlayer = () => {
    if (closingRef.current) return;

    closingRef.current = true;
    setIsClosing(true);

    try {
      // Safe here because the parent keeps this component mounted.
      if (status.playing) player.pause();
    } catch (error) {
      console.warn("Audio could not pause while closing:", error);
    }

    // The parent clears previewUrl but keeps this component mounted.
    onClose();
  };

  const togglePlayPause = () => {
    if (closingRef.current) return;

    try {
      if (status.playing) player.pause();
      else player.play();
    } catch (error) {
      console.warn("Audio player was unavailable:", error);
    }
  };

  const previousDisabled = isClosing || disablePrevious || !onPrevious;
  const nextDisabled = isClosing || disableNext || !onNext;

  if (!previewUrl) return null;

  return (
    <Animated.View style={[styles.container, expanded && styles.expanded]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={closePlayer} disabled={isClosing}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.songTitle} numberOfLines={1}>{songName}</Text>
          <Text style={styles.artistName} numberOfLines={1}>{artistName}</Text>
        </View>

        <TouchableOpacity
          style={styles.expandToggle}
          onPress={() => setExpanded((value) => !value)}
          disabled={isClosing}
        >
          <Ionicons
            name={expanded ? "chevron-down" : "chevron-up"}
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          onPress={() => !previousDisabled && onPrevious?.()}
          disabled={previousDisabled}
        >
          <Ionicons
            name="play-skip-back"
            size={36}
            color={previousDisabled ? "#555" : "white"}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlayPause} disabled={isClosing}>
          <Ionicons
            name={status.playing ? "pause-circle" : "play-circle"}
            size={70}
            color={isClosing ? "#555" : "#1DB954"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => !nextDisabled && onNext?.()}
          disabled={nextDisabled}
        >
          <Ionicons
            name="play-skip-forward"
            size={36}
            color={nextDisabled ? "#555" : "white"}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.progressBarContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, width - 40],
              }),
            },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#121212",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 12,
  },
  expanded: { height: 220 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 10,
  },
  songTitle: { color: "white", fontWeight: "bold", fontSize: 16 },
  artistName: { color: "#aaa", fontSize: 13 },
  expandToggle: { padding: 4 },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 14,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    overflow: "hidden",
    marginHorizontal: 20,
  },
  progressBar: { height: 4, backgroundColor: "#1DB954" },
});

export default AudioPlayer;
