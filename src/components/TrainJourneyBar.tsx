import React from 'react';
import { Train, ChevronRight, MapPin } from 'lucide-react';
import { calculateJourneyInfo } from '../data/trainStations';

interface TrainJourneyBarProps {
  departureId: string;
  arrivalId: string;
  progressPercent: number;
  isRunning: boolean;
  onOpenModal: () => void;
}

export const TrainJourneyBar: React.FC<TrainJourneyBarProps> = ({
  departureId,
  arrivalId,
  progressPercent,
  isRunning,
  onOpenModal,
}) => {
  const info = calculateJourneyInfo(departureId, arrivalId, progressPercent);

  // Position of train along the track (clamped between 4% and 96% to not overflow buttons)
  const clampedProgress = Math.min(96, Math.max(4, progressPercent));

  return (
    <div
      onClick={onOpenModal}
      className="w-full max-w-md mx-auto mb-6 p-3 sm:p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 backdrop-blur-xl transition-all duration-200 cursor-pointer shadow-lg group select-none"
      title="Bấm để chọn ga đi & ga đến hành trình tàu"
    >
      {/* Top line: Stations & Train Code */}
      <div className="flex items-center justify-between text-xs mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-white flex-shrink-0">
            <Train className={`w-3 h-3 ${isRunning ? 'animate-pulse text-amber-300' : 'text-neutral-300'}`} />
          </div>
          <span className="font-semibold text-white tracking-tight truncate">
            {info.depStation.name}
          </span>
          <span className="text-neutral-500 font-mono text-[10px]">({info.depStation.code})</span>
          <span className="text-neutral-500">➔</span>
          <span className="font-semibold text-white tracking-tight truncate">
            {info.arrStation.name}
          </span>
          <span className="text-neutral-500 font-mono text-[10px]">({info.arrStation.code})</span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono flex-shrink-0 ml-2">
          <span>{info.trainCode.split(' ')[0]}</span>
          <ChevronRight className="w-3 h-3 text-neutral-500 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* Railway Track with Animated Train Marker */}
      <div className="relative w-full h-4 flex items-center my-1">
        {/* Track Line */}
        <div className="w-full h-[2px] rounded-full bg-white/15 overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Departure Station Node */}
        <div className="absolute left-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black" />

        {/* Moving Train Icon Node */}
        <div
          className="absolute -translate-x-1/2 flex items-center justify-center transition-all duration-300 ease-linear"
          style={{ left: `${clampedProgress}%` }}
        >
          <div className="w-5 h-5 rounded-full bg-white text-black shadow-md flex items-center justify-center ring-2 ring-white/30">
            <Train className="w-3 h-3 fill-black" />
          </div>
        </div>

        {/* Arrival Station Node */}
        <div className="absolute right-0 w-2 h-2 rounded-full bg-white/40 ring-2 ring-black" />
      </div>

      {/* Bottom Sub-info: Traveled km & Next Station */}
      <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono mt-2">
        <span className="text-neutral-300">
          Đã đi: <b className="text-white font-medium">{info.currentTraveledKm}</b> / {info.totalDistance} km ({Math.round(progressPercent)}%)
        </span>

        {info.nextStation && (
          <span className="flex items-center gap-1 text-[10px] text-neutral-400 truncate max-w-[180px]">
            <MapPin className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />
            <span className="truncate">Ga {info.nextStation.name}</span>
          </span>
        )}
      </div>
    </div>
  );
};
