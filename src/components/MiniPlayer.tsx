import React from 'react';
import { Play, Pause, SkipBack, SkipForward, ArrowUpRight, X } from 'lucide-react';

interface MiniPlayerProps {
  title: string;
  artist: string;
  videoId: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onExpand: () => void;
  onClose: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  title,
  artist,
  videoId,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onPrevious,
  onNext,
  onExpand,
  onClose,
}) => {
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl z-50 bg-[#18181B]/95 backdrop-blur-xl border border-[#27272A] rounded-2xl shadow-2xl shadow-black/80 px-4 py-2.5 flex items-center justify-between select-none transition-all duration-300 animate-fade-in"
    >
      {/* Hairline 2px Progress Bar at Top Edge */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-neutral-800/80 overflow-hidden rounded-t-2xl">
        <div
          className="h-full bg-white transition-all duration-150"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Left: Thumbnail & Track Details (Click to Expand) */}
      <div
        onClick={onExpand}
        className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial sm:w-72 cursor-pointer group"
        title="Click to view full lyrics"
      >
        <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-neutral-900 border border-[#27272A] flex-shrink-0">
          <img
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt={title}
            onError={(e) => {
              e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>
        <div className="min-w-0 pr-2">
          <h4 className="text-sm font-bold text-white truncate group-hover:text-neutral-200 transition-colors">
            {title || 'Playing track'}
          </h4>
          <p className="text-xs text-neutral-400 truncate mt-0.5">
            {artist || 'YouTube'}
          </p>
        </div>
      </div>

      {/* Center: Minimal Playback Controls */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={onPrevious}
          className="p-2 text-neutral-400 hover:text-white transition-colors duration-150"
          title="Previous Track"
        >
          <SkipBack className="w-4 h-4 fill-current" />
        </button>

        <button
          type="button"
          onClick={onTogglePlay}
          className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 hover:scale-105 active:scale-95 transition-all duration-150 shadow-md"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-black text-black" />
          ) : (
            <Play className="w-4 h-4 fill-black text-black translate-x-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={onNext}
          className="p-2 text-neutral-400 hover:text-white transition-colors duration-150"
          title="Next Track"
        >
          <SkipForward className="w-4 h-4 fill-current" />
        </button>
      </div>

      {/* Right: Expand Lyrics & Close */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExpand}
          className="px-3 py-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 border border-[#27272A] text-xs font-medium text-white flex items-center gap-1.5 transition-all duration-150 hover:scale-[1.02] shadow-sm"
          title="Expand to Full Lyrics View"
        >
          <span>Lyrics</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400" />
        </button>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors duration-150"
          title="Stop and Dismiss Mini Player"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
