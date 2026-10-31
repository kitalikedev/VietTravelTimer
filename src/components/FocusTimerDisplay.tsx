import React from 'react';
import { FocusMode } from '../hooks/useFocusTimer';
import { TrainJourney } from './TrainJourney';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { BackdropMode } from './WallpaperManager';

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
  backgroundMode = 'CENTER_ARTWORK',
  onToggleBackgroundMode,
}) => {
  // SVG Ring calculations
  const size = 320;
  const strokeWidth = 3;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  // Progress stroke dashoffset
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center select-none text-white max-w-md mx-auto w-full relative z-30 pointer-events-auto">
      {/* 1. Vietnam Train Journey & Cockpit HUD (Mounted directly above circular ring) */}
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

      {/* 2. Mode Selector Tabs: clean text underline tabs (when not in transit) */}
      {!hasJourneyStarted && (
        <div className="flex items-center gap-8 mb-6 text-sm font-medium tracking-wide">
          <button
            type="button"
            onClick={() => setMode('focus')}
            className={`transition-colors pb-1.5 ${
              mode === 'focus'
                ? 'text-white border-b-2 border-white font-semibold'
                : 'text-white/40 hover:text-white/80 border-b-2 border-transparent'
            }`}
          >
            Focus
          </button>

          <button
            type="button"
            onClick={() => setMode('shortBreak')}
            className={`transition-colors pb-1.5 ${
              mode === 'shortBreak'
                ? 'text-white border-b-2 border-white font-semibold'
                : 'text-white/40 hover:text-white/80 border-b-2 border-transparent'
            }`}
          >
            Short Break
          </button>

          <button
            type="button"
            onClick={() => setMode('longBreak')}
            className={`transition-colors pb-1.5 ${
              mode === 'longBreak'
                ? 'text-white border-b-2 border-white font-semibold'
                : 'text-white/40 hover:text-white/80 border-b-2 border-transparent'
            }`}
          >
            Long Break
          </button>
        </div>
      )}

      {/* 3. Circular Hairline SVG Progress Ring & Minimal Timer Display */}
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Base Background Track Ring (hairline white 10%) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Active Progress Ring (crisp pure white 100% hairline stroke) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#ffffff"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-linear"
          />
        </svg>

        {/* Center Countdown Display & Transport Controls */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {/* Active Mode Label */}
          <span className="text-xs uppercase font-mono tracking-widest text-zinc-400 mb-1">
            {mode === 'focus' ? 'Tập trung' : mode === 'shortBreak' ? 'Nghỉ ngắn' : 'Nghỉ dài'}
          </span>

          {/* Time Display (Large Apple-style typography) */}
          <div className="text-6xl font-light font-mono tracking-tight text-white my-1 tabular-nums">
            {formattedTime}
          </div>

          {/* Controls Cluster: Minimal Play/Pause & Reset */}
          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              onClick={onToggleTimer}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isRunning
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-white text-black hover:bg-neutral-200'
              }`}
              title={isRunning ? 'Tạm dừng (Space)' : 'Bắt đầu (Space)'}
            >
              {isRunning ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onResetTimer}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition"
              title="Đặt lại đồng hồ"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusTimerDisplay;
