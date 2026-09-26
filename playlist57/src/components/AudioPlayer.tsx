import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

const { width } = Dimensions.get('window');

type ActivePlayback = {
  owner: symbol;
  stop: () => void;
};

// AudioPlayer can be mounted on more than one navigation screen at a time.
// Keep one shared owner so starting a new player always silences the old one.
let activePlayback: ActivePlayback | null = null;

type AudioPlayerProps = {
  previewUrl?: string;
  youtubeVideoId?: string | null;
  songName: string;
  artistName: string;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  disableNext?: boolean;
  disablePrevious?: boolean;
  sourceAttribution?: string;
  sourceLabel?: string;
  sourceUrl?: string | null;
};

const AudioPlayer = ({
  previewUrl = '',
  youtubeVideoId,
  songName,
  artistName,
  onClose,
  onNext,
  onPrevious,
  disableNext = false,
  disablePrevious = false,
  sourceAttribution,
  sourceLabel,
  sourceUrl,
}: AudioPlayerProps) => {
  const [progress, setProgress] = useState(0);
  const [videoExpanded, setVideoExpanded] = useState(false);
  const [youtubePlaying, setYoutubePlaying] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const owner = useRef(Symbol('AudioPlayer')).current;

  const isYouTube = Boolean(youtubeVideoId);
  const isDirectVideo =
    !isYouTube &&
    (previewUrl.endsWith('.mp4') || previewUrl.includes('video'));

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
    isDirectVideo ? previewUrl : null,
    (player) => {
      player.loop = false;
    }
  );

  const isPlaying = isYouTube
    ? youtubePlaying
    : isDirectVideo
      ? videoPlayer.playing
      : audioStatus.playing;

  const stopPlayback = () => {
    try {
      if (isYouTube) setYoutubePlaying(false);
      else if (isDirectVideo) videoPlayer.pause();
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
    if (!isYouTube && !isDirectVideo && audioStatus.duration > 0) {
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
    isDirectVideo,
    isYouTube,
    progressAnim,
  ]);

  /*
   * Automatically start audio when previewUrl changes.
   */
  useEffect(() => {
    // The native audio object is still valid while props change. Stop its
    // previous source before switching to a YouTube or direct-video item.
    try {
      audioPlayer.pause();
    } catch {
      // There may not be a loaded audio source yet.
    }

    releasePlayback();

    if (!previewUrl || isYouTube || isDirectVideo) return;

    audioPlayer.replace(previewUrl);
    claimPlayback();
    audioPlayer.play();

    return () => {
      // useAudioPlayer/useVideoPlayer release their native objects on unmount.
      // Calling pause here can run after that release and throw NotFoundException.
      releasePlayback();
    };
  }, [previewUrl, isDirectVideo, isYouTube]);

  useEffect(() => {
    // Start each YouTube item collapsed. The outer green button reveals the
    // embedded player; YouTube's own controls then handle playback.
    setVideoExpanded(false);
    setYoutubePlaying(false);
  }, [youtubeVideoId]);

  /*
   * Play / pause
   */
  const togglePlayPause = () => {
    try {
      if (isYouTube) {
        // iOS may reject programmatic YouTube playback in an iframe. Expand
        // the video and let its official controls own play/pause instead of
        // displaying a false playing state in the outer player.
        setVideoExpanded(true);
        return;
      } else if (isDirectVideo) {
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

  const toggleVideoExpansion = () => {
    setVideoExpanded((currentlyExpanded) => {
      if (currentlyExpanded) {
        setYoutubePlaying(false);
        releasePlayback();
      }
      return !currentlyExpanded;
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        isDirectVideo && styles.expanded,
        isYouTube && videoExpanded && styles.youtubeExpanded,
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

        {isYouTube ? (
          <TouchableOpacity onPress={toggleVideoExpansion} hitSlop={12}>
            <Ionicons
              name={videoExpanded ? 'chevron-down' : 'chevron-up'}
              size={24}
              color="white"
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {isDirectVideo && (
        <VideoView
          player={videoPlayer}
          style={styles.videoPlayer}
          nativeControls={false}
          contentFit="contain"
        />
      )}

      {isYouTube && videoExpanded && youtubeVideoId && (
        <View style={styles.youtubePlayer}>
          <YoutubePlayer
            height={205}
            videoId={youtubeVideoId}
            play={youtubePlaying}
            forceAndroidAutoplay
            initialPlayerParams={{
              playsinline: true,
            }}
            webViewProps={{
              allowsInlineMediaPlayback: true,
              mediaPlaybackRequiresUserAction: false,
            }}
            onChangeState={(state) => {
              if (state === 'playing') {
                claimPlayback();
                setYoutubePlaying(true);
              }

              if (state === 'paused') {
                setYoutubePlaying(false);
                releasePlayback();
              }

              if (state === 'ended') {
                setYoutubePlaying(false);
                releasePlayback();
              }
            }}
          />
        </View>
      )}

      {isYouTube && !videoExpanded ? (
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

          <TouchableOpacity
            onPress={() => setVideoExpanded(true)}
            accessibilityRole="button"
            accessibilityLabel="Expand YouTube video"
          >
            <Ionicons
              name="play-circle"
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
      ) : isYouTube ? (
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

          <View style={styles.youtubeControlSpacer} />

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
      ) : (
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
              name={isPlaying ? 'pause-circle' : 'play-circle'}
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
      )}

      {!isYouTube && !isDirectVideo && (
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

      {(sourceAttribution || (sourceLabel && sourceUrl)) && (
        <View style={styles.sourceRow}>
          {sourceAttribution && (
            <Text style={styles.sourceAttribution} numberOfLines={1}>
              {sourceAttribution}
            </Text>
          )}

          {sourceLabel && sourceUrl && (
            <TouchableOpacity
              onPress={() => void Linking.openURL(sourceUrl)}
              accessibilityRole="link"
              accessibilityLabel={`Open in ${sourceLabel}`}
              style={styles.sourceLink}
            >
              <Ionicons name="open-outline" size={14} color="#1DB954" />
              <Text style={styles.sourceLinkText}>{sourceLabel}</Text>
            </TouchableOpacity>
          )}
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

  youtubeExpanded: {
    height: 455,
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

  youtubeControlSpacer: {
    width: 70,
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

  sourceRow: {
    minHeight: 24,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  sourceAttribution: {
    flex: 1,
    color: '#9E9E9E',
    fontSize: 11,
  },

  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#202020',
  },

  sourceLinkText: {
    color: '#1DB954',
    fontSize: 11,
    fontWeight: '700',
  },

  videoPlayer: {
    width: '100%',
    height: 200,
    marginTop: 20,
    borderRadius: 12,
  },

  youtubePlayer: {
    marginTop: 14,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#000',
  },
});

export default AudioPlayer;





