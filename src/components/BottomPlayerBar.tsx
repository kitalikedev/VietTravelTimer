import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Headphones,
  X,
} from 'lucide-react';
import { getRouteMilestones, RouteMilestone } from '../data/railwayMilestones';

export interface BottomPlayerBarProps {
  // Track metadata
  title: string;
  artist: string;
  thumbnailUrl: string;

  // URL input handler
  onLoadUrl: (url: string) => Promise<boolean> | boolean;

  // Transport playback
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;

  // Scrubber timing
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;

  // Audio volume
  volume: number;
  isMuted: boolean;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;

  // Extra utilities (optional)
  onToggleAmbient?: () => void;
  hasActiveAmbient?: boolean;
  taskCount?: number;
  completedTaskCount?: number;
  onToggleTasks?: () => void;

  // Train Journey State
  hasJourneyStarted: boolean;
  departureStation: { code: string; name: string };
  arrivalStation: { code: string; name: string };
  departureKm?: number;
  arrivalKm?: number;
  onStartJourneyClick: () => void;
  onAbortJourney?: () => void;

  // Animated Railway Track Props
  timerProgressPercent?: number;
  isTimerRunning?: boolean;
  totalRouteDistanceKm?: number;
}

export const BottomPlayerBar: React.FC<BottomPlayerBarProps> = ({
  title,
  artist,
  thumbnailUrl,
  onLoadUrl,
  isPlaying,
  onTogglePlay,
  onPrevTrack,
  onNextTrack,
  currentTime,
  duration,
  onSeek,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  onToggleAmbient,
  hasActiveAmbient = false,
  hasJourneyStarted,
  departureStation,
  arrivalStation,
  departureKm = 0,
  arrivalKm = 791,
  onStartJourneyClick,
  onAbortJourney,
  timerProgressPercent = 0,
  isTimerRunning = false,
  totalRouteDistanceKm = 791,
}) => {
  const [isUrlPopoverOpen, setIsUrlPopoverOpen] = useState(false);
  const [pasteUrlInput, setPasteUrlInput] = useState('');
  const [isSubmittingUrl, setIsSubmittingUrl] = useState(false);

  // Province Milestone Tracking & Auto-Popup
  const [activeMilestonePopup, setActiveMilestonePopup] = useState<RouteMilestone | null>(null);
  const triggeredMilestonesRef = useRef<Set<string>>(new Set());
  const popupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const routeMilestones = useMemo(
    () => getRouteMilestones(departureKm, arrivalKm),
    [departureKm, arrivalKm]
  );

  // Trigger auto-popup when train crosses an intermediate milestone
  useEffect(() => {
    if (!isTimerRunning || timerProgressPercent <= 0) return;

    for (const m of routeMilestones) {
      // Trigger when train reaches/crosses milestone and hasn't been triggered yet
      if (
        timerProgressPercent >= m.percent &&
        !triggeredMilestonesRef.current.has(m.id) &&
        m.percent > 0 &&
        m.percent < 100
      ) {
        triggeredMilestonesRef.current.add(m.id);
        setActiveMilestonePopup(m);

        if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
        popupTimeoutRef.current = setTimeout(() => {
          setActiveMilestonePopup(null);
        }, 6000);
        break;
      }
    }
  }, [timerProgressPercent, isTimerRunning, routeMilestones]);

  // Reset triggers when timer is reset
  useEffect(() => {
    if (timerProgressPercent === 0) {
      triggeredMilestonesRef.current.clear();
      setActiveMilestonePopup(null);
    }
  }, [timerProgressPercent]);

  // Scrubber interactive dragging state
  const [isDraggingScrubber, setIsDraggingScrubber] = useState(false);
  const [dragTime, setDragTime] = useState<number>(0);

  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Close popover when clicking outside
  useEffect(() => {
    if (!isUrlPopoverOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsUrlPopoverOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsUrlPopoverOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUrlPopoverOpen]);

  // Focus input when popover opens
  useEffect(() => {
    if (isUrlPopoverOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isUrlPopoverOpen]);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = pasteUrlInput.trim();
    if (!cleanUrl) return;

    setIsSubmittingUrl(true);
    try {
      const success = await onLoadUrl(cleanUrl);
      if (success) {
        setPasteUrlInput('');
        setIsUrlPopoverOpen(false);
      }
    } finally {
      setIsSubmittingUrl(false);
    }
  };

  // Helper to format seconds to m:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Scrubber pointer interactions
  const displayTime = isDraggingScrubber ? dragTime : currentTime;
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (displayTime / duration) * 100)) : 0;

  const handleScrubberPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const targetSeconds = (clickX / rect.width) * duration;

    setIsDraggingScrubber(true);
    setDragTime(targetSeconds);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const moveX = Math.max(0, Math.min(moveEvent.clientX - rect.left, rect.width));
      const moveSeconds = (moveX / rect.width) * duration;
      setDragTime(moveSeconds);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      const finalX = Math.max(0, Math.min(upEvent.clientX - rect.left, rect.width));
      const finalSeconds = (finalX / rect.width) * duration;
      onSeek(finalSeconds);
      setIsDraggingScrubber(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Shared URL Popover Card
  const renderUrlPopover = (isMobile: boolean) => {
    if (!isUrlPopoverOpen) return null;
    return (
      <div
        className={`p-3 rounded-2xl bg-[#14151a]/98 border border-white/15 shadow-2xl z-50 animate-fade-in flex flex-col gap-2.5 backdrop-blur-xl ${
          isMobile
            ? 'absolute bottom-full mb-2 left-0 right-0 max-w-md mx-auto pointer-events-auto'
            : 'absolute bottom-11 left-0 w-80'
        }`}
      >
        <div className="flex items-center justify-between text-xs font-sans text-zinc-300 font-semibold px-0.5">
          <span>Dán URL YouTube / Playlist</span>
          <button
            type="button"
            onClick={() => setIsUrlPopoverOpen(false)}
            className="text-zinc-500 hover:text-white text-[11px] font-normal cursor-pointer"
          >
            Đóng
          </button>
        </div>

        <form onSubmit={handleUrlSubmit} className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="text"
            value={pasteUrlInput}
            onChange={(e) => setPasteUrlInput(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 font-mono"
          />

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  if (text) {
                    setPasteUrlInput(text);
                    inputRef.current?.focus();
                  }
                } catch {}
              }}
              className="px-2.5 py-1 text-[11px] font-sans text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition cursor-pointer"
            >
              Dán từ Clipboard
            </button>

            <button
              type="submit"
              disabled={isSubmittingUrl || !pasteUrlInput.trim()}
              className="px-4 py-1.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmittingUrl ? 'Đang tải...' : 'Phát ngay'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Shared Animated Railway Progress Track Component
  const renderRailwayTrack = () => {
    const progress = Math.min(100, Math.max(0, timerProgressPercent));
    const traveledKm = Math.round((totalRouteDistanceKm * progress) / 100);

    return (
      <div className="w-full pt-1.5 pb-0.5 px-3 border-t border-white/5 flex flex-col gap-0.5 select-none">
        <div className="flex items-center justify-between text-[11px] font-sans font-medium text-white/70">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="font-semibold text-white/90">{departureStation.name}</span>
            <span className="text-[10px] text-white/40 font-mono">({departureStation.code})</span>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-mono text-white/60">
            <span className="text-white font-semibold">{traveledKm} km</span>
            <span className="text-white/30">/</span>
            <span>{totalRouteDistanceKm} km</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-white/40 font-mono">({arrivalStation.code})</span>
            <span className="font-semibold text-white/90">{arrivalStation.name}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          </div>
        </div>

        {/* Dual Rails & Railroad Ties Track */}
        <div className="relative h-4 flex items-center w-full my-0.5">
          {/* Milestone Popup (Floating above the track / train) */}
          {activeMilestonePopup && (
            <div
              className="absolute bottom-full mb-3 -translate-x-1/2 z-50 pointer-events-auto select-none transition-all duration-300"
              style={{ left: `${Math.min(85, Math.max(15, activeMilestonePopup.percent))}%` }}
            >
              <div className="bg-[#121214]/95 backdrop-blur-2xl border border-white/20 text-white px-3.5 py-2 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.85)] flex items-center gap-2.5 whitespace-nowrap">
                <div className="relative flex items-center justify-center shrink-0">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  <span className="absolute w-3.5 h-3.5 rounded-full bg-white/40 animate-ping" />
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">
                      Đang đi qua: {activeMilestonePopup.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      ({activeMilestonePopup.km} km)
                    </span>
                  </div>
                  <p className="text-[11px] text-white/70">
                    {activeMilestonePopup.note} • Cách ga đầu {activeMilestonePopup.distanceFromStart} km
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMilestonePopup(null)}
                  className="text-zinc-400 hover:text-white transition p-0.5 cursor-pointer ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Rails: Top & bottom hairline rails */}
          <div className="absolute inset-x-0 top-1 h-[1px] bg-white/20" />
          <div className="absolute inset-x-0 bottom-1 h-[1px] bg-white/20" />

          {/* Traveled Rails (highlighted in monochrome white) */}
          <div
            className="absolute left-0 top-1 h-[1px] bg-white transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute left-0 bottom-1 h-[1px] bg-white transition-all duration-300"
            style={{ width: `${progress}%` }}
          />

          {/* Railroad Ties Pattern */}
          <div
            className="absolute inset-x-0 inset-y-1 opacity-25"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 2px, transparent 2px, transparent 10px)',
            }}
          />

          {/* Province Milestone Dots along the track */}
          {routeMilestones.map((m) => {
            const isPassed = progress >= m.percent;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveMilestonePopup(m)}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-15 group/dot p-1 cursor-pointer focus:outline-none"
                style={{ left: `${m.percent}%` }}
                title={`${m.name} (${m.km} km) - ${m.note}`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    isPassed
                      ? 'bg-white ring-2 ring-white/30 scale-110 shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                      : 'bg-white/30 group-hover/dot:bg-white group-hover/dot:scale-125'
                  }`}
                />
              </button>
            );
          })}

          {/* Miniature Animated Locomotive */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300 ease-out z-10 flex items-center"
            style={{ left: `${Math.min(99, Math.max(1, progress))}%` }}
          >
            <div className="relative flex items-center">
              {isTimerRunning && (
                <span className="absolute -top-3.5 -left-2 text-[10px] animate-bounce opacity-80 select-none">
                  💨
                </span>
              )}
              <div className="text-base select-none filter drop-shadow-md transform -scale-x-100">
                🚂
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ===================================================================== */}
      {/* 1. DEDICATED MOBILE DOCK (< md)                                       */}
      {/* ===================================================================== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pointer-events-none md:hidden select-none">
        <div className="relative pointer-events-auto bg-[#18181b]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3 flex flex-col gap-2 max-w-md mx-auto">
          {renderUrlPopover(true)}

          {/* TIER 1: TRANSPORT CONTROLS & VISIBLE TOUCH-FRIENDLY VOLUME */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            {/* Prev / Play-Pause / Next */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onPrevTrack}
                className="text-white/70 active:text-white p-1 transition cursor-pointer"
                title="Bài trước đó"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>
              <button
                type="button"
                onClick={onTogglePlay}
                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-md active:scale-95 transition-transform cursor-pointer shrink-0"
                title={isPlaying ? 'Tạm dừng' : 'Phát nhạc'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>
              <button
                type="button"
                onClick={onNextTrack}
                className="text-white/70 active:text-white p-1 transition cursor-pointer"
                title="Bài tiếp theo"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
            </div>

            {/* Explicit, touch-friendly volume slider container */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/5 rounded-xl border border-white/10 shrink-0">
              <button
                type="button"
                onClick={onToggleMute}
                className="text-white/70 hover:text-white shrink-0 cursor-pointer p-0.5 transition"
                title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : volume < 50 ? (
                  <Volume1 className="w-4 h-4 text-white/80" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white/80" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="w-20 xs:w-24 sm:w-28 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white touch-none"
              />
              <span className="text-[10px] font-mono text-white/60 w-7 text-right select-none">
                {isMuted ? 0 : volume}%
              </span>
            </div>
          </div>

          {/* TIER 2: MUSIC PROGRESS SCRUBBER */}
          <div className="flex items-center gap-2 w-full px-1">
            <span className="text-[10px] font-mono text-white/50 min-w-[28px] text-right">
              {formatTime(displayTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={displayTime}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
            />
            <span className="text-[10px] font-mono text-white/50 min-w-[28px]">
              {formatTime(duration)}
            </span>
          </div>

          {/* TIER 3: TRACK INFO, DÁN LINK & LÊN TÀU BẮT ĐẦU */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <img
                src={thumbnailUrl || 'https://i.ytimg.com/vi/default/hqdefault.jpg'}
                alt={title}
                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-white/10"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://i.ytimg.com/vi/default/hqdefault.jpg';
                }}
              />
              <p className="text-xs font-medium text-white truncate max-w-[120px]" title={title}>
                {title || 'Chưa phát'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsUrlPopoverOpen((prev) => !prev)}
                className="px-2.5 py-1 rounded-full border border-white/15 bg-white/5 text-[11px] font-medium text-white/80 active:bg-white/20 transition cursor-pointer"
              >
                DÁN LINK
              </button>

              {hasJourneyStarted ? (
                <div className="bg-white/10 text-white/70 text-[11px] px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>ĐANG CHẠY</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onStartJourneyClick}
                  className="bg-white text-black font-semibold text-[11px] px-3 py-1 rounded-full shadow cursor-pointer active:scale-95 transition"
                >
                  LÊN TÀU
                </button>
              )}
            </div>
          </div>

          {/* TIER 4: ANIMATED RAILWAY PROGRESS TRACK */}
          {renderRailwayTrack()}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. DESKTOP CONTINUOUS DOCK (hidden on mobile, block on md:)           */}
      {/* ===================================================================== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 hidden md:block select-none pointer-events-none pb-4 px-6">
        <div className="max-w-5xl mx-auto pointer-events-auto bg-[#18181b]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-2.5 flex flex-col gap-1.5">
          {/* Main Controls Row */}
          <div className="flex items-center justify-between gap-4">
            {/* 1. LEFT WING: Track Artwork, Title, Author & Dán link */}
            <div className="flex items-center gap-3 shrink-0 w-[30%] lg:w-[28%] min-w-0">
              <img
                src={thumbnailUrl || 'https://i.ytimg.com/vi/default/hqdefault.jpg'}
                alt={title}
                className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/10 shadow-sm"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://i.ytimg.com/vi/default/hqdefault.jpg';
                }}
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-semibold text-white truncate" title={title}>
                  {title || 'Chưa phát bài hát'}
                </h4>
                <p className="text-[11px] text-zinc-400 truncate">{artist || 'YouTube Music'}</p>
              </div>

              {/* Clean URL Input Button [DÁN LINK] */}
              <div className="relative shrink-0" ref={popoverRef}>
                <button
                  type="button"
                  onClick={() => setIsUrlPopoverOpen((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-full border text-[11px] font-sans font-medium transition flex items-center whitespace-nowrap cursor-pointer ${
                    isUrlPopoverOpen
                      ? 'bg-white text-black border-white shadow-sm'
                      : 'border-white/15 hover:border-white/35 text-zinc-300 hover:text-white bg-white/[0.04]'
                  }`}
                  title="Dán link bài hát hoặc playlist YouTube"
                >
                  <span>DÁN LINK</span>
                </button>

                {renderUrlPopover(false)}
              </div>
            </div>

            {/* 2. CENTER WING: Transport Controls + Volume Positioned Right Next to Them! */}
            <div className="flex flex-col items-center justify-center flex-1 max-w-md lg:max-w-lg px-2">
              <div className="flex items-center gap-3 mb-1">
                <button
                  type="button"
                  onClick={onPrevTrack}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95 cursor-pointer"
                  title="Bài trước đó"
                >
                  <SkipBack className="w-4 h-4 fill-current" />
                </button>

                <button
                  type="button"
                  onClick={onTogglePlay}
                  className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition shadow-md active:scale-95 shrink-0 cursor-pointer"
                  title={isPlaying ? 'Tạm dừng' : 'Phát nhạc'}
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-black text-black" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-black text-black translate-x-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={onNextTrack}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95 cursor-pointer"
                  title="Bài tiếp theo"
                >
                  <SkipForward className="w-4 h-4 fill-current" />
                </button>

                {/* VOLUME BUTTON & SLIDER DIRECTLY NEXT TO PLAYBACK BUTTONS */}
                <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-white/10">
                  <button
                    type="button"
                    onClick={onToggleMute}
                    className="p-1 rounded-full text-zinc-400 hover:text-white transition cursor-pointer"
                    title={isMuted ? 'Bật âm thanh (M)' : 'Tắt tiếng (M)'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-3.5 h-3.5 text-red-400" />
                    ) : volume < 50 ? (
                      <Volume1 className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => onVolumeChange(Number(e.target.value))}
                    className="w-16 lg:w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
                  />
                  <span className="text-[10px] font-mono text-zinc-400 min-w-[24px]">
                    {isMuted ? 0 : volume}%
                  </span>
                </div>
              </div>

              {/* Continuous Hairline Time Scrubber */}
              <div className="w-full flex items-center justify-center">
                <span className="text-[10px] font-mono text-zinc-400 min-w-[32px] text-right">
                  {formatTime(displayTime)}
                </span>

                <div
                  ref={progressBarRef}
                  onPointerDown={handleScrubberPointerDown}
                  className="h-3 flex items-center flex-1 mx-2.5 cursor-pointer group relative touch-none"
                >
                  <div className="w-full h-1 bg-white/15 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-white transition-all duration-75"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <span className="text-[10px] font-mono text-zinc-400 min-w-[32px]">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* 3. RIGHT WING: Ambient sound toggle & Journey Action Pill */}
            <div className="flex items-center justify-end gap-3.5 shrink-0 w-[30%] lg:w-[28%]">
              {onToggleAmbient && (
                <button
                  type="button"
                  onClick={onToggleAmbient}
                  className={`p-1.5 rounded-full transition flex items-center justify-center cursor-pointer ${
                    hasActiveAmbient
                      ? 'text-white bg-white/15 ring-1 ring-white/30'
                      : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Âm thanh thiên nhiên & tiếng ồn trắng"
                >
                  <Headphones className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Journey Action Pill */}
              {hasJourneyStarted ? (
                <div
                  className="bg-white/10 text-zinc-400 border border-white/10 text-xs px-4 py-1.5 rounded-full cursor-default shrink-0 whitespace-nowrap select-none flex items-center gap-2"
                  title="Hành trình tàu đang hoạt động"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>● ĐANG CHẠY ({departureStation.code} ➔ {arrivalStation.code})</span>
                  {onAbortJourney && (
                    <button
                      type="button"
                      onClick={onAbortJourney}
                      className="text-xs text-red-400 hover:text-red-300 ml-1 underline cursor-pointer"
                    >
                      Hủy
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onStartJourneyClick}
                  className="bg-white text-black font-semibold text-xs px-5 py-2 rounded-full hover:bg-zinc-200 transition-all shrink-0 whitespace-nowrap shadow-sm cursor-pointer"
                >
                  LÊN TÀU BẮT ĐẦU
                </button>
              )}
            </div>
          </div>

          {/* ANIMATED RAILWAY PROGRESS TRACK (Below Player Controls) */}
          {renderRailwayTrack()}
        </div>
      </div>
    </>
  );
};

export default BottomPlayerBar;
