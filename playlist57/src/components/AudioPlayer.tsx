import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

type AudioPlayerProps = {
  previewUrl: string;
  songName: string;
  artistName: string;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
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
  const [expanded, setExpanded] = useState(false);
  const [progress, setProgress] = useState(0);

  const progressAnim = useRef(new Animated.Value(0)).current;

  const isVideo =
    previewUrl.endsWith('.mp4') || previewUrl.includes('video');

  /*
   * Audio player
   */
  const audioPlayer = useAudioPlayer(
    isVideo ? null : previewUrl
  );

  const audioStatus = useAudioPlayerStatus(audioPlayer);

  /*
   * Video player
   */
  const videoPlayer = useVideoPlayer(
    isVideo ? previewUrl : null,
    (player) => {
      player.loop = false;
    }
  );

  const isPlaying = isVideo
    ? videoPlayer.playing
    : audioStatus.playing;

  /*
   * Audio progress
   */
  useEffect(() => {
    if (!isVideo && audioStatus.duration > 0) {
      const position =
        audioStatus.currentTime / audioStatus.duration;

      setProgress(position);

      Animated.timing(progressAnim, {
        toValue: position,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [
    audioStatus.currentTime,
    audioStatus.duration,
    isVideo,
    progressAnim,
  ]);

  /*
   * Automatically start audio when previewUrl changes.
   */
  useEffect(() => {
    if (!previewUrl) {
      return;
    }

    if (isVideo) {
      setExpanded(true);
    } else {
      audioPlayer.play();
    }

    return () => {
      if (isVideo) {
        videoPlayer.pause();
      } else {
        audioPlayer.pause();
      }
    };
  }, [previewUrl]);

  /*
   * Play / pause
   */
  const togglePlayPause = () => {
    try {
      if (isVideo) {
        if (videoPlayer.playing) {
          videoPlayer.pause();
        } else {
          videoPlayer.play();
        }
      } else {
        if (audioStatus.playing) {
          audioPlayer.pause();
        } else {
          audioPlayer.play();
        }
      }
    } catch (error) {
      console.error('Play/Pause error:', error);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        expanded && styles.expanded,
      ]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons
            name="close"
            size={24}
            color="white"
          />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text
            style={styles.songTitle}
            numberOfLines={1}
          >
            {songName}
          </Text>

          <Text
            style={styles.artistName}
            numberOfLines={1}
          >
            {artistName}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.expandToggle}
          onPress={() => setExpanded(!expanded)}
        >
          <Ionicons
            name={expanded ? 'chevron-down' : 'chevron-up'}
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>

      {expanded && isVideo && (
        <VideoView
          player={videoPlayer}
          style={styles.videoPlayer}
          nativeControls={false}
          contentFit="contain"
        />
      )}

      <View style={styles.controls}>
        <TouchableOpacity
          onPress={onPrevious}
          disabled={disablePrevious}
        >
          <Ionicons
            name="play-skip-back"
            size={36}
            color={disablePrevious ? '#555' : 'white'}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlayPause}>
          <Ionicons
            name={
              isPlaying
                ? 'pause-circle'
                : 'play-circle'
            }
            size={70}
            color="#1DB954"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onNext}
          disabled={disableNext}
        >
          <Ionicons
            name="play-skip-forward"
            size={36}
            color={disableNext ? '#555' : 'white'}
          />
        </TouchableOpacity>
      </View>

      {!isVideo && (
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
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#121212',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 12,
  },

  expanded: {
    height: 400,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },

  songTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  artistName: {
    color: '#aaa',
    fontSize: 13,
  },

  expandToggle: {
    padding: 4,
  },

  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 14,
  },

  progressBarContainer: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
    marginHorizontal: 20,
  },

  progressBar: {
    height: 4,
    backgroundColor: '#1DB954',
  },

  videoPlayer: {
    width: '100%',
    height: 200,
    marginTop: 20,
    borderRadius: 12,
  },
});

export default AudioPlayer;
