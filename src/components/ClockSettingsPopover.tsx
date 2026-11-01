import React, { useRef, useEffect } from 'react';
import { Sliders, Circle, Square, Type, Maximize2, Minimize2, Eye, X } from 'lucide-react';
import { FocusMode } from '../hooks/useFocusTimer';
import { ClockPosition, ClockStyle } from './FocusTimerDisplay';

interface ClockSettingsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  clockStyle: ClockStyle;
  onChangeClockStyle: (style: ClockStyle) => void;
  clockPosition: ClockPosition;
  onChangeClockPosition: (pos: ClockPosition) => void;
  durations?: { focus: number; shortBreak: number; longBreak: number };
  onUpdateDuration?: (mode: FocusMode, minutes: number) => void;
  className?: string;
}

export const ClockSettingsPopover: React.FC<ClockSettingsPopoverProps> = ({
  isOpen,
  onClose,
  clockStyle,
  onChangeClockStyle,
  clockPosition,
  onChangeClockPosition,
  durations,
  onUpdateDuration,
  className = '',
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className={`z-[60] bg-[#121214]/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl text-white font-sans animate-fade-in select-none ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/10 mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-zinc-300" />
          <span className="text-xs font-semibold text-white tracking-wide">Cài đặt đồng hồ</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
          title="Đóng (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 1. Kiểu hiển thị */}
      <div className="space-y-1.5 mb-3.5">
        <div className="text-[11px] font-medium text-zinc-400">Kiểu hiển thị</div>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 text-xs text-center">
          <button
            type="button"
            onClick={() => onChangeClockStyle('minimal')}
            className={`py-1.5 px-2 rounded-lg transition cursor-pointer ${
              clockStyle === 'minimal' ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Type className="w-3.5 h-3.5 mx-auto mb-1" />
            <span className="text-[10px]">Cơ bản</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeClockStyle('ring')}
            className={`py-1.5 px-2 rounded-lg transition cursor-pointer ${
              clockStyle === 'ring' ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Circle className="w-3.5 h-3.5 mx-auto mb-1" />
            <span className="text-[10px]">Vòng tròn</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeClockStyle('flip')}
            className={`py-1.5 px-2 rounded-lg transition cursor-pointer ${
              clockStyle === 'flip' ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Square className="w-3.5 h-3.5 mx-auto mb-1" />
            <span className="text-[10px]">Lật số</span>
          </button>
        </div>
      </div>

      {/* 2. Vị trí & Chế độ */}
      <div className="space-y-1.5 mb-3.5">
        <div className="text-[11px] font-medium text-zinc-400">Vị trí hiển thị</div>
        <div className="grid grid-cols-3 gap-1.5 text-xs text-center">
          <button
            type="button"
            onClick={() => {
              onChangeClockPosition('center');
              onClose();
            }}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              clockPosition === 'center'
                ? 'bg-white text-black font-semibold border-white'
                : 'bg-black/30 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5 mx-auto mb-1" />
            <span className="text-[10px]">Giữa</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onChangeClockPosition('mini');
              onClose();
            }}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              clockPosition === 'mini'
                ? 'bg-white text-black font-semibold border-white'
                : 'bg-black/30 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <Minimize2 className="w-3.5 h-3.5 mx-auto mb-1" />
            <span className="text-[10px]">Thu nhỏ</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onChangeClockPosition('zen');
              onClose();
            }}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              clockPosition === 'zen'
                ? 'bg-white text-black font-semibold border-white'
                : 'bg-black/30 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5 mx-auto mb-1" />
            <span className="text-[10px]">Ẩn (Zen)</span>
          </button>
        </div>
      </div>

      {/* 3. Thời lượng (Phút) */}
      {onUpdateDuration && durations && (
        <div className="space-y-2 pt-2.5 border-t border-white/10">
          <div className="text-[11px] font-medium text-zinc-400">Thời lượng phiên (phút)</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-400 text-center">Tập trung</span>
              <input
                type="number"
                min="1"
                max="180"
                value={durations.focus}
                onChange={(e) => onUpdateDuration('focus', Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white text-center font-mono focus:outline-none focus:border-white/30"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-400 text-center">Nghỉ ngắn</span>
              <input
                type="number"
                min="1"
                max="60"
                value={durations.shortBreak}
                onChange={(e) => onUpdateDuration('shortBreak', Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white text-center font-mono focus:outline-none focus:border-white/30"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-400 text-center">Nghỉ dài</span>
              <input
                type="number"
                min="1"
                max="120"
                value={durations.longBreak}
                onChange={(e) => onUpdateDuration('longBreak', Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white text-center font-mono focus:outline-none focus:border-white/30"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClockSettingsPopover;
