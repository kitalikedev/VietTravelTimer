import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { SongMetadata, DemoSong } from './types';
import { DEMO_SONGS } from './data/demoSongs';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { useQueue } from './hooks/useQueue';
import { useShortcuts } from './hooks/useShortcuts';
import { useMediaSession } from './hooks/useMediaSession';
import { useFocusTimer } from './hooks/useFocusTimer';
import { useAmbientSounds } from './hooks/useAmbientSounds';
import { SongModal } from './components/SongModal';
import { PlaylistDrawer } from './components/PlaylistDrawer';
import { AppleHud } from './components/AppleHud';
import { FocusTimerDisplay, ClockPosition, ClockStyle } from './components/FocusTimerDisplay';
import { BottomPlayerBar } from './components/BottomPlayerBar';
import { AmbientSoundMixer } from './components/AmbientSoundMixer';
import { TaskManager, useTasksState } from './components/TaskManager';
import { BackdropPopover } from './components/WallpaperManager';
import { Background } from './components/Background';
import { BackdropMode } from './data/backgrounds';
import { TrainBookingFlow } from './components/TrainBookingFlow';
import { VIETNAM_STATIONS, getStoredTrainJourney, saveTrainJourney } from './data/trainStations';
import { getCustomWallpaperFromDB } from './utils/wallpaperStorage';
import { getAllCustomBgsFromDB } from './utils/customBgStorage';
import { parseYouTubeUrl } from './utils/youtube';
import { AlertCircle, Layers, Cloud, Eye, Sliders } from 'lucide-react';
import { FlocusActionBar } from './components/FlocusActionBar';
import { MobileActionDrawer } from './components/MobileActionDrawer';
import { YTPlayerError } from './types/player';
import { CloudSyncPopover } from './components/CloudSyncPopover';
import { ClockSettingsPopover } from './components/ClockSettingsPopover';
import {
  getStoredSyncId,
  saveStoredSyncId,
  getStoredLastSyncTime,
  pushSyncData,
  pullSyncData,
  subscribeToLocalSync,
  SyncDataPayload,
} from './utils/cloudSync';

export type AppView = 'focus' | 'train_booking';

export const App: React.FC = () => {
  // 1. Deep Linking: parse ?v=... on initial mount
  const initialVideoFromUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('v');
  }, []);

  // Primary View State: strictly 'focus' | 'train_booking'
  const [appView, setAppView] = useState<AppView>('focus');

  // Queue hook
  const {
    queue,
    currentIndex: currentQueueIndex,
    currentTrack,
    repeatMode,
    nextTrack,
    prevTrack,
    selectTrackByIndex,
    addToQueue,
    removeFromQueue,
    resetQueue,
    toggleRepeat,
  } = useQueue();

  const [currentVideoId, setCurrentVideoId] = useState<string>(() => {
    if (initialVideoFromUrl) return initialVideoFromUrl;
    return currentTrack?.videoId || DEMO_SONGS[0].videoId;
  });

  const [songMeta, setSongMeta] = useState<SongMetadata>({
    videoId: currentVideoId,
    title: currentTrack?.title || '',
    author: currentTrack?.artist || '',
    thumbnailUrl: `https://i.ytimg.com/vi/${currentVideoId}/hqdefault.jpg`,
  });

  // Multi-state Clock Positions & Styles (Flocus inspired)
  const [clockPosition, setClockPosition] = useState<ClockPosition>(() => {
    try {
      const saved = localStorage.getItem('viet_travel_clock_position');
      if (saved === 'center' || saved === 'mini' || saved === 'zen') return saved;
    } catch {}
    return 'center';
  });

  const [clockStyle, setClockStyle] = useState<ClockStyle>(() => {
    try {
      const saved = localStorage.getItem('viet_travel_clock_style');
      if (saved === 'ring' || saved === 'flip' || saved === 'minimal') return saved;
    } catch {}
    return 'ring';
  });

  const [isZenSettingsOpen, setIsZenSettingsOpen] = useState<boolean>(false);
  const [isZenRevealed, setIsZenRevealed] = useState(false);
  const zenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUserActivityInZen = useCallback(() => {
    if (clockPosition !== 'zen') return;
    setIsZenRevealed(true);
    if (zenTimeoutRef.current) clearTimeout(zenTimeoutRef.current);
    zenTimeoutRef.current = setTimeout(() => {
      setIsZenRevealed(false);
    }, 3500);
  }, [clockPosition]);

  const handleClockPositionChange = useCallback((pos: ClockPosition) => {
    setClockPosition(pos);
    try {
      localStorage.setItem('viet_travel_clock_position', pos);
    } catch {}
  }, []);

  const handleClockStyleChange = useCallback((style: ClockStyle) => {
    setClockStyle(style);
    try {
      localStorage.setItem('viet_travel_clock_style', style);
    } catch {}
  }, []);

  // Modals & Drawers state
  const [isQueueDrawerOpen, setIsQueueDrawerOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'url' | 'demos'>('url');

  // Focus Hub Extra Drawers / Popovers
  const [isAmbientMixerOpen, setIsAmbientMixerOpen] = useState<boolean>(false);
  const [isTasksOpen, setIsTasksOpen] = useState<boolean>(false);
  const [isBackdropPopoverOpen, setIsBackdropPopoverOpen] = useState<boolean>(false);

  // Vietnam Train Journey State
  const [trainJourney, setTrainJourney] = useState(() => getStoredTrainJourney());
  const [hasJourneyStarted, setHasJourneyStarted] = useState<boolean>(false);
  const [activeBerthInfo, setActiveBerthInfo] = useState<{ coach: string; compartment: string; berth: string } | null>(() => {
    try {
      const saved = localStorage.getItem('ytlyrics_active_berth_info');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Focus Timer Hook (Pomodoro Engine with anti-throttling & chime)
  const focusTimer = useFocusTimer();

  // Ambient Sounds Hook (Procedural White Noise Engine)
  const ambientSounds = useAmbientSounds();

  // Task Manager State (with localStorage persistence)
  const { tasks, setTasks, activeTaskId, selectActiveTask } = useTasksState();

  const handleAddTask = useCallback((text: string) => {
    const newTask = {
      id: `task_${Date.now()}`,
      text,
      completed: false,
      createdAt: Date.now(),
    };
    setTasks((prev) => [newTask, ...prev]);
  }, [setTasks]);

  const handleToggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, [setTasks]);

  const handleDeleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, [setTasks]);

  // Backdrop Mode State: 'PIXEL_1' | 'PIXEL_2' | 'PIXEL_3' | 'DARK_CANVAS' | 'CUSTOM_WALLPAPER'
  const [backdropMode, setBackdropMode] = useState<BackdropMode>(() => {
    try {
      const saved = localStorage.getItem('ytlyrics_backdrop_mode');
      if (saved) return saved as BackdropMode;
    } catch {}
    return 'PIXEL_1';
  });

  // Artwork display options (Show Artwork Toggle & Optical Blur Slider)
  const [showArtworkCard, setShowArtworkCard] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ytlyrics_show_artwork');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [artworkBlur, setArtworkBlur] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ytlyrics_artwork_blur');
      const num = saved ? Number(saved) : 60;
      return !isNaN(num) && num >= 20 && num <= 100 ? num : 60;
    } catch {
      return 60;
    }
  });

  const [customWallpaperUrl, setCustomWallpaperUrl] = useState<string | null>(null);

  // Retrieve custom wallpaper or uploaded backgrounds from IndexedDB on startup
  useEffect(() => {
    getCustomWallpaperFromDB().then((url) => {
      if (url) {
        setCustomWallpaperUrl(url);
      }
    });

    getAllCustomBgsFromDB().then((bgs) => {
      if (bgs.length > 0 && !customWallpaperUrl) {
        setCustomWallpaperUrl(bgs[0].url);
      }
    });
  }, []);

  const handleSelectBackdropMode = useCallback((newMode: BackdropMode) => {
    setBackdropMode(newMode);
    try {
      localStorage.setItem('ytlyrics_backdrop_mode', newMode);
    } catch {}
  }, []);

  const handleToggleShowArtwork = useCallback((show: boolean) => {
    setShowArtworkCard(show);
    try {
      localStorage.setItem('ytlyrics_show_artwork', String(show));
    } catch {}
  }, []);

  const handleArtworkBlurChange = useCallback((blur: number) => {
    setArtworkBlur(blur);
    try {
      localStorage.setItem('ytlyrics_artwork_blur', String(blur));
    } catch {}
  }, []);

  const handleToggleCockpitBackdrop = useCallback(() => {
    handleSelectBackdropMode(backdropMode === 'POV_VIDEO' ? 'CENTER_ARTWORK' : 'POV_VIDEO');
  }, [backdropMode, handleSelectBackdropMode]);

  const handleSelectTrainRoute = useCallback((depId: string, arrId: string) => {
    const next = { departureId: depId, arrivalId: arrId };
    setTrainJourney(next);
    saveTrainJourney(next);
  }, []);

  const handleCloseTrainBooking = useCallback(() => {
    setAppView('focus');
  }, []);

  const handleStartTrainJourney = useCallback(
    (
      intent: string,
      berthInfo: { coach: string; compartment: string; berth: string },
      durationMinutes: number = 60
    ) => {
      // 1. Unblock Web Audio Context
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') ctx.resume();
        }
      } catch {}

      // 2. Mark journey initiated and switch to POV Train Video
      setHasJourneyStarted(true);
      setActiveBerthInfo(berthInfo);
      handleSelectBackdropMode('POV_VIDEO');
      try {
        localStorage.setItem('ytlyrics_active_berth_info', JSON.stringify(berthInfo));
      } catch {}

      // 3. Auto-initialize Procedural Ambient Sounds, setting Brown Noise to 30%
      try {
        ambientSounds.setChannelVolume('brownNoise', 30);
      } catch {}

      // 4. Configure custom duration and start focus timer immediately
      focusTimer.setMode('focus');
      focusTimer.setCustomDuration(durationMinutes * 60);
      focusTimer.startTimer(durationMinutes * 60);

      // 5. Sync focus intent to TaskManager as the active session task
      const depStation =
        VIETNAM_STATIONS.find((s) => s.id === trainJourney.departureId) ||
        VIETNAM_STATIONS.find((s) => s.id === 'hn') ||
        VIETNAM_STATIONS[0];
      const arrStation =
        VIETNAM_STATIONS.find((s) => s.id === trainJourney.arrivalId) ||
        VIETNAM_STATIONS.find((s) => s.id === 'dn') ||
        VIETNAM_STATIONS[10];
      const taskTitle = `${intent} (${depStation.name} ➔ ${arrStation.name} • ${berthInfo.coach} ${berthInfo.berth})`;

      const existingTask = tasks.find((t) => t.text === taskTitle);
      if (existingTask) {
        selectActiveTask(existingTask.id);
      } else {
        const newTask = {
          id: `task-${Date.now()}`,
          text: taskTitle,
          completed: false,
          createdAt: Date.now(),
        };
        setTasks((prev) => [newTask, ...prev]);
        selectActiveTask(newTask.id);
      }

      // 6. Switch to focus view
      setAppView('focus');
    },
    [
      ambientSounds,
      focusTimer,
      handleSelectBackdropMode,
      selectActiveTask,
      setTasks,
      tasks,
      trainJourney.arrivalId,
      trainJourney.departureId,
    ]
  );

  const handleAbortTrainJourney = () => {
    // 1. Mark journey inactive so train video stops
    setHasJourneyStarted(false);
    setActiveBerthInfo(null);
    handleSelectBackdropMode('CENTER_ARTWORK');
    try {
      localStorage.removeItem('ytlyrics_active_berth_info');
    } catch {}

    // 2. Pause and reset Pomodoro countdown timer
    focusTimer.resetTimer();

    // 3. Stop procedural white/brown noise
    try {
      ambientSounds.stopAll();
    } catch {}

    // 4. Remove journey session from storage
    try {
      localStorage.removeItem('ytlyrics_train_journey');
    } catch {}

    // 5. Reset journey route state to default (Hà Nội -> Đà Nẵng)
    setTrainJourney({ departureId: 'hn', arrivalId: 'dn' });

    // 6. Stay in Focus View cleanly
    setAppView('focus');
  };

  // Notification Toast
  const [toastNotification, setToastNotification] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Volume HUD state
  const [showVolumeHud, setShowVolumeHud] = useState<boolean>(false);

  const showToast = useCallback((msg: string) => {
    setToastNotification(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastNotification(null);
    }, 3500);
  }, []);

  // Cloud Auto-Sync State
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [syncId, setSyncId] = useState<string>(() => getStoredSyncId());
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(() => getStoredLastSyncTime());

  // Debounced Auto-Sync effect
  useEffect(() => {
    const payload: SyncDataPayload = {
      tasks,
      notepad: localStorage.getItem('viet_travel_notepad') || '',
      queue,
      ambientVolumes: ambientSounds.volumes,
      clockStyle,
      clockPosition,
      backdropMode,
      trainJourney: {
        departureId: trainJourney.departureId,
        arrivalId: trainJourney.arrivalId,
      },
      updatedAt: Date.now(),
    };

    pushSyncData(syncId, payload, (status) => {
      setSyncStatus(status);
      if (status === 'synced') {
        setLastSyncedTime(new Date().toLocaleTimeString('vi-VN'));
      }
    });
  }, [
    tasks,
    queue,
    ambientSounds.volumes,
    clockStyle,
    clockPosition,
    backdropMode,
    trainJourney.departureId,
    trainJourney.arrivalId,
    syncId,
  ]);

  // Subscribe to local cross-tab sync
  useEffect(() => {
    const unsubscribe = subscribeToLocalSync((incoming) => {
      if (!incoming) return;
      if (incoming.tasks && Array.isArray(incoming.tasks)) {
        setTasks(incoming.tasks as any);
      }
      if (incoming.clockPosition) {
        setClockPosition(incoming.clockPosition as ClockPosition);
      }
      if (incoming.clockStyle) {
        setClockStyle(incoming.clockStyle as ClockStyle);
      }
      if (incoming.backdropMode) {
        setBackdropMode(incoming.backdropMode as BackdropMode);
      }
      if (incoming.trainJourney) {
        setTrainJourney((prev) => ({ ...prev, ...incoming.trainJourney }));
      }
    });

    return () => unsubscribe();
  }, [setTasks]);

  const handleManualSync = useCallback(async () => {
    setSyncStatus('syncing');
    const remote = await pullSyncData(syncId);
    if (remote) {
      if (remote.tasks && Array.isArray(remote.tasks)) {
        setTasks(remote.tasks as any);
      }
      if (remote.clockPosition) {
        setClockPosition(remote.clockPosition as ClockPosition);
      }
      if (remote.clockStyle) {
        setClockStyle(remote.clockStyle as ClockStyle);
      }
      if (remote.backdropMode) {
        setBackdropMode(remote.backdropMode as BackdropMode);
      }
      if (remote.trainJourney) {
        setTrainJourney((prev) => ({ ...prev, ...remote.trainJourney }));
      }
      showToast('Đồng bộ dữ liệu thành công!');
    }
    setSyncStatus('synced');
    setLastSyncedTime(new Date().toLocaleTimeString('vi-VN'));
  }, [syncId, setTasks, showToast]);

  const handleOpenModal = (tab: 'url' | 'demos' = 'url') => {
    setModalTab(tab);
    setIsModalOpen(true);
  };

  // Handle Track Ended (Auto-Advance)
  const handleTrackEnded = useCallback(() => {
    if (repeatMode === 'one') {
      player.seekTo(0);
      player.play();
      return;
    }

    const next = nextTrack();
    if (next) {
      loadSongById(next.videoId, next.title, next.artist, true);
    } else {
      player.pause();
    }
  }, [repeatMode, nextTrack]);

  // Handle YouTube Embed Errors
  const handlePlayerError = useCallback(
    (error: YTPlayerError) => {
      if (error.isFatal) {
        showToast('Playback restricted by video owner. Skipping to next track in queue...');
        const next = nextTrack();
        if (next) {
          loadSongById(next.videoId, next.title, next.artist, true);
        } else {
          showToast('Playback restricted by video owner. Please pick an alternative track.');
          handleOpenModal('demos');
        }
      } else {
        showToast(`Playback notice: ${error.message}`);
      }
    },
    [nextTrack, showToast]
  );

  // Root persistent YouTube player hook (never unmounted)
  const player = useYouTubePlayer({
    videoId: currentVideoId || '4NRXx6U8ABQ',
    onEnded: handleTrackEnded,
    onError: handlePlayerError,
    onTrackChange: (track) => {
      handlePlayerTrackChange(track);
    },
  });

  // Robust YouTube metadata fetcher using CORS-friendly oEmbed resolver & player fallback
  const fetchYouTubeMeta = useCallback(
    async (videoId: string) => {
      if (!videoId) return;

      try {
        // 1. Try noembed (CORS-free public endpoint)
        const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.title && !data.error) {
            setSongMeta((prev) => ({
              ...prev,
              videoId,
              title: data.title,
              author: data.author_name || prev.author || 'YouTube Music',
              thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            }));
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to fetch via noembed, falling back to IFrame API', e);
      }

      // 2. Fallback: Check YouTube oEmbed
      try {
        const res = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.title) {
            setSongMeta((prev) => ({
              ...prev,
              videoId,
              title: data.title,
              author: data.author_name || prev.author || 'YouTube Music',
              thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            }));
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to fetch via youtube oembed', e);
      }

      // 3. Fallback: Check YouTube IFrame player instance
      try {
        const videoData = player.getVideoData();
        if (videoData && videoData.title) {
          setSongMeta((prev) => ({
            ...prev,
            videoId,
            title: videoData.title,
            author: videoData.author || prev.author || 'YouTube Music',
            thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          }));
          return;
        }
      } catch (e) {
        console.warn('Error reading getVideoData from player:', e);
      }

      // 4. Fallback default if title is still empty
      setSongMeta((prev) => {
        if (prev.title && prev.title !== 'Loading track...') return prev;
        return {
          ...prev,
          videoId,
          title: 'Track ' + videoId,
          author: prev.author || 'YouTube Audio',
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        };
      });
    },
    [player]
  );

  // Sync track metadata on video ID change or initial deep-link mount
  useEffect(() => {
    if (currentVideoId) {
      fetchYouTubeMeta(currentVideoId);
    }
  }, [currentVideoId, fetchYouTubeMeta]);

  // Handle playlist auto-advance or track change inside YouTube player
  const handlePlayerTrackChange = useCallback(
    (track: { videoId: string; title: string; author: string }) => {
      setCurrentVideoId(track.videoId);
      if (track.title) {
        setSongMeta({
          videoId: track.videoId,
          title: track.title,
          author: track.author,
          thumbnailUrl: `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg`,
        });
      } else {
        fetchYouTubeMeta(track.videoId);
      }
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('v', track.videoId);
        window.history.replaceState({}, '', url.toString());
      } catch {}
    },
    [fetchYouTubeMeta]
  );

  // Load video by ID and trigger playback
  const loadSongById = useCallback(
    (videoId: string, overrideTitle?: string, overrideArtist?: string, autoPlay = true) => {
      setCurrentVideoId(videoId);

      // Sync URL without reload
      try {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('v', videoId);
        window.history.replaceState({}, '', newUrl.toString());
      } catch {}

      if (overrideTitle) {
        setSongMeta({
          videoId,
          title: overrideTitle,
          author: overrideArtist || '',
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        });
      } else {
        setSongMeta((prev) => ({
          ...prev,
          videoId,
          title: prev.videoId === videoId && prev.title ? prev.title : 'Loading track...',
          author: overrideArtist || prev.author || '',
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        }));
        fetchYouTubeMeta(videoId);
      }

      player.loadVideo(videoId, autoPlay);
    },
    [player, fetchYouTubeMeta]
  );

  // Parse and stream YouTube URL or Playlist
  const handleLoadYouTubeUrl = useCallback(
    async (rawUrl: string): Promise<boolean> => {
      const parsed = parseYouTubeUrl(rawUrl);
      if (parsed.type === 'invalid') {
        showToast('Link YouTube không hợp lệ. Vui lòng thử lại.');
        return false;
      }

      if (parsed.type === 'playlist' && parsed.playlistId) {
        showToast('Đang phát danh sách (Playlist)...');
        player.loadPlaylist(parsed.playlistId);
        return true;
      }

      if (parsed.type === 'video_with_playlist') {
        if (parsed.playlistId) {
          showToast('Đang phát playlist YouTube...');
          player.loadPlaylist(parsed.playlistId);
        } else if (parsed.videoId) {
          loadSongById(parsed.videoId, '', '', true);
        }
        return true;
      }

      if (parsed.type === 'video' && parsed.videoId) {
        loadSongById(parsed.videoId, '', '', true);
        return true;
      }

      return false;
    },
    [player, loadSongById, showToast]
  );

  // Train Stations Lookup for HUD
  const depStationObj = useMemo(
    () =>
      VIETNAM_STATIONS.find((s) => s.id === trainJourney.departureId) ||
      VIETNAM_STATIONS.find((s) => s.id === 'hn') ||
      VIETNAM_STATIONS[0],
    [trainJourney.departureId]
  );
  const arrStationObj = useMemo(
    () =>
      VIETNAM_STATIONS.find((s) => s.id === trainJourney.arrivalId) ||
      VIETNAM_STATIONS.find((s) => s.id === 'dn') ||
      VIETNAM_STATIONS[10],
    [trainJourney.arrivalId]
  );

  const totalRouteDistanceKm = useMemo(() => {
    return Math.abs(arrStationObj.km - depStationObj.km) || 791;
  }, [arrStationObj.km, depStationObj.km]);

  const handleAddTrackToQueue = useCallback(
    (song: DemoSong) => {
      addToQueue(song);
      showToast(`Đã thêm "${song.title}" vào hàng đợi`);
    },
    [addToQueue, showToast]
  );

  // Global Keyboard Shortcuts
  useShortcuts({
    onTogglePlay: player.togglePlay,
    onSeekRelative: (deltaSeconds: number) => {
      const nextTime = Math.max(0, Math.min(player.duration, player.currentTime + deltaSeconds));
      player.seekTo(nextTime);
    },
    onVolumeChangeRelative: (deltaPercent: number) => {
      const nextVol = Math.max(0, Math.min(100, player.volume + deltaPercent));
      player.setVolume(nextVol);
      setShowVolumeHud(true);
      setTimeout(() => setShowVolumeHud(false), 1200);
    },
    onToggleMute: player.toggleMute,
    onNextTrack: () => {
      if (player.isPlaylist) {
        player.nextVideo();
      } else {
        const next = nextTrack();
        if (next) loadSongById(next.videoId, next.title, next.artist, true);
      }
    },
    onPrevTrack: () => {
      if (player.isPlaylist) {
        player.previousVideo();
      } else if (player.currentTime > 3) {
        player.seekTo(0);
      } else {
        const prev = prevTrack();
        if (prev) loadSongById(prev.videoId, prev.title, prev.artist, true);
      }
    },
  });

  // Web Media Session API Integration
  useMediaSession({
    title: songMeta.title,
    artist: songMeta.author,
    album: 'VietTravelTimer',
    coverUrl: songMeta.thumbnailUrl,
    isPlaying: player.isPlaying,
    isBuffering: player.isBuffering,
    currentTime: player.currentTime,
    duration: player.duration,
    playbackRate: player.playbackRate,
    onPlay: player.play,
    onPause: player.pause,
    onPreviousTrack: () => {
      if (player.currentTime > 3) {
        player.seekTo(0);
      } else {
        const prev = prevTrack();
        if (prev) loadSongById(prev.videoId, prev.title, prev.artist, true);
      }
    },
    onNextTrack: () => {
      const next = nextTrack();
      if (next) loadSongById(next.videoId, next.title, next.artist, true);
    },
    onSeek: (seconds) => player.seekTo(seconds),
  });

  const handleSelectTrackFromQueue = (index: number) => {
    const selected = selectTrackByIndex(index);
    if (selected) {
      loadSongById(selected.videoId, selected.title, selected.artist, true);
    }
  };

  const isArtworkVisible = backdropMode === 'CENTER_ARTWORK' && showArtworkCard && Boolean(songMeta.thumbnailUrl);

  return (
    <div className="relative min-h-[100dvh] md:h-screen w-screen overflow-x-hidden md:overflow-hidden bg-[#09090b] text-white">
      {/* 1. Multi-Mode Background Layer (Apple dynamic art / Custom / POV Train video) */}
      <Background
        mode={backdropMode}
        isRunning={focusTimer.isRunning}
        isBreak={focusTimer.mode !== 'focus'}
        customWallpaperUrl={customWallpaperUrl}
        songThumbnailUrl={songMeta.thumbnailUrl}
        isPlaying={player.isPlaying}
      />

      {/* Persistent YouTube Iframe Target Container (Never Unmounted) */}
      <div
        id={player.containerId}
        className="fixed -top-[9999px] -left-[9999px] w-12 h-12 opacity-[0.001] pointer-events-none -z-50"
        aria-hidden="true"
      />

      {/* Volume HUD Indicator */}
      <AppleHud volume={player.volume} isMuted={player.isMuted} visible={showVolumeHud} />

      {/* ========================================================================= */}
      {/* VIEW: FOCUS HUB (Pomodoro Timer Ring, Tasks, Ambient Noise)               */}
      {/* ========================================================================= */}
      <main
        onMouseMove={handleUserActivityInZen}
        onTouchStart={handleUserActivityInZen}
        className={`relative z-10 flex flex-col min-h-[100dvh] md:h-screen transition-opacity duration-300 ease-out overflow-y-auto md:overflow-hidden overflow-x-hidden [-webkit-overflow-scrolling:touch] pb-32 md:pb-0 ${
          appView === 'focus' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none absolute inset-0'
        }`}
      >
        {/* Top Navbar: Clean Brand and Track Title & Backdrop Trigger */}
        <header
          className="sticky top-0 z-30 bg-[#09090b]/80 backdrop-blur-md w-full px-4 sm:px-6 py-2.5 sm:py-3 border-b border-white/5 pt-[max(env(safe-area-inset-top),0.75rem)] flex items-center justify-between select-none shrink-0"
        >
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            <span className="text-sm font-semibold tracking-tight text-white/90 shrink-0">
              VietTravelTimer
            </span>

            {/* Quick Feature Toolbar: Nhiệm vụ, Ghi chú, Âm thanh (Desktop) */}
            <div className="hidden md:flex items-center">
              <FlocusActionBar
                tasks={tasks}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                queue={queue}
                currentIndex={currentQueueIndex}
                onSelectTrack={handleSelectTrackFromQueue}
                onRemoveTrack={removeFromQueue}
                onAddTrackToQueue={handleAddTrackToQueue}
                repeatMode={repeatMode}
                onToggleRepeat={toggleRepeat}
                isPlaying={player.isPlaying}
                volumes={ambientSounds.volumes}
                isMasterMuted={ambientSounds.isMasterMuted}
                onVolumeChange={ambientSounds.setChannelVolume}
                onToggleMasterMute={ambientSounds.toggleMasterMute}
                onStopAllAmbient={ambientSounds.stopAll}
              />
            </div>
          </div>

          {/* DEAD CENTER: When Clock is Hidden (Zen Mode), place unhide & settings button in the dead center */}
          {clockPosition === 'zen' && (
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-40 animate-fade-in">
              <button
                type="button"
                onClick={() => handleClockPositionChange('center')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black hover:bg-neutral-200 shadow-md text-xs font-medium transition active:scale-95 cursor-pointer"
                title="Hiện lại đồng hồ giữa màn hình"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Hiện đồng hồ</span>
                <span className="xs:hidden">Hiện</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsZenSettingsOpen((prev) => !prev)}
                  className={`p-1.5 rounded-full border transition cursor-pointer ${
                    isZenSettingsOpen
                      ? 'bg-white text-black border-white shadow-sm'
                      : 'bg-black/60 hover:bg-black/90 border-white/10 text-zinc-300 hover:text-white'
                  }`}
                  title="Cài đặt đồng hồ"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>

                <ClockSettingsPopover
                  isOpen={isZenSettingsOpen}
                  onClose={() => setIsZenSettingsOpen(false)}
                  clockStyle={clockStyle}
                  onChangeClockStyle={handleClockStyleChange}
                  clockPosition={clockPosition}
                  onChangeClockPosition={handleClockPositionChange}
                  durations={focusTimer.modeDurations}
                  onUpdateDuration={focusTimer.updateModeDuration}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 sm:w-80"
                />
              </div>
            </div>
          )}

          {/* Right: Current Track Title Pill & Backdrop Popover Trigger */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {songMeta.title && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs text-neutral-300 max-w-[180px] xl:max-w-[240px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="truncate font-sans font-medium">{songMeta.title}</span>
              </div>
            )}

            {/* Cloud Auto-Sync Indicator & Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCloudSyncOpen((prev) => !prev)}
                className="border border-white/10 hover:border-white/20 bg-black/40 backdrop-blur-md px-3 sm:px-3.5 py-1.5 rounded-full text-zinc-300 hover:text-white transition-all text-xs font-sans font-medium flex items-center gap-1.5 sm:gap-2 shadow-sm cursor-pointer"
                title="Đồng bộ đám mây"
              >
                <Cloud className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'text-zinc-400 animate-spin' : 'text-zinc-300'}`} />
                <span className="hidden xs:inline">
                  {syncStatus === 'syncing' ? 'Đang đồng bộ...' : 'Đã đồng bộ'}
                </span>
                <span className="xs:hidden">
                  {syncStatus === 'syncing' ? 'Đang lưu' : 'Đồng bộ'}
                </span>
              </button>

              <CloudSyncPopover
                isOpen={isCloudSyncOpen}
                onClose={() => setIsCloudSyncOpen(false)}
                syncId={syncId}
                onUpdateSyncId={(newId) => {
                  setSyncId(newId);
                  saveStoredSyncId(newId);
                  showToast(`Đã đổi mã đồng bộ thành: ${newId}`);
                }}
                isSyncing={syncStatus === 'syncing'}
                lastSyncedTime={lastSyncedTime}
                onTriggerSync={handleManualSync}
              />
            </div>

            {/* Floating Backdrop Controller Trigger Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsBackdropPopoverOpen((prev) => !prev)}
                className="border border-white/10 hover:border-white/30 bg-black/40 backdrop-blur-md px-3 sm:px-3.5 py-1.5 rounded-full text-zinc-300 hover:text-white transition-all text-xs font-sans font-medium flex items-center gap-1.5 sm:gap-2 shadow-sm cursor-pointer"
                title="Tùy chỉnh phông nền"
              >
                <Layers className="w-3.5 h-3.5 text-zinc-300" />
                <span>Phông nền</span>
              </button>

              {/* Floating Backdrop Selector Popover Panel (Apple HIG) */}
              <BackdropPopover
                isOpen={isBackdropPopoverOpen}
                onClose={() => setIsBackdropPopoverOpen(false)}
                mode={backdropMode}
                onSelectMode={handleSelectBackdropMode}
                customWallpaperUrl={customWallpaperUrl}
                onWallpaperUpdated={(url) => {
                  setCustomWallpaperUrl(url);
                  if (url) handleSelectBackdropMode('CUSTOM_WALLPAPER');
                }}
                showArtworkCard={showArtworkCard}
                onToggleShowArtwork={handleToggleShowArtwork}
                artworkBlur={artworkBlur}
                onArtworkBlurChange={handleArtworkBlurChange}
              />
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* DESKTOP WORKSPACE (Flocus Minimal Layout: Centered Clock or Mini/Zen)    */}
        {/* ========================================================================= */}
        <div
          className={`hidden md:flex flex-1 flex-col items-center justify-center max-w-5xl mx-auto w-full px-6 pt-2 pb-24 md:pb-28 select-none transition-opacity duration-300 ${
            clockPosition === 'zen' && !isZenRevealed ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {isArtworkVisible ? (
            <div className="grid grid-cols-12 gap-8 items-center justify-center w-full">
              {/* Left Column (col-span-5): Media Artwork & Track Info */}
              <div className="col-span-5 flex flex-col items-center justify-center animate-fade-in">
                <div className="relative w-64 h-64 lg:w-72 lg:h-72">
                  <img
                    src={songMeta.thumbnailUrl}
                    alt=""
                    style={{ filter: `blur(${artworkBlur}px)` }}
                    className="absolute inset-0 w-full h-full object-cover rounded-3xl opacity-60 scale-110 pointer-events-none transform-gpu -z-10"
                  />
                  <img
                    src={songMeta.thumbnailUrl}
                    alt={songMeta.title}
                    className="w-full h-full object-cover rounded-3xl border border-white/15 shadow-2xl relative z-10"
                  />
                </div>
                <div className="mt-4 text-center max-w-[260px]">
                  <h2 className="text-sm font-sans font-bold text-white tracking-[0.05em] truncate">{songMeta.title}</h2>
                  <p className="text-xs font-mono text-zinc-400 truncate mt-0.5">{songMeta.author}</p>
                </div>
              </div>

              {/* Right Column (col-span-7): Pomodoro Clock */}
              <div className="col-span-7 flex flex-col items-center justify-center">
                <FocusTimerDisplay
                  mode={focusTimer.mode}
                  setMode={focusTimer.setMode}
                  durations={focusTimer.modeDurations}
                  onUpdateDuration={focusTimer.updateModeDuration}
                  isRunning={focusTimer.isRunning}
                  formattedTime={focusTimer.formattedTime}
                  progressPercent={focusTimer.progressPercent}
                  remainingSeconds={focusTimer.remainingSeconds}
                  totalDuration={focusTimer.totalSeconds}
                  onToggleTimer={focusTimer.toggleTimer}
                  onResetTimer={focusTimer.resetTimer}
                  departureId={trainJourney.departureId}
                  arrivalId={trainJourney.arrivalId}
                  onOpenBookingFlow={() => setAppView('train_booking')}
                  onChangeRoute={(depId, arrId) => {
                    const next = { departureId: depId, arrivalId: arrId };
                    setTrainJourney(next);
                    saveTrainJourney(next);
                  }}
                  isTrainMode={false}
                  onToggleTrainMode={() => handleSelectBackdropMode('PIXEL_1')}
                  hasJourneyStarted={hasJourneyStarted}
                  onAbortJourney={handleAbortTrainJourney}
                  berthInfo={activeBerthInfo}
                  backgroundMode={backdropMode}
                  onToggleBackgroundMode={handleToggleCockpitBackdrop}
                  clockPosition={clockPosition}
                  onChangeClockPosition={handleClockPositionChange}
                  clockStyle={clockStyle}
                  onChangeClockStyle={handleClockStyleChange}
                />
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center">
              <FocusTimerDisplay
                mode={focusTimer.mode}
                setMode={focusTimer.setMode}
                durations={focusTimer.modeDurations}
                onUpdateDuration={focusTimer.updateModeDuration}
                isRunning={focusTimer.isRunning}
                formattedTime={focusTimer.formattedTime}
                progressPercent={focusTimer.progressPercent}
                remainingSeconds={focusTimer.remainingSeconds}
                totalDuration={focusTimer.totalSeconds}
                onToggleTimer={focusTimer.toggleTimer}
                onResetTimer={focusTimer.resetTimer}
                departureId={trainJourney.departureId}
                arrivalId={trainJourney.arrivalId}
                onOpenBookingFlow={() => setAppView('train_booking')}
                onChangeRoute={(depId, arrId) => {
                  const next = { departureId: depId, arrivalId: arrId };
                  setTrainJourney(next);
                  saveTrainJourney(next);
                }}
                isTrainMode={backdropMode === 'PIXEL_1' || backdropMode === 'PIXEL_2' || backdropMode === 'PIXEL_3'}
                onToggleTrainMode={() =>
                  handleSelectBackdropMode(backdropMode === 'DARK_CANVAS' ? 'PIXEL_1' : 'DARK_CANVAS')
                }
                hasJourneyStarted={hasJourneyStarted}
                onAbortJourney={handleAbortTrainJourney}
                berthInfo={activeBerthInfo}
                backgroundMode={backdropMode}
                onToggleBackgroundMode={handleToggleCockpitBackdrop}
                clockPosition={clockPosition}
                onChangeClockPosition={handleClockPositionChange}
                clockStyle={clockStyle}
                onChangeClockStyle={handleClockStyleChange}
              />
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* DEDICATED MOBILE WORKSPACE                                               */}
        {/* ========================================================================= */}
        <div
          className={`block md:hidden flex-1 w-full max-w-md mx-auto px-4 pt-2 pb-56 space-y-6 transition-opacity duration-300 ${
            clockPosition === 'zen' && !isZenRevealed ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="w-full flex flex-col items-center justify-center">
            <FocusTimerDisplay
              mode={focusTimer.mode}
              setMode={focusTimer.setMode}
              durations={focusTimer.modeDurations}
              onUpdateDuration={focusTimer.updateModeDuration}
              isRunning={focusTimer.isRunning}
              formattedTime={focusTimer.formattedTime}
              progressPercent={focusTimer.progressPercent}
              remainingSeconds={focusTimer.remainingSeconds}
              totalDuration={focusTimer.totalSeconds}
              onToggleTimer={focusTimer.toggleTimer}
              onResetTimer={focusTimer.resetTimer}
              departureId={trainJourney.departureId}
              arrivalId={trainJourney.arrivalId}
              onOpenBookingFlow={() => setAppView('train_booking')}
              onChangeRoute={(depId, arrId) => {
                const next = { departureId: depId, arrivalId: arrId };
                setTrainJourney(next);
                saveTrainJourney(next);
              }}
              isTrainMode={backdropMode === 'PIXEL_1' || backdropMode === 'PIXEL_2' || backdropMode === 'PIXEL_3'}
              onToggleTrainMode={() =>
                handleSelectBackdropMode(backdropMode === 'DARK_CANVAS' ? 'PIXEL_1' : 'DARK_CANVAS')
              }
              hasJourneyStarted={hasJourneyStarted}
              onAbortJourney={handleAbortTrainJourney}
              berthInfo={activeBerthInfo}
              backgroundMode={backdropMode}
              onToggleBackgroundMode={handleToggleCockpitBackdrop}
              clockPosition={clockPosition}
              onChangeClockPosition={handleClockPositionChange}
              clockStyle={clockStyle}
              onChangeClockStyle={handleClockStyleChange}
            />
          </div>
        </div>
      </main>

      {/* Floating Notification Toast */}
      {toastNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#18181B]/95 border border-white/10 text-neutral-200 text-xs flex items-center justify-between shadow-2xl animate-fade-in backdrop-blur-2xl">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-neutral-400" />
            <span>{toastNotification}</span>
          </div>
        </div>
      )}

      {/* Mobile Action Bar & Bottom Drawer (Tasks, Notes, Sounds on mobile) */}
      <MobileActionDrawer
        tasks={tasks}
        onAddTask={handleAddTask}
        onToggleTask={handleToggleTask}
        onDeleteTask={handleDeleteTask}
        queue={queue}
        currentIndex={currentQueueIndex}
        onSelectTrack={handleSelectTrackFromQueue}
        onRemoveTrack={removeFromQueue}
        onAddTrackToQueue={handleAddTrackToQueue}
        repeatMode={repeatMode}
        onToggleRepeat={toggleRepeat}
        isPlaying={player.isPlaying}
        volumes={ambientSounds.volumes}
        isMasterMuted={ambientSounds.isMasterMuted}
        onVolumeChange={ambientSounds.setChannelVolume}
        onToggleMasterMute={ambientSounds.toggleMasterMute}
        onStopAllAmbient={ambientSounds.stopAll}
      />

      {/* Integrated Apple-Minimalist Bottom Music Controller with Animated Railway Progress Track */}
      <div
        className={`transition-opacity duration-300 ${
          clockPosition === 'zen' && !isZenRevealed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <BottomPlayerBar
          title={songMeta.title}
          artist={songMeta.author}
          thumbnailUrl={songMeta.thumbnailUrl}
          onLoadUrl={handleLoadYouTubeUrl}
          isPlaying={player.isPlaying}
          onTogglePlay={player.togglePlay}
          onPrevTrack={() => {
            if (player.isPlaylist) {
              player.previousVideo();
            } else if (player.currentTime > 3) {
              player.seekTo(0);
            } else {
              const prev = prevTrack();
              if (prev) loadSongById(prev.videoId, prev.title, prev.artist, true);
            }
          }}
          onNextTrack={() => {
            if (player.isPlaylist) {
              player.nextVideo();
            } else {
              const next = nextTrack();
              if (next) loadSongById(next.videoId, next.title, next.artist, true);
            }
          }}
          currentTime={player.currentTime}
          duration={player.duration}
          onSeek={(sec) => player.seekTo(sec)}
          volume={player.volume}
          isMuted={player.isMuted}
          onVolumeChange={(vol) => player.setVolume(vol)}
          onToggleMute={player.toggleMute}
          onToggleAmbient={() => setIsAmbientMixerOpen((prev) => !prev)}
          hasActiveAmbient={!ambientSounds.isMasterMuted && Object.values(ambientSounds.volumes).some((v) => v > 0)}
          taskCount={tasks.length}
          completedTaskCount={tasks.filter((t) => t.completed).length}
          onToggleTasks={() => setIsTasksOpen(true)}
          hasJourneyStarted={hasJourneyStarted}
          departureStation={{
            code: depStationObj.code,
            name: depStationObj.name,
          }}
          arrivalStation={{
            code: arrStationObj.code,
            name: arrStationObj.name,
          }}
          departureKm={depStationObj.km}
          arrivalKm={arrStationObj.km}
          onStartJourneyClick={() => setAppView('train_booking')}
          onAbortJourney={handleAbortTrainJourney}
          timerProgressPercent={focusTimer.progressPercent}
          isTimerRunning={focusTimer.isRunning}
          totalRouteDistanceKm={totalRouteDistanceKm}
        />
      </div>

      {/* Modals & Drawers */}
      <SongModal
        isOpen={isModalOpen}
        activeTab={modalTab}
        onClose={() => setIsModalOpen(false)}
        onSelectVideoId={(vid, overrideTitle, overrideArtist) => {
          loadSongById(vid, overrideTitle, overrideArtist, true);
        }}
        onSelectPlaylist={(pId) => {
          handleLoadYouTubeUrl(`https://www.youtube.com/playlist?list=${pId}`);
        }}
      />

      <PlaylistDrawer
        isOpen={isQueueDrawerOpen}
        onClose={() => setIsQueueDrawerOpen(false)}
        queue={queue}
        currentIndex={currentQueueIndex}
        onSelectTrack={handleSelectTrackFromQueue}
        onRemoveTrack={removeFromQueue}
        onAddToQueue={addToQueue}
        onResetQueue={resetQueue}
      />

      {/* Focus Hub Drawers / Modals */}
      <AmbientSoundMixer
        isOpen={isAmbientMixerOpen}
        onClose={() => setIsAmbientMixerOpen(false)}
        volumes={ambientSounds.volumes}
        isMasterMuted={ambientSounds.isMasterMuted}
        onVolumeChange={ambientSounds.setChannelVolume}
        onToggleMasterMute={ambientSounds.toggleMasterMute}
        onStopAll={ambientSounds.stopAll}
      />

      <TaskManager
        isOpen={isTasksOpen}
        onClose={() => setIsTasksOpen(false)}
        activeTaskId={activeTaskId}
        onSelectActiveTask={selectActiveTask}
        tasks={tasks}
        setTasks={setTasks}
      />

      {/* Persistent Full-Screen Train Booking Overlay */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ease-out bg-black ${
          appView === 'train_booking' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none invisible'
        }`}
      >
        <TrainBookingFlow
          isOpen={appView === 'train_booking'}
          onClose={handleCloseTrainBooking}
          departureId={trainJourney.departureId}
          arrivalId={trainJourney.arrivalId}
          onSelectRoute={handleSelectTrainRoute}
          onStartJourney={handleStartTrainJourney}
        />
      </div>
    </div>
  );
};

export default App;
