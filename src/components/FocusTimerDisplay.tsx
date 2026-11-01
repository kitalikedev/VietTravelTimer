import React, { useState } from 'react';
import { FocusMode } from '../hooks/useFocusTimer';
import { TrainJourney } from './TrainJourney';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Sliders,
} from 'lucide-react';
import { BackdropMode } from '../data/backgrounds';
import { ClockSettingsPopover } from './ClockSettingsPopover';

export type ClockPosition = 'center' | 'mini' | 'zen';
export type ClockStyle = 'ring' | 'flip' | 'minimal';

interface FocusTimerDisplayProps {
  mode: FocusMode;
  setMode: (mode: FocusMode) => void;
  isRunning: boolean;
  formattedTime: string;
  progressPercent: number;
  remainingSeconds: number;
  totalDuration: number;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  durations?: { focus: number; shortBreak: number; longBreak: number };
  onUpdateDuration?: (mode: FocusMode, minutes: number) => void;

  // Train Journey props
  departureId: string;
  arrivalId: string;
  onChangeRoute: (departureId: string, arrivalId: string) => void;
  onOpenBookingFlow?: () => void;
  isTrainMode?: boolean;
  onToggleTrainMode?: () => void;
  hasJourneyStarted?: boolean;
  onAbortJourney?: () => void;
  berthInfo?: { coach: string; compartment: string; berth: string } | null;
  backgroundMode?: BackdropMode;
  onToggleBackgroundMode?: () => void;

  // Multi-state Clock Controls
  clockPosition: ClockPosition;
  onChangeClockPosition: (pos: ClockPosition) => void;
  clockStyle: ClockStyle;
  onChangeClockStyle: (style: ClockStyle) => void;
}

export const FocusTimerDisplay: React.FC<FocusTimerDisplayProps> = ({
  mode,
  setMode,
  isRunning,
  formattedTime,
  progressPercent,
  remainingSeconds,
  totalDuration,
  onToggleTimer,
  onResetTimer,
  departureId,
  arrivalId,
  onChangeRoute,
  onOpenBookingFlow,
  isTrainMode,
  onToggleTrainMode,
  hasJourneyStarted = false,
  onAbortJourney,
  berthInfo,
  backgroundMode = 'PIXEL_1',
  onToggleBackgroundMode,
  clockPosition,
  onChangeClockPosition,
  clockStyle,
  onChangeClockStyle,
  durations,
  onUpdateDuration,
}) => {
  const [showStyleSwitcher, setShowStyleSwitcher] = useState(false);

  // SVG Ring calculations
  const size = 320;
  const strokeWidth = 3;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Split formatted time into MM and SS
  const [minutesStr, secondsStr] = formattedTime.includes(':')
    ? formattedTime.split(':')
    : ['25', '00'];

  const modeLabel =
    mode === 'focus' ? 'Tập trung' : mode === 'shortBreak' ? 'Nghỉ ngắn' : 'Nghỉ dài';

  // =========================================================================
  // 1. MINI CORNER MODE (Flocus Ambient Style pinned to top right)
  // =========================================================================
  if ((clockPosition as string) === 'mini') {
    return (
      <div className="fixed top-3 sm:top-3.5 right-4 sm:right-6 md:right-36 z-40 bg-[#121214]/95 backdrop-blur-xl border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-2.5 shadow-2xl animate-fade-in select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
          {mode === 'focus' ? 'FOCUS' : 'BREAK'}
        </span>
        <span className="text-sm font-bold font-mono text-white tabular-nums tracking-tight">
          {formattedTime}
        </span>

        {/* Mini Play/Pause */}
        <button
          type="button"
          onClick={onToggleTimer}
          className={`w-6 h-6 rounded-full flex items-center justify-center transition cursor-pointer ${
            isRunning ? 'bg-white/20 text-white' : 'bg-white text-black hover:bg-neutral-200'
          }`}
          title={isRunning ? 'Tạm dừng' : 'Bắt đầu'}
        >
          {isRunning ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
        </button>

        {/* Expand back to Center */}
        <button
          type="button"
          onClick={() => onChangeClockPosition('center')}
          className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Phóng to đồng hồ giữa màn hình"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // =========================================================================
  // 2. PURE PIXEL ZEN MODE (Hide center clock UI, trigger moves to top nav bar)
  // =========================================================================
  if ((clockPosition as string) === 'zen') {
    return null;
  }

  // =========================================================================
  // 3. CENTER FOCUS MODE (Default prominent clock)
  // =========================================================================
  return (
    <div className="relative flex flex-col items-center justify-center select-none text-white max-w-md sm:max-w-lg mx-auto w-full z-30 pointer-events-auto">
      {/* Frosted Dark High-Contrast Capsule Card */}
      <div className="relative w-full flex flex-col items-center justify-center bg-[#121214]/90 backdrop-blur-xl border border-white/10 rounded-[32px] px-6 sm:px-8 py-6 sm:py-7 shadow-[0_20px_60px_rgba(0,0,0,0.85)] before:absolute before:inset-[-40px] before:bg-[radial-gradient(circle,rgba(0,0,0,0.65)_0%,transparent_70%)] before:-z-10 before:pointer-events-none">
        
        {/* Vietnam Train Journey & Cockpit HUD */}
        <TrainJourney
          departureId={departureId}
          arrivalId={arrivalId}
          onChangeRoute={onChangeRoute}
          remainingSeconds={remainingSeconds}
          totalDuration={totalDuration}
          isRunning={isRunning}
          mode={mode}
          onOpenBookingFlow={onOpenBookingFlow}
          isTrainMode={isTrainMode}
          onToggleTrainMode={onToggleTrainMode}
          hasJourneyStarted={hasJourneyStarted}
          onAbortJourney={onAbortJourney}
          berthInfo={berthInfo}
          backgroundMode={backgroundMode}
          onToggleBackgroundMode={onToggleBackgroundMode}
        />

        {/* Mode Selector Tabs in Dark Pill Container */}
        {!hasJourneyStarted && (
          <div className="flex items-center gap-1.5 mb-4 p-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs sm:text-sm font-medium">
            <button
              type="button"
              onClick={() => setMode('focus')}
              className={`px-3.5 py-1 rounded-full transition-all cursor-pointer ${
                mode === 'focus'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Focus
            </button>

            <button
              type="button"
              onClick={() => setMode('shortBreak')}
              className={`px-3.5 py-1 rounded-full transition-all cursor-pointer ${
                mode === 'shortBreak'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Short Break
            </button>

            <button
              type="button"
              onClick={() => setMode('longBreak')}
              className={`px-3.5 py-1 rounded-full transition-all cursor-pointer ${
                mode === 'longBreak'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Long Break
            </button>
          </div>
        )}

        {/* Clock Styles Container */}
        <div className="w-full flex flex-col items-center justify-center">
          {/* ========================================== */}
          {/* STYLE A: CIRCULAR RING (Pomodoro Track)    */}
          {/* ========================================== */}
          {clockStyle === 'ring' && (
            <div className="relative flex flex-col items-center justify-center">
              <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.95)"
                    strokeWidth={strokeWidth + 1}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-[stroke-dashoffset] duration-500 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs uppercase font-mono tracking-widest text-zinc-300 mb-1 drop-shadow">
                    {modeLabel}
                  </span>

                  <div className="text-6xl sm:text-7xl font-mono font-bold tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] tabular-nums">
                    {formattedTime}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="mt-5 flex items-center gap-3.5 relative z-10">
                <button
                  type="button"
                  onClick={onToggleTimer}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 ${
                    isRunning
                      ? 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                      : 'bg-white text-black hover:bg-neutral-100'
                  }`}
                  title={isRunning ? 'Tạm dừng' : 'Bắt đầu'}
                >
                  {isRunning ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={onResetTimer}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer active:scale-95 border border-white/10"
                  title="Đặt lại đồng hồ"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* STYLE B: RETRO FLIP CLOCK CARD             */}
          {/* ========================================== */}
          {clockStyle === 'flip' && (
            <div className="flex flex-col items-center justify-center py-4">
              <span className="text-xs uppercase font-mono tracking-widest text-zinc-300 mb-3 drop-shadow">
                {modeLabel}
              </span>

              <div className="flex items-center gap-3 font-mono">
                {/* Minute Flip Card */}
                <div className="relative bg-[#1e1e24] border border-white/15 rounded-2xl w-24 h-28 sm:w-28 sm:h-32 flex items-center justify-center shadow-2xl overflow-hidden">
                  <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/60 z-20" />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
                  <span className="text-5xl sm:text-6xl font-bold text-white tracking-tighter tabular-nums drop-shadow-md">
                    {minutesStr}
                  </span>
                </div>

                <div className="text-3xl sm:text-4xl font-bold text-white/50 animate-pulse">:</div>

                {/* Second Flip Card */}
                <div className="relative bg-[#1e1e24] border border-white/15 rounded-2xl w-24 h-28 sm:w-28 sm:h-32 flex items-center justify-center shadow-2xl overflow-hidden">
                  <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/60 z-20" />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
                  <span className="text-5xl sm:text-6xl font-bold text-white tracking-tighter tabular-nums drop-shadow-md">
                    {secondsStr}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="mt-5 flex items-center gap-3.5 relative z-10">
                <button
                  type="button"
                  onClick={onToggleTimer}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 ${
                    isRunning
                      ? 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                      : 'bg-white text-black hover:bg-neutral-100'
                  }`}
                  title={isRunning ? 'Tạm dừng' : 'Bắt đầu'}
                >
                  {isRunning ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={onResetTimer}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer active:scale-95 border border-white/10"
                  title="Đặt lại đồng hồ"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* STYLE C: MINIMALIST TYPOGRAPHY (Oversized) */}
          {/* ========================================== */}
          {clockStyle === 'minimal' && (
            <div className="flex flex-col items-center justify-center py-3">
              <span className="text-xs uppercase font-mono tracking-widest text-zinc-300 mb-1 drop-shadow">
                {modeLabel}
              </span>

              <div className="text-7xl sm:text-8xl md:text-9xl font-mono font-bold tracking-tighter text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] tabular-nums my-1">
                {formattedTime}
              </div>

              {/* Controls */}
              <div className="mt-4 flex items-center gap-3.5 relative z-10">
                <button
                  type="button"
                  onClick={onToggleTimer}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 ${
                    isRunning
                      ? 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                      : 'bg-white text-black hover:bg-neutral-100'
                  }`}
                  title={isRunning ? 'Tạm dừng' : 'Bắt đầu'}
                >
                  {isRunning ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={onResetTimer}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer active:scale-95 border border-white/10"
                  title="Đặt lại đồng hồ"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Center Settings Trigger Button */}
        <div className="mt-3 flex items-center justify-center relative z-20">
          <button
            type="button"
            onClick={() => setShowStyleSwitcher((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all text-xs cursor-pointer ${
              showStyleSwitcher
                ? 'bg-white text-black border-white font-medium shadow-sm'
                : 'bg-black/30 hover:bg-white/10 border-white/10 text-zinc-400 hover:text-white'
            }`}
            title="Cài đặt kiểu hiển thị, vị trí & thời gian phiên"
          >
            <Sliders className="w-3 h-3" />
            <span className="text-[11px] font-medium">Cài đặt</span>
          </button>
        </div>

        {/* CLOCK SETTINGS POPOVER ANCHORED TO THE RIGHT ON DESKTOP */}
        <ClockSettingsPopover
          isOpen={showStyleSwitcher}
          onClose={() => setShowStyleSwitcher(false)}
          clockStyle={clockStyle}
          onChangeClockStyle={onChangeClockStyle}
          clockPosition={clockPosition}
          onChangeClockPosition={onChangeClockPosition}
          durations={durations}
          onUpdateDuration={onUpdateDuration}
          className="fixed md:absolute top-20 md:top-0 left-4 right-4 md:left-full md:right-auto md:ml-4 md:w-80"
        />
      </div>
    </div>
  );
};

export default FocusTimerDisplay;
