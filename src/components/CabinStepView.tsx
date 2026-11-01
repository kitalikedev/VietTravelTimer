import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import {
  CARRIAGE_BERTHS,
  UNIVERSAL_FOCUS_INTENTS,
} from '../data/trainStations';

interface CabinStepViewProps {
  selectedBerthId: string;
  onSelectBerth: (id: string) => void;
  selectedIntent: string;
  onSelectIntent: (intent: string) => void;
  coachNumber: string;
  onBack: () => void;
  onConfirm: () => void;
}

export const CabinStepView: React.FC<CabinStepViewProps> = ({
  selectedBerthId,
  onSelectBerth,
  selectedIntent,
  onSelectIntent,
  coachNumber,
  onBack,
  onConfirm,
}) => {
  const selectedBerth =
    CARRIAGE_BERTHS.find((b) => b.id === selectedBerthId) || CARRIAGE_BERTHS[6];

  // Group 28 berths into 7 compartments (4 berths per compartment)
  const compartments = Array.from({ length: 7 }, (_, idx) => {
    const compNum = idx + 1;
    const berths = CARRIAGE_BERTHS.filter((b) => b.compartment === compNum);
    return { compNum, berths };
  });

  return (
    <div className="relative flex-1 w-full h-full overflow-y-auto no-scrollbar bg-[#000000] text-white flex flex-col justify-between p-6 sm:p-8 select-none">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-between">
        {/* Step Header */}
        <div className="border-b border-white/[0.12] pb-5 mb-8 flex items-end justify-between">
          <div>
            <div className="text-xs font-sans text-zinc-400 font-medium">
              Toa {coachNumber} · Toa giường nằm khoang 4
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans mt-1">
              Chọn chỗ nằm & mục tiêu tập trung
            </h1>
          </div>

          <div className="hidden sm:block">
            <div className="bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-xs font-sans text-white flex items-center gap-2">
              <span className="text-zinc-400">Chỗ đã chọn:</span>
              <span className="font-semibold text-white">
                Khoang {selectedBerth.compartment} · Giường {selectedBerth.id} (
                {selectedBerth.level === 'lower' ? 'Tầng 1' : 'Tầng 2'})
              </span>
            </div>
          </div>
        </div>

        {/* 1. Universal Focus Objectives (Top Section) */}
        <div className="mb-8">
          <div className="text-xs font-sans text-zinc-400 font-medium mb-3">
            01 · Mục tiêu phiên tập trung
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {UNIVERSAL_FOCUS_INTENTS.map((intent) => {
              const isSelected = selectedIntent === intent;
              return (
                <button
                  key={intent}
                  type="button"
                  onClick={() => onSelectIntent(intent)}
                  className={`font-sans text-xs transition-colors px-4 py-2 rounded-full border ${
                    isSelected
                      ? 'bg-white text-black font-semibold border-white shadow-sm'
                      : 'bg-white/5 text-zinc-400 hover:text-white border-white/10 hover:border-white/20'
                  }`}
                >
                  {intent}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Top-Down Architectural Blueprint of Sleeper Coach */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-sans text-zinc-400 font-medium mb-3">
            <span>02 · Sơ đồ toa xe</span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-white rounded-sm ring-1 ring-white/50" />
                <span className="text-white font-medium">Đang chọn</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 border border-white/25 bg-white/[0.05] rounded-sm" />
                <span className="text-zinc-300">Còn trống</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-white/[0.02] opacity-30 rounded-sm" />
                <span className="text-zinc-500">Đã đặt</span>
              </span>
            </div>
          </div>

          {/* Coach Chassis Container - High-Contrast Container */}
          <div className="bg-[#121316] border border-white/20 rounded-2xl p-6 overflow-x-auto no-scrollbar">
            {/* Chassis Header */}
            <div className="flex items-center justify-between text-xs font-sans text-zinc-400 pb-3 border-b border-white/15 mb-5 font-medium">
              <span>Đầu toa (Vestibule A)</span>
              <span className="text-zinc-200">Đường sắt Việt Nam · Toa {coachNumber}</span>
              <span>Cuối toa (Vestibule B)</span>
            </div>

            {/* 7 Compartments Grid */}
            <div className="grid grid-cols-7 gap-3.5 min-w-[700px]">
              {compartments.map(({ compNum, berths }) => {
                const lowerBerths = berths.filter((b) => b.level === 'lower');
                const upperBerths = berths.filter((b) => b.level === 'upper');

                return (
                  <div
                    key={compNum}
                    className="p-3.5 rounded-xl bg-black/70 border border-white/15 flex flex-col justify-between"
                  >
                    <div className="text-[11px] font-sans text-center text-zinc-300 mb-3 font-semibold">
                      Khoang {compNum}
                    </div>

                    {/* TẦNG 2 (Upper) */}
                    <div className="space-y-1 mb-3">
                      <div className="text-[10px] font-sans text-zinc-400 text-center font-medium">
                        Tầng 2
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {upperBerths.map((b) => {
                          const isSelected = b.id === selectedBerthId;
                          return (
                            <button
                              key={b.id}
                              type="button"
                              disabled={b.isOccupied}
                              onClick={() => onSelectBerth(b.id)}
                              className={`aspect-[2/1] rounded-lg flex items-center justify-center font-mono text-sm transition-all border ${
                                b.isOccupied
                                  ? 'opacity-20 border-transparent bg-white/[0.02] cursor-not-allowed text-zinc-600'
                                  : isSelected
                                  ? 'bg-white text-black font-extrabold border-2 border-white'
                                  : 'border-white/25 bg-white/[0.05] hover:border-white/60 hover:bg-white/[0.1] text-zinc-100 font-bold'
                              }`}
                            >
                              {b.id}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* TẦNG 1 (Lower) */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-sans text-zinc-400 text-center font-medium">
                        Tầng 1
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {lowerBerths.map((b) => {
                          const isSelected = b.id === selectedBerthId;
                          return (
                            <button
                              key={b.id}
                              type="button"
                              disabled={b.isOccupied}
                              onClick={() => onSelectBerth(b.id)}
                              className={`aspect-[2/1] rounded-lg flex items-center justify-center font-mono text-sm transition-all border ${
                                b.isOccupied
                                  ? 'opacity-20 border-transparent bg-white/[0.02] cursor-not-allowed text-zinc-600'
                                  : isSelected
                                  ? 'bg-white text-black font-extrabold border-2 border-white'
                                  : 'border-white/25 bg-white/[0.05] hover:border-white/60 hover:bg-white/[0.1] text-zinc-100 font-bold'
                              }`}
                            >
                              {b.id}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Main Passenger Corridor */}
            <div className="mt-4 pt-3 border-t border-dashed border-white/15 text-xs font-sans text-zinc-400 text-center font-medium">
              Hành lang chính toa xe
            </div>
          </div>
        </div>

        {/* Bottom Navigation Actions */}
        <div className="flex items-center justify-between border-t border-white/[0.12] pt-6">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-white font-sans text-xs transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại lộ trình</span>
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-2 bg-white text-black font-semibold text-xs px-8 py-3.5 rounded-full hover:bg-zinc-200 transition-all shadow-lg"
          >
            <span>Xuất vé tàu</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CabinStepView;
