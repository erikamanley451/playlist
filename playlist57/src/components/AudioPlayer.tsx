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

type ActivePlayback = {
  owner: symbol;
  stop: () => void;
};

// AudioPlayer can be mounted on more than one navigation screen at a time.
// Keep one shared owner so starting a new player always silences the old one.
let activePlayback: ActivePlayback | null = null;

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
  const [progress, setProgress] = useState(0);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const owner = useRef(Symbol('AudioPlayer')).current;

  const isVideo =
    previewUrl.endsWith('.mp4') || previewUrl.includes('video');

  /*
   * Audio player
   */
  // Create one native audio player for this component. Passing previewUrl
  // directly to useAudioPlayer can release and recreate the native object
  // during a skip, leaving button handlers with an invalid object.
  const audioPlayer = useAudioPlayer(null);

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

  const stopPlayback = () => {
    try {
      if (isVideo) videoPlayer.pause();
      else audioPlayer.pause();
    } catch {
      // The native player may already have been released during unmounting.
    }
  };

  const claimPlayback = () => {
    if (activePlayback?.owner !== owner) {
      activePlayback?.stop();
      activePlayback = { owner, stop: stopPlayback };
    }
  };

  const releasePlayback = () => {
    if (activePlayback?.owner === owner) activePlayback = null;
  };

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

    if (!isVideo) {
      audioPlayer.replace(previewUrl);
      claimPlayback();
      audioPlayer.play();
    }

    return () => {
      // useAudioPlayer/useVideoPlayer release their native objects on unmount.
      // Calling pause here can run after that release and throw NotFoundException.
      releasePlayback();
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
          releasePlayback();
        } else {
          claimPlayback();
          videoPlayer.play();
        }
      } else {
        if (audioStatus.playing) {
          audioPlayer.pause();
          releasePlayback();
        } else {
          claimPlayback();
          audioPlayer.play();
        }
      }
    } catch (error) {
      console.error('Play/Pause error:', error);
    }
  };

  const handleClose = () => {
    stopPlayback();
    releasePlayback();
    onClose();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        isVideo && styles.expanded,
      ]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleClose} hitSlop={12}>
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

        <View style={styles.headerSpacer} />
      </View>

      {isVideo && (
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

  headerSpacer: {
    width: 32,
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