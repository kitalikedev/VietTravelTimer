import { useEffect, useRef } from 'react';

export interface UseMediaSessionProps {
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  playbackRate?: number;
  onPlay: () => void;
  onPause: () => void;
  onPreviousTrack: () => void;
  onNextTrack: () => void;
  onSeek: (seconds: number) => void;
}

/**
 * useMediaSession
 * Synchronizes playback state, track metadata, high-resolution artwork,
 * and system/hardware media keys (macOS Control Center, iOS Lock Screen,
 * Windows Media Overlay, Android Notification, Bluetooth headsets) with Web Media Session API.
 */
export function useMediaSession({
  title,
  artist,
  album = 'YT Lyrics',
  coverUrl,
  isPlaying,
  isBuffering,
  currentTime,
  duration,
  playbackRate = 1.0,
  onPlay,
  onPause,
  onPreviousTrack,
  onNextTrack,
  onSeek,
}: UseMediaSessionProps) {
  // Callbacks and state refs to prevent re-binding event listeners on every frame
  const handlersRef = useRef({
    onPlay,
    onPause,
    onPreviousTrack,
    onNextTrack,
    onSeek,
  });

  const timingRef = useRef({
    currentTime,
    duration,
  });

  const lastPositionUpdateRef = useRef<number>(0);
  const lastPositionTimeRef = useRef<number>(-1);

  // Keep refs up-to-date
  useEffect(() => {
    handlersRef.current = {
      onPlay,
      onPause,
      onPreviousTrack,
      onNextTrack,
      onSeek,
    };
  });

  useEffect(() => {
    timingRef.current = {
      currentTime,
      duration,
    };
  }, [currentTime, duration]);

  // 1. Metadata Synchronization (Track Title, Artist, Album, Artwork)
  useEffect(() => {
    if (!('mediaSession' in navigator) || !window.MediaMetadata) return;

    try {
      const artworkSrc =
        coverUrl || 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg';

      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: title || 'YT Lyrics',
        artist: artist || 'YouTube Track',
        album,
        artwork: [
          { src: artworkSrc, sizes: '96x96', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '128x128', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '192x192', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '256x256', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '384x384', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '512x512', type: 'image/jpeg' },
        ],
      });
    } catch (err) {
      console.warn('[MediaSession] Metadata synchronization error:', err);
    }
  }, [title, artist, album, coverUrl]);

  // 2. Playback State Synchronization
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    try {
      if (isPlaying) {
        navigator.mediaSession.playbackState = 'playing';
      } else if (isBuffering) {
        navigator.mediaSession.playbackState = 'none';
      } else if (currentTime > 0) {
        navigator.mediaSession.playbackState = 'paused';
      } else {
        navigator.mediaSession.playbackState = 'none';
      }
    } catch (err) {
      console.warn('[MediaSession] PlaybackState error:', err);
    }
  }, [isPlaying, isBuffering, currentTime]);

  // 3. Throttled Position State Synchronization (NEVER in 60fps RAF loop)
  useEffect(() => {
    if (!('mediaSession' in navigator) || !('setPositionState' in navigator.mediaSession)) {
      return;
    }

    if (duration <= 0) return;

    const now = performance.now();
    const timeDelta = Math.abs(currentTime - lastPositionTimeRef.current);
    const timeSinceLastUpdate = now - lastPositionUpdateRef.current;

    // Update if seek occurred (> 1.5s jump) or at least 1500ms has elapsed since last update
    if (timeDelta > 1.5 || timeSinceLastUpdate > 1500) {
      lastPositionUpdateRef.current = now;
      lastPositionTimeRef.current = currentTime;

      try {
        const clampedPosition = Math.min(Math.max(0, currentTime), duration);
        navigator.mediaSession.setPositionState({
          duration: Math.max(0, duration),
          playbackRate: playbackRate > 0 ? playbackRate : 1.0,
          position: clampedPosition,
        });
      } catch (err) {
        // Ignore IndexSizeError if duration/position boundary momentarily fluctuates
      }
    }
  }, [currentTime, duration, playbackRate]);

  // 4. Action Handlers (Play, Pause, Prev, Next, Seek, SeekBy, Stop)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const actionHandlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ['play', () => handlersRef.current.onPlay()],
      ['pause', () => handlersRef.current.onPause()],
      ['previoustrack', () => handlersRef.current.onPreviousTrack()],
      ['nexttrack', () => handlersRef.current.onNextTrack()],
      [
        'seekto',
        (details) => {
          if (typeof details.seekTime === 'number') {
            handlersRef.current.onSeek(details.seekTime);
          }
        },
      ],
      [
        'seekbackward',
        (details) => {
          const offset = details.seekOffset || 10;
          handlersRef.current.onSeek(
            Math.max(0, timingRef.current.currentTime - offset)
          );
        },
      ],
      [
        'seekforward',
        (details) => {
          const offset = details.seekOffset || 10;
          handlersRef.current.onSeek(
            Math.min(
              timingRef.current.duration || 9999,
              timingRef.current.currentTime + offset
            )
          );
        },
      ],
      [
        'stop',
        () => {
          handlersRef.current.onPause();
          handlersRef.current.onSeek(0);
        },
      ],
    ];

    // Safely bind each action handler with try/catch for browser compatibility
    actionHandlers.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Silently skip unsupported actions in certain browsers
      }
    });

    return () => {
      actionHandlers.forEach(([action]) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // Ignore unbind exceptions
        }
      });
    };
  }, []);
}
