import React from 'react';
import { Play } from 'lucide-react';
import { CarriageBerth, calculateJourneyInfo } from '../data/trainStations';

interface DepartGateViewProps {
  journeyInfo: ReturnType<typeof calculateJourneyInfo>;
  coachNumber: string;
  selectedBerth: CarriageBerth;
  selectedIntent: string;
  durationMinutes?: number;
  onStartJourney: () => void;
}

export const DepartGateView: React.FC<DepartGateViewProps> = ({
  journeyInfo,
  coachNumber,
  selectedBerth,
  selectedIntent,
  durationMinutes = 60,
  onStartJourney,
}) => {
  const cleanIntent = selectedIntent.split('//')[0].trim();

  return (
    <div className="relative flex-1 w-full h-full bg-[#000000] text-white flex flex-col justify-center items-center p-6 select-none">
      <div className="max-w-md w-full flex flex-col items-center text-center">
        {/* Departure Protocol Typography */}
        <div className="text-xs font-sans text-zinc-400 font-medium mb-8">
          Cửa toa đã đóng · Tàu sẵn sàng khởi hành
        </div>

        {/* Minimalist Departure Information */}
        <div className="border border-white/10 bg-[#0d0d0e] rounded-2xl p-5 w-full mb-10 text-left font-sans text-xs space-y-2.5">
          <div className="flex justify-between text-zinc-400">
            <span className="text-[11px] font-medium">Đoàn tàu:</span>
            <span className="text-white font-bold font-mono">{journeyInfo.trainCode}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span className="text-[11px] font-medium">Hành trình:</span>
            <span className="text-white font-semibold">
              {journeyInfo.depStation.name} → {journeyInfo.arrStation.name} ({journeyInfo.totalDistance} km)
            </span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span className="text-[11px] font-medium">Chỗ nằm:</span>
            <span className="text-white">
              Toa {coachNumber} · Khoang {selectedBerth.compartment} · Số {selectedBerth.id}
            </span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span className="text-[11px] font-medium">Mục tiêu:</span>
            <span className="text-white font-semibold">{cleanIntent}</span>
          </div>
          <div className="flex justify-between text-zinc-400 pt-2 border-t border-white/10">
            <span className="text-[11px] font-medium">Thời gian tập trung:</span>
            <span className="text-white font-bold font-mono text-sm">{durationMinutes} phút</span>
          </div>
        </div>

        {/* Central Departure Action Button */}
        <button
          type="button"
          onClick={onStartJourney}
          className="flex items-center gap-3 bg-white text-black px-10 py-4 rounded-full font-sans font-semibold text-xs hover:bg-zinc-200 transition-all hover:scale-[1.02] shadow-xl"
        >
          <Play className="w-3.5 h-3.5 fill-black stroke-[2.5]" />
          <span>Bắt đầu khởi hành</span>
        </button>

        <div className="text-xs font-sans text-zinc-500 mt-8 font-normal">
          Tự động bật âm thanh nền & đồng bộ đếm giờ
        </div>
      </div>
    </div>
  );
};
