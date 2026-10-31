import { useEffect, useRef, useState, useCallback } from 'react';
import { YTPlayerError } from '../types/player';

// Declare YT global for TypeScript
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          height: string | number;
          width: string | number;
          videoId: string;
          playerVars?: Record<string, any>;
          events?: Record<string, (event: any) => void>;
        }
      ) => any;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface UseYouTubePlayerProps {
  videoId: string;
  onEnded?: () => void;
  onError?: (error: YTPlayerError) => void;
  onTrackChange?: (track: { videoId: string; title: string; author: string }) => void;
}

export function useYouTubePlayer({ videoId, onEnded, onError, onTrackChange }: UseYouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerId = useRef(`yt-player-${Math.random().toString(36).substr(2, 9)}`);
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isPlaylist, setIsPlaylist] = useState<boolean>(false);
  const [playlistIndex, setPlaylistIndex] = useState<number>(0);

  const hasUserStartedRef = useRef<boolean>(false);
  const onEndedRef = useRef(onEnded);
  const onErrorRef = useRef(onError);
  const onTrackChangeRef = useRef(onTrackChange);
  const currentVideoIdRef = useRef<string>(videoId);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onTrackChangeRef.current = onTrackChange;
  }, [onTrackChange]);

  // Helper to sync videoData when track changes (especially inside playlists)
  const syncCurrentVideoData = useCallback((player: any) => {
    if (!player || typeof player.getVideoData !== 'function') return;
    try {
      const data = player.getVideoData();
      if (data && data.video_id && data.video_id !== currentVideoIdRef.current) {
        currentVideoIdRef.current = data.video_id;
        if (onTrackChangeRef.current) {
          onTrackChangeRef.current({
            videoId: data.video_id,
            title: data.title || '',
            author: data.author || '',
          });
        }
      }
      if (typeof player.getPlaylistIndex === 'function') {
        const pIdx = player.getPlaylistIndex();
        if (typeof pIdx === 'number' && pIdx >= 0) {
          setPlaylistIndex(pIdx);
          setIsPlaylist(true);
        }
      }
    } catch {}
  }, []);

  // Unconditional 100ms interval polling for player state & actual time
  useEffect(() => {
    const interval = window.setInterval(() => {
      const player = playerRef.current;
      if (player && typeof player.getPlayerState === 'function') {
        try {
          const state = player.getPlayerState();
          // 1 = YT.PlayerState.PLAYING
          if (state === 1) {
            setIsPlaying(true);
            setIsBuffering(false);
            if (typeof player.getCurrentTime === 'function') {
              const time = player.getCurrentTime() || 0;
              setCurrentTime(time);
            }
            if (typeof player.getDuration === 'function') {
              const dur = player.getDuration() || 0;
              if (dur > 0) setDuration(dur);
            }
            if (typeof player.getPlaybackRate === 'function') {
              const rate = player.getPlaybackRate() || 1;
              setPlaybackRate(rate);
            }
            syncCurrentVideoData(player);
          } else if (state === 2) { // PAUSED
            setIsPlaying(false);
            setIsBuffering(false);
          } else if (state === 3) { // BUFFERING
            // Freeze progression when buffering
            setIsBuffering(true);
          } else if (state === 5) { // CUED
            setIsBuffering(false);
            if (typeof player.getDuration === 'function') {
              const dur = player.getDuration() || 0;
              if (dur > 0) setDuration(dur);
            }
          } else if (state === 0) { // ENDED
            setIsPlaying(false);
            setIsBuffering(false);
          }
        } catch {
          // Ignore transient player call exceptions
        }
      }
    }, 100);

    return () => {
      window.clearInterval(interval);
    };
  }, [syncCurrentVideoData]);

  // Initialize YouTube Iframe API ONCE
  useEffect(() => {
    let isCancelled = false;

    function initPlayer() {
      if (!window.YT || !window.YT.Player) return;
      if (isCancelled || playerRef.current) return;

      playerRef.current = new window.YT.Player(containerId.current, {
        height: '48',
        width: '48',
        videoId: currentVideoIdRef.current,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            if (isCancelled) return;
            setIsReady(true);
            try {
              event.target.setVolume(volume);
              const dur = event.target.getDuration();
              if (dur) setDuration(dur);
              if (hasUserStartedRef.current) {
                event.target.playVideo();
                setIsPlaying(true);
              }
            } catch (e) {
              console.warn('Error in YouTube player onReady:', e);
            }
          },
          onStateChange: (event: any) => {
            if (isCancelled) return;
            const state = event.data;
            if (state === 1) { // PLAYING
              setIsPlaying(true);
              setIsBuffering(false);
              const dur = event.target.getDuration();
              if (dur && dur > 0) setDuration(dur);
              syncCurrentVideoData(event.target);
            } else if (state === 2) { // PAUSED
              setIsPlaying(false);
              setIsBuffering(false);
            } else if (state === 3) { // BUFFERING
              setIsBuffering(true);
            } else if (state === 5) { // CUED
              setIsBuffering(false);
              const dur = event.target.getDuration();
              if (dur && dur > 0) setDuration(dur);
            } else if (state === 0) { // ENDED
              setIsPlaying(false);
              setIsBuffering(false);
              if (onEndedRef.current) onEndedRef.current();
            }
          },
          onError: (event: any) => {
            const code = typeof event.data === 'number' ? event.data : 0;
            let message = 'An error occurred with YouTube playback.';
            let isFatal = false;

            // Error codes:
            // 2: Invalid parameter
            // 5: HTML5 error
            // 100: Video not found or private
            // 101, 150: Video owner blocks embedded playback
            if (code === 101 || code === 150) {
              message = 'Playback restricted by video owner.';
              isFatal = true;
            } else if (code === 100) {
              message = 'Video not found or removed by YouTube.';
              isFatal = true;
            } else if (code === 2) {
              message = 'Invalid video ID parameter.';
            } else if (code === 5) {
              message = 'HTML5 player error.';
            }

            console.warn(`YouTube Player Error (${code}):`, message);

            if (onErrorRef.current) {
              onErrorRef.current({ code, message, isFatal });
            }
          },
        },
      });
    }

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previousCallback) previousCallback();
        initPlayer();
      };
    } else if (window.YT && window.YT.Player) {
      initPlayer();
    }

    return () => {
      isCancelled = true;
    };
  }, []); // Run ONCE on mount

  // Safely switch video when videoId changes
  useEffect(() => {
    currentVideoIdRef.current = videoId;
    if (!isReady || !playerRef.current) return;

    setCurrentTime(0);
    setIsPlaying(false);
    setIsBuffering(false);

    try {
      if (hasUserStartedRef.current && typeof playerRef.current.loadVideoById === 'function') {
        playerRef.current.loadVideoById(videoId);
        setIsPlaying(true);
      } else if (typeof playerRef.current.cueVideoById === 'function') {
        playerRef.current.cueVideoById(videoId);
      }
    } catch (err) {
      console.warn('Error loading video by ID in YouTube player:', err);
    }
  }, [videoId, isReady]);

  const play = useCallback(() => {
    hasUserStartedRef.current = true;
    setIsPlaying(true);
    const player = playerRef.current;
    if (player && typeof player.playVideo === 'function') {
      try {
        player.playVideo();
      } catch (e) {
        console.error('Error playing video:', e);
      }
    }
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    const player = playerRef.current;
    if (player && typeof player.pauseVideo === 'function') {
      try {
        player.pauseVideo();
      } catch (e) {
        console.error('Error pausing video:', e);
      }
    }
  }, []);

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    let currentlyPlaying = isPlaying;
    if (player && typeof player.getPlayerState === 'function') {
      try {
        currentlyPlaying = player.getPlayerState() === 1;
      } catch {}
    }

    if (currentlyPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seekTo = useCallback((seconds: number) => {
    const player = playerRef.current;
    if (player && typeof player.seekTo === 'function') {
      try {
        player.seekTo(seconds, true);
        setCurrentTime(seconds);
      } catch (e) {
        console.error('Error seeking video:', e);
      }
    }
  }, []);

  const changeVolume = useCallback((newVol: number) => {
    const clamped = Math.max(0, Math.min(100, newVol));
    setVolume(clamped);
    const player = playerRef.current;
    if (player && typeof player.setVolume === 'function') {
      try {
        player.setVolume(clamped);
        if (clamped > 0 && isMuted) {
          player.unMute();
          setIsMuted(false);
        }
      } catch (e) {
        console.error('Error setting volume:', e);
      }
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    try {
      if (isMuted) {
        player.unMute();
        setIsMuted(false);
        if (volume === 0) {
          changeVolume(50);
        }
      } else {
        player.mute();
        setIsMuted(true);
      }
    } catch (e) {
      console.error('Error toggling mute:', e);
    }
  }, [isMuted, volume, changeVolume]);

  const changePlaybackRate = useCallback((rate: number) => {
    try {
      if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
        playerRef.current.setPlaybackRate(rate);
      }
      setPlaybackRate(rate);
    } catch (e) {
      console.error('Error changing playback rate:', e);
    }
  }, []);

  const getVideoData = useCallback(() => {
    try {
      if (playerRef.current && typeof playerRef.current.getVideoData === 'function') {
        const data = playerRef.current.getVideoData();
        if (data && (data.title || data.author)) {
          return {
            title: data.title || '',
            author: data.author || '',
            videoId: data.video_id || currentVideoIdRef.current,
          };
        }
      }
    } catch (e) {
      console.warn('Error reading getVideoData from player:', e);
    }
    return null;
  }, []);

  const loadVideo = useCallback((newVideoId: string, playImmediately = true) => {
    currentVideoIdRef.current = newVideoId;
    setCurrentTime(0);
    setIsPlaylist(false);
    const player = playerRef.current;
    if (player) {
      if (playImmediately && typeof player.loadVideoById === 'function') {
        hasUserStartedRef.current = true;
        player.loadVideoById(newVideoId);
        setIsPlaying(true);
      } else if (typeof player.cueVideoById === 'function') {
        player.cueVideoById(newVideoId);
      }
    }
  }, []);

  const loadPlaylist = useCallback((playlistId: string, startIndex = 0, playImmediately = true) => {
    setIsPlaylist(true);
    setPlaylistIndex(startIndex);
    setCurrentTime(0);
    const player = playerRef.current;
    if (player && typeof player.loadPlaylist === 'function') {
      hasUserStartedRef.current = true;
      player.loadPlaylist({
        list: playlistId,
        listType: 'playlist',
        index: startIndex,
        suggestedQuality: 'small',
      });
      setIsPlaying(playImmediately);
    }
  }, []);

  const nextVideo = useCallback(() => {
    const player = playerRef.current;
    if (player && typeof player.nextVideo === 'function' && isPlaylist) {
      try {
        player.nextVideo();
        return;
      } catch {}
    }
    if (onEndedRef.current) {
      onEndedRef.current();
    }
  }, [isPlaylist]);

  const previousVideo = useCallback(() => {
    const player = playerRef.current;
    if (player && typeof player.previousVideo === 'function' && isPlaylist) {
      try {
        player.previousVideo();
        return;
      } catch {}
    }
  }, [isPlaylist]);

  return {
    containerId: containerId.current,
    isReady,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    isPlaylist,
    playlistIndex,
    currentVideoId: currentVideoIdRef.current,
    play,
    pause,
    togglePlay,
    seekTo,
    setVolume: changeVolume,
    toggleMute,
    setPlaybackRate: changePlaybackRate,
    getVideoData,
    loadVideo,
    loadPlaylist,
    nextVideo,
    previousVideo,
  };
}
