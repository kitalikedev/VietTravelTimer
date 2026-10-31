import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { SongMetadata } from './types';
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
import { FocusTimerDisplay } from './components/FocusTimerDisplay';
import { BottomPlayerBar } from './components/BottomPlayerBar';
import { AmbientSoundMixer } from './components/AmbientSoundMixer';
import { TaskManager, useTasksState } from './components/TaskManager';
import { BackdropPopover, BackdropMode } from './components/WallpaperManager';
import { Background } from './components/Background';
import { TrainBookingFlow } from './components/TrainBookingFlow';
import { VIETNAM_STATIONS, getStoredTrainJourney, saveTrainJourney } from './data/trainStations';
import { getCustomWallpaperFromDB } from './utils/wallpaperStorage';
import { parseYouTubeUrl } from './utils/youtube';
import { AlertCircle, Check, Layers } from 'lucide-react';
import { YTPlayerError } from './types/player';

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
  const activeTask = tasks.find((t) => t.id === activeTaskId) || null;

  // Backdrop Mode State: 'CENTER_ARTWORK' | 'CUSTOM_WALLPAPER' | 'POV_VIDEO'
  const [backdropMode, setBackdropMode] = useState<BackdropMode>(() => {
    try {
      const saved = localStorage.getItem('ytlyrics_backdrop_mode');
      if (saved === 'CENTER_ARTWORK' || saved === 'CUSTOM_WALLPAPER' || saved === 'POV_VIDEO') {
        return saved;
      }
    } catch {}
    return 'CENTER_ARTWORK';
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

  // Retrieve custom wallpaper from IndexedDB on startup
  useEffect(() => {
    getCustomWallpaperFromDB().then((url) => {
      if (url) {
        setCustomWallpaperUrl(url);
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

  const handleStartTrainJourney = (
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
      VIETNAM_STATIONS.find((s) => s.id === trainJourney.departureId) || VIETNAM_STATIONS[0];
    const arrStation =
      VIETNAM_STATIONS.find((s) => s.id === trainJourney.arrivalId) || VIETNAM_STATIONS[4];
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
  };

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

  // Handle playlist auto-advance or track change inside YouTube player
  const handlePlayerTrackChange = useCallback((track: { videoId: string; title: string; author: string }) => {
    setCurrentVideoId(track.videoId);
    setSongMeta({
      videoId: track.videoId,
      title: track.title,
      author: track.author,
      thumbnailUrl: `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg`,
    });
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('v', track.videoId);
      window.history.replaceState({}, '', url.toString());
    } catch {}
  }, []);

  // Root persistent YouTube player hook (never unmounted)
  const player = useYouTubePlayer({
    videoId: currentVideoId || '4NRXx6U8ABQ',
    onEnded: handleTrackEnded,
    onError: handlePlayerError,
    onTrackChange: handlePlayerTrackChange,
  });

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

      setSongMeta({
        videoId,
        title: overrideTitle || 'Loading track...',
        author: overrideArtist || '',
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      });

      player.loadVideo(videoId, autoPlay);
    },
    [player]
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
    () => VIETNAM_STATIONS.find((s) => s.id === trainJourney.departureId) || VIETNAM_STATIONS[0],
    [trainJourney.departureId]
  );
  const arrStationObj = useMemo(
    () => VIETNAM_STATIONS.find((s) => s.id === trainJourney.arrivalId) || VIETNAM_STATIONS[4],
    [trainJourney.arrivalId]
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
    album: 'Focus Hub',
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

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#09090b] text-white">
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
      <div
        className={`h-full w-full flex flex-col justify-between transition-opacity duration-300 relative z-20 pointer-events-auto pb-16 ${
          appView === 'focus'
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none absolute inset-0'
        }`}
      >
        {/* Top Navbar: Clean Brand and Track Title & Backdrop Trigger */}
        <header className="w-full px-6 py-4 flex items-center justify-between select-none">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase font-mono">
              Focus Hub
            </span>
          </div>

          {/* Right: Current Track Title Pill & Backdrop Popover Trigger */}
          <div className="flex items-center gap-3">
            {songMeta.title && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs text-neutral-300 max-w-[240px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="truncate font-sans font-medium">{songMeta.title}</span>
              </div>
            )}

            {/* Floating Backdrop Controller Trigger Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsBackdropPopoverOpen((prev) => !prev)}
                className="border border-white/10 hover:border-white/30 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full text-zinc-300 hover:text-white transition-all text-xs font-mono tracking-wider flex items-center gap-2 shadow-sm"
                title="Tùy chỉnh phông nền"
              >
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <span>PHÔNG NỀN // BACKDROP</span>
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

        {/* Center Workspace: Responsive Two-Column Layout (Left: Large Artwork, Right: Pomodoro Timer & HUD) */}
        <main className="relative z-20 flex-1 flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-14 w-full max-w-5xl mx-auto px-6 py-6 select-none md:pr-72 xl:pr-0">
          {/* LEFT COLUMN (40% Desktop): Large Centered Album Artwork */}
          {backdropMode === 'CENTER_ARTWORK' && showArtworkCard && songMeta.thumbnailUrl && (
            <div className="w-full md:w-[42%] flex flex-col items-center justify-center flex-shrink-0 animate-fade-in">
              <div className="relative w-60 h-60 sm:w-72 sm:h-72 lg:w-80 lg:h-80">
                {/* Ambient Optical Glow behind artwork */}
                <img
                  src={songMeta.thumbnailUrl}
                  alt=""
                  style={{ filter: `blur(${artworkBlur}px)` }}
                  className="absolute inset-0 w-full h-full object-cover rounded-3xl opacity-60 scale-110 pointer-events-none transform-gpu -z-10"
                />
                {/* Razor-sharp Primary Cover Art */}
                <img
                  src={songMeta.thumbnailUrl}
                  alt={songMeta.title}
                  className="w-full h-full object-cover rounded-3xl border border-white/15 shadow-2xl relative z-10"
                />
              </div>

              {/* Subtle Track Meta beneath artwork */}
              <div className="mt-4 text-center max-w-[280px]">
                <h2 className="text-sm font-sans font-bold text-white tracking-[0.05em] truncate">{songMeta.title}</h2>
                <p className="text-xs font-mono text-zinc-400 truncate mt-0.5">{songMeta.author}</p>
              </div>
            </div>
          )}

          {/* RIGHT COLUMN (60% Desktop): Pomodoro Timer & Journey HUD */}
          <div className={`flex flex-col items-center justify-center flex-1 w-full max-w-md ${
            backdropMode === 'CENTER_ARTWORK' && showArtworkCard && songMeta.thumbnailUrl ? 'md:w-[58%]' : ''
          }`}>
            <FocusTimerDisplay
              mode={focusTimer.mode}
              setMode={focusTimer.setMode}
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
              isTrainMode={backdropMode === 'POV_VIDEO'}
              onToggleTrainMode={() =>
                handleSelectBackdropMode(backdropMode === 'POV_VIDEO' ? 'CENTER_ARTWORK' : 'POV_VIDEO')
              }
              hasJourneyStarted={hasJourneyStarted}
              onAbortJourney={handleAbortTrainJourney}
              berthInfo={activeBerthInfo}
              backgroundMode={backdropMode}
              onToggleBackgroundMode={handleToggleCockpitBackdrop}
            />
          </div>
        </main>

        {/* Right-Side Active Task HUD (Apple Design - Pure Typography) */}
        <aside className="fixed right-6 top-1/2 -translate-y-1/2 z-20 w-64 sm:w-72 md:w-80 pointer-events-auto select-none hidden md:block">
          {activeTask ? (
            <div className="p-4 rounded-2xl bg-[#0e0e11]/95 border border-white/10 text-left transition-all backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-sans font-semibold text-zinc-300">
                    Mục tiêu tập trung
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTasksOpen(true)}
                  className="text-[11px] font-sans font-medium text-zinc-400 hover:text-white transition"
                >
                  Đổi việc
                </button>
              </div>

              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTasks((prev) =>
                      prev.map((t) => (t.id === activeTask.id ? { ...t, completed: !t.completed } : t))
                    );
                  }}
                  className={`w-5 h-5 mt-0.5 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${
                    activeTask.completed
                      ? 'bg-white border-white text-black'
                      : 'border-white/30 hover:border-white text-transparent'
                  }`}
                  title={activeTask.completed ? 'Đánh dấu chưa xong' : 'Hoàn thành mục tiêu'}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-medium leading-relaxed transition-all ${
                      activeTask.completed ? 'line-through text-zinc-500' : 'text-zinc-100'
                    }`}
                  >
                    {activeTask.text}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsTasksOpen(true)}
              className="w-full p-4 rounded-2xl bg-[#0e0e11]/90 hover:bg-[#151518] border border-white/10 text-left transition-all group backdrop-blur-xl shadow-xl"
            >
              <div className="flex items-center justify-between text-[11px] font-sans font-semibold text-zinc-400 group-hover:text-zinc-300 mb-1">
                <span>Mục tiêu phiên tập trung</span>
                <span className="text-zinc-400 group-hover:text-white font-normal">+ Thêm</span>
              </div>
              <p className="text-xs text-zinc-500 group-hover:text-zinc-300 font-normal">
                Chọn công việc để tập trung
              </p>
            </button>
          )}
        </aside>
      </div>

      {/* Floating Notification Toast */}
      {toastNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#18181B]/95 border border-white/10 text-neutral-200 text-xs flex items-center justify-between shadow-2xl animate-fade-in backdrop-blur-2xl">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-neutral-400" />
            <span>{toastNotification}</span>
          </div>
        </div>
      )}

      {/* Integrated Apple-Minimalist Bottom Music Controller */}
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
        onToggleTasks={() => setIsTasksOpen((prev) => !prev)}
        hasJourneyStarted={hasJourneyStarted}
        departureStation={{
          code: depStationObj.code,
          name: depStationObj.name,
        }}
        arrivalStation={{
          code: arrStationObj.code,
          name: arrStationObj.name,
        }}
        onStartJourneyClick={() => setAppView('train_booking')}
        onAbortJourney={handleAbortTrainJourney}
      />

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

      {/* Vietnam Railway Focus Journey (Flight-Inspired Flow) */}
      <TrainBookingFlow
        isOpen={appView === 'train_booking'}
        onClose={() => setAppView('focus')}
        departureId={trainJourney.departureId}
        arrivalId={trainJourney.arrivalId}
        onSelectRoute={(depId, arrId) => {
          const next = { departureId: depId, arrivalId: arrId };
          setTrainJourney(next);
          saveTrainJourney(next);
        }}
        onStartJourney={handleStartTrainJourney}
      />
    </div>
  );
};

export default App;
