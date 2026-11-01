import React, { useState, useRef } from 'react';
import { Train, Ticket } from 'lucide-react';
import { VIETNAM_STATIONS } from '../data/trainStations';
import { FocusMode } from '../hooks/useFocusTimer';
import { BackdropMode } from './WallpaperManager';

interface TrainJourneyProps {
  departureId: string;
  arrivalId: string;
  onChangeRoute?: (departureId: string, arrivalId: string) => void;
  remainingSeconds: number;
  totalDuration: number;
  isRunning: boolean;
  mode?: FocusMode;
  onOpenBookingFlow?: () => void;
  isTrainMode?: boolean;
  onToggleTrainMode?: () => void;
  hasJourneyStarted?: boolean;
  onAbortJourney?: () => void;
  berthInfo?: { coach: string; compartment: string; berth: string } | null;
  backgroundMode?: BackdropMode;
  onToggleBackgroundMode?: () => void;
}

// 1.5-second Hold-To-Abort Button with animated progress ring & fill
const HoldToAbortButton: React.FC<{ onAbort: () => void }> = ({ onAbort }) => {
  const [holdingProgress, setHoldingProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const HOLD_DURATION = 1500; // 1.5 seconds

  const startHold = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsHolding(true);
    startTimeRef.current = Date.now();

    if (timerRef.current) cancelAnimationFrame(timerRef.current);

    const update = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(100, (elapsed / HOLD_DURATION) * 100);
      setHoldingProgress(progress);

      if (progress >= 100) {
        setIsHolding(false);
        setHoldingProgress(0);
        onAbort();
      } else {
        timerRef.current = requestAnimationFrame(update);
      }
    };

    timerRef.current = requestAnimationFrame(update);
  };

  const cancelHold = (e?: React.PointerEvent) => {
    if (e) e.stopPropagation();
    setIsHolding(false);
    setHoldingProgress(0);
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
  };

  const circumference = 2 * Math.PI * 7;
  const strokeDashoffset = circumference - (holdingProgress / 100) * circumference;

  return (
    <button
      type="button"
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      className="relative group flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 hover:border-red-500/40 text-zinc-400 hover:text-red-400 text-xs font-mono tracking-wider transition-all bg-black/60 backdrop-blur-md select-none overflow-hidden"
      title="Nhấn và giữ 1.5 giây để hủy chuyến"
    >
      {/* Background progress fill */}
      <div
        className="absolute inset-0 bg-red-950/50 transition-all duration-75 pointer-events-none"
        style={{ width: `${holdingProgress}%` }}
      />

      {/* Circular Progress Ring */}
      <svg className="w-3.5 h-3.5 transform -rotate-90 relative z-10 shrink-0" viewBox="0 0 20 20">
        <circle
          cx="10"
          cy="10"
          r="7"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="2"
        />
        <circle
          cx="10"
          cy="10"
          r="7"
          fill="none"
          stroke={holdingProgress > 0 ? '#ef4444' : 'rgba(255,255,255,0.4)'}
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-75"
        />
      </svg>

      <span className="relative z-10 font-medium whitespace-nowrap">
        {isHolding ? 'ĐANG HỦY...' : '[ GIỮ ĐỂ HỦY CHUYẾN // ABORT ]'}
      </span>
    </button>
  );
};

export const TrainJourney: React.FC<TrainJourneyProps> = ({
  departureId,
  arrivalId,
  remainingSeconds,
  totalDuration,
  onOpenBookingFlow,
  hasJourneyStarted = false,
  onAbortJourney,
  berthInfo,
  backgroundMode = 'pov_train',
  onToggleBackgroundMode,
}) => {
  const depStation = VIETNAM_STATIONS.find((s) => s.id === departureId) || VIETNAM_STATIONS[0];
  const arrStation = VIETNAM_STATIONS.find((s) => s.id === arrivalId) || VIETNAM_STATIONS[4]; // Default: Đà Nẵng

  // Train Progress directly linked to active timer session
  const progress =
    totalDuration > 0
      ? Math.min(100, Math.max(0, ((totalDuration - remainingSeconds) / totalDuration) * 100))
      : 0;

  // Real-time remaining distance calculation (linearly decreasing with time)
  const totalDistance = Math.abs(arrStation.km - depStation.km);
  const remainingKm = Math.max(0, Math.round(totalDistance * (1 - progress / 100)));

  // Clamped for smooth notch/indicator positioning
  const clampedProgress = Math.min(97, Math.max(3, progress));

  // Format coach and berth label e.g. "TOA 03 - G.15"
  const formatBerthLabel = () => {
    if (!berthInfo) return 'TOA 03 - G.15';
    const coachMatch = berthInfo.coach ? berthInfo.coach.match(/(\d+)/) : null;
    const coachStr = coachMatch ? `TOA ${coachMatch[1].padStart(2, '0')}` : 'TOA 03';
    const berthMatch = berthInfo.berth ? berthInfo.berth.match(/(\d+)/) : null;
    const berthStr = berthMatch ? `G.${berthMatch[1].padStart(2, '0')}` : 'G.15';
    return `${coachStr} - ${berthStr}`;
  };

  // 1. ACTIVE JOURNEY COCKPIT OVERLAY (Positioned directly above the central countdown timer)
  if (hasJourneyStarted) {
    return (
      <div className="flex flex-col items-center justify-center text-center mb-5 w-full max-w-sm mx-auto select-none relative z-30">
        {/* Top Row: Route status badge: HAN ➔ DAN • TOA 03 - G.15 in crisp white monospace */}
        <div className="text-xs font-mono tracking-widest text-white/90 bg-black/60 border border-white/10 px-4 py-1.5 rounded-full inline-flex items-center gap-2 shadow-lg backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            {depStation.code} ➔ {arrStation.code} • {formatBerthLabel()}
          </span>
        </div>

        {/* Middle Line: Hairline progress bar showing train marker moving according to percentage */}
        <div className="relative w-full max-w-xs h-6 flex items-center justify-center my-2">
          {/* Hairline track line */}
          <div className="w-full h-[2px] rounded-full bg-white/15 relative overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Left departure station node */}
          <div className="absolute left-0 w-2 h-2 rounded-full bg-white ring-2 ring-black" />

          {/* Minimal Train Indicator (Traveling smoothly from 0% to 100%) */}
          <div
            className="absolute -translate-x-1/2 flex items-center justify-center transition-all duration-300 ease-linear pointer-events-none"
            style={{ left: `${clampedProgress}%` }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white shadow-lg ring-2 ring-black flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-black" />
            </div>
          </div>

          {/* Right arrival station node */}
          <div
            className={`absolute right-0 w-2 h-2 rounded-full ring-2 ring-black transition-colors ${
              progress >= 100 ? 'bg-white' : 'bg-white/30'
            }`}
          />
        </div>

        {/* Bottom Metric: Remaining distance: CÒN LẠI: [N] KM linearly decreasing with time */}
        <div className="text-xs font-mono tracking-widest text-zinc-400">
          CÒN LẠI: <span className="text-white font-bold">{remainingKm} KM</span>
        </div>

        {/* Subtle pill toggle on Cockpit HUD between POV TÀU and ALBUM ARTWORK */}
        {onToggleBackgroundMode && (
          <button
            type="button"
            onClick={onToggleBackgroundMode}
            className="mt-2 text-[10px] font-mono tracking-wider px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 text-zinc-300 hover:text-white transition flex items-center gap-2 backdrop-blur-md"
            title="Chuyển chế độ hình nền / video buồng lái"
          >
            {backgroundMode === 'POV_VIDEO' ? (
              <>
                <span className="text-emerald-400 font-semibold">POV TÀU</span>
                <span className="text-zinc-600">//</span>
                <span className="text-zinc-400 hover:text-zinc-200">ARTWORK</span>
              </>
            ) : (
              <>
                <span className="text-zinc-400 hover:text-zinc-200">POV TÀU</span>
                <span className="text-zinc-600">//</span>
                <span className="text-emerald-400 font-semibold">ARTWORK</span>
              </>
            )}
          </button>
        )}

        {/* Integrated Hold-to-Abort trigger */}
        {onAbortJourney && (
          <div className="mt-2.5">
            <HoldToAbortButton onAbort={onAbortJourney} />
          </div>
        )}
      </div>
    );
  }

  // 2. IDLE STATE: Clean Route Preview Pill
  return (
    <div className="w-full max-w-md mx-auto mb-3 sm:mb-4 select-none font-sans">
      <div className="flex items-center justify-center sm:justify-between text-xs px-1 gap-2">
        <button
          type="button"
          onClick={onOpenBookingFlow}
          className="flex items-center gap-1.5 font-medium text-white/90 hover:text-white transition group py-1.5 px-3 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 shadow-sm cursor-pointer max-w-full"
          title="Mở hành trình và đặt vé tàu"
        >
          <Train className="w-3.5 h-3.5 text-white/60 group-hover:text-white transition-colors shrink-0" />
          <span className="font-semibold tracking-tight text-xs truncate">{depStation.name}</span>
          <span className="text-white/40 mx-0.5 shrink-0">➔</span>
          <span className="font-semibold tracking-tight text-xs truncate">{arrStation.name}</span>
          <span className="text-white/50 text-[11px] shrink-0 font-mono">• {totalDistance} km</span>
          <Ticket className="w-3 h-3 text-white/40 group-hover:text-white ml-0.5 transition shrink-0" />
        </button>

        <span className="hidden sm:inline-block text-[11px] font-sans font-medium px-2.5 py-0.5 rounded-full bg-[#121214] text-white/50 border border-white/[0.08] whitespace-nowrap">
          Chờ khởi hành
        </span>
      </div>
    </div>
  );
};

export default TrainJourney;
