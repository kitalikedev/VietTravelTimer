import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Plus,
  Volume2,
  VolumeX,
  Volume1,
  Headphones,
  CheckSquare,
} from 'lucide-react';

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
  onStartJourneyClick: () => void;
  onAbortJourney?: () => void;
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
  taskCount = 0,
  completedTaskCount = 0,
  onToggleTasks,
  hasJourneyStarted,
  departureStation,
  arrivalStation,
  onStartJourneyClick,
}) => {
  // Quick URL Input Popover State
  const [isUrlPopoverOpen, setIsUrlPopoverOpen] = useState(false);
  const [pasteUrlInput, setPasteUrlInput] = useState('');
  const [isSubmittingUrl, setIsSubmittingUrl] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Scrubber drag / click state
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Volume slider popover / hover
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Format MM:SS helper
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Close URL popover when clicking outside or Esc
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsUrlPopoverOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isUrlPopoverOpen) {
        setIsUrlPopoverOpen(false);
      }
    };

    if (isUrlPopoverOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUrlPopoverOpen]);

  // Focus input when popover opens
  useEffect(() => {
    if (isUrlPopoverOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setPasteUrlInput('');
    }
  }, [isUrlPopoverOpen]);

  // Handle URL submit
  const handleUrlSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = pasteUrlInput.trim();
    if (!trimmed) return;

    setIsSubmittingUrl(true);
    try {
      const ok = await onLoadUrl(trimmed);
      if (ok) {
        setIsUrlPopoverOpen(false);
        setPasteUrlInput('');
      }
    } finally {
      setIsSubmittingUrl(false);
    }
  };

  // Scrubber pointer drag & click calculation
  const handleScrubberPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    setIsScrubbing(true);

    const calcTime = (clientX: number) => {
      if (!progressBarRef.current) return 0;
      const rect = progressBarRef.current.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return pos * duration;
    };

    const newTime = calcTime(e.clientX);
    setScrubTime(newTime);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      setScrubTime(calcTime(moveEvent.clientX));
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      const finalTime = calcTime(upEvent.clientX);
      onSeek(finalTime);
      setIsScrubbing(false);
      setScrubTime(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const displayTime = isScrubbing && scrubTime !== null ? scrubTime : currentTime;
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (displayTime / duration) * 100)) : 0;

  return (
    <footer className="fixed bottom-0 inset-x-0 h-16 bg-[#0c0d10]/95 border-t border-white/10 z-40 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between text-white select-none">
      {/* ===================================================================== */}
      {/* 1. LEFT WING (Square Artwork, Song Meta & URL Input)                  */}
      {/* ===================================================================== */}
      <div className="flex items-center gap-3 min-w-0 w-[30%] lg:w-[28%]">
        {/* Square Album Artwork */}
        <div className="w-11 h-11 rounded-lg border border-white/10 overflow-hidden bg-neutral-900 shadow-md shrink-0">
          <img
            src={thumbnailUrl || 'https://i.ytimg.com/vi/default/hqdefault.jpg'}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'https://i.ytimg.com/vi/default/hqdefault.jpg';
            }}
          />
        </div>

        {/* Song Meta */}
        <div className="min-w-0 pr-1 hidden sm:block">
          <p
            className="font-sans font-bold text-xs text-white truncate max-w-[220px]"
            title={title || 'Chưa phát bài hát'}
          >
            {title || 'Chưa phát bài hát'}
          </p>
          <p className="text-[11px] font-mono text-zinc-400 truncate max-w-[220px]">
            {artist || 'YouTube Music'}
          </p>
        </div>

        {/* Clean URL Input Button [+ DÁN LINK] */}
        <div className="relative shrink-0" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setIsUrlPopoverOpen((prev) => !prev)}
            className={`px-3 py-1.5 rounded-full border text-[11px] font-sans font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
              isUrlPopoverOpen
                ? 'bg-white text-black border-white shadow-sm'
                : 'border-white/15 hover:border-white/35 text-zinc-300 hover:text-white bg-white/[0.04]'
            }`}
            title="Dán link bài hát hoặc playlist YouTube"
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
            <span>+ DÁN LINK</span>
          </button>

          {/* Quick Paste Popover Card */}
          {isUrlPopoverOpen && (
            <div className="absolute bottom-11 left-0 w-80 p-3 rounded-2xl bg-[#121316] border border-white/15 shadow-2xl z-50 animate-fade-in flex flex-col gap-2.5 backdrop-blur-xl">
              <div className="flex items-center justify-between text-xs font-sans text-zinc-300 font-semibold px-0.5">
                <span>Dán URL YouTube / Playlist</span>
                <button
                  type="button"
                  onClick={() => setIsUrlPopoverOpen(false)}
                  className="text-zinc-500 hover:text-white text-[11px] font-normal"
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
                    className="px-2.5 py-1 text-[11px] font-sans text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition"
                  >
                    Dán từ Clipboard
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingUrl || !pasteUrlInput.trim()}
                    className="px-4 py-1.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSubmittingUrl ? 'Đang tải...' : 'Phát ngay'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. CENTER WING (Transport Controls & Continuous Scrubber)             */}
      {/* ===================================================================== */}
      <div className="flex flex-col items-center justify-center flex-1 max-w-md lg:max-w-lg px-2">
        {/* Transport Buttons */}
        <div className="flex items-center gap-3 mb-1">
          {/* Skip Back */}
          <button
            type="button"
            onClick={onPrevTrack}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95"
            title="Bài trước đó"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          {/* Play / Pause: Solid white circular button with black icon */}
          <button
            type="button"
            onClick={onTogglePlay}
            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition shadow-md active:scale-95 shrink-0"
            title={isPlaying ? 'Tạm dừng' : 'Phát nhạc'}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-black text-black" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-black text-black translate-x-0.5" />
            )}
          </button>

          {/* Skip Forward */}
          <button
            type="button"
            onClick={onNextTrack}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95"
            title="Bài tiếp theo"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
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

      {/* ===================================================================== */}
      {/* 3. RIGHT WING (Volume & Journey Action Pill - NO LYRICS BUTTON)       */}
      {/* ===================================================================== */}
      <div className="flex items-center justify-end gap-2.5 sm:gap-3.5 min-w-0 w-[30%] lg:w-[28%]">
        {/* Optional Ambient Sound Toggle */}
        {onToggleAmbient && (
          <button
            type="button"
            onClick={onToggleAmbient}
            className={`p-1.5 rounded-full transition hidden md:flex items-center justify-center ${
              hasActiveAmbient
                ? 'text-white bg-white/15 ring-1 ring-white/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
            title="Âm thanh thiên nhiên & tiếng ồn trắng"
          >
            <Headphones className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Optional Task Drawer Toggle */}
        {onToggleTasks && (
          <button
            type="button"
            onClick={onToggleTasks}
            className="relative p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition hidden lg:flex items-center justify-center"
            title="Danh sách mục tiêu (Tasks)"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            {taskCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full text-[9px] font-mono bg-white text-black font-bold flex items-center justify-center px-0.5">
                {taskCount - completedTaskCount > 0 ? taskCount - completedTaskCount : '✓'}
              </span>
            )}
          </button>
        )}

        {/* Volume Slider with Mute Toggle Icon */}
        <div
          className="relative flex items-center"
          onMouseEnter={() => setShowVolumeSlider(true)}
          onMouseLeave={() => setShowVolumeSlider(false)}
        >
          <button
            type="button"
            onClick={onToggleMute}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
            title={isMuted ? 'Bật âm thanh (M)' : 'Tắt tiếng (M)'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : volume < 50 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          {/* Volume Slider Track */}
          {showVolumeSlider && (
            <div className="absolute bottom-9 right-0 p-2 rounded-xl bg-[#14151a] border border-white/15 shadow-xl flex items-center gap-2 animate-fade-in z-50">
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
              />
              <span className="text-[10px] font-mono text-zinc-400 min-w-[24px]">
                {isMuted ? 0 : volume}%
              </span>
            </div>
          )}
        </div>

        {/* Journey Action Pill (NO LYRICS BUTTON) */}
        {hasJourneyStarted ? (
          <div
            className="bg-white/10 text-zinc-400 border border-white/10 text-xs px-5 py-2 rounded-full cursor-default shrink-0 whitespace-nowrap select-none flex items-center gap-2"
            title="Hành trình tàu đang hoạt động"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>● ĐANG CHẠY ({departureStation.code} ➔ {arrivalStation.code})</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onStartJourneyClick}
            className="bg-white text-black font-semibold text-xs px-5 py-2 rounded-full hover:bg-zinc-200 transition-all shrink-0 whitespace-nowrap shadow-sm"
            title="Bắt đầu hành trình tàu Thống Nhất SE3"
          >
            LÊN TÀU BẮT ĐẦU
          </button>
        )}
      </div>
    </footer>
  );
};

export default BottomPlayerBar;
