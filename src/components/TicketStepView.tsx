import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { CarriageBerth, calculateJourneyInfo } from '../data/trainStations';

interface TicketStepViewProps {
  journeyInfo: ReturnType<typeof calculateJourneyInfo>;
  coachNumber: string;
  selectedBerth: CarriageBerth;
  selectedIntent: string;
  durationMinutes?: number;
  onBack: () => void;
  onConfirm: () => void;
}

export const TicketStepView: React.FC<TicketStepViewProps> = ({
  journeyInfo,
  coachNumber,
  selectedBerth,
  selectedIntent,
  durationMinutes = 60,
  onBack,
  onConfirm,
}) => {
  const [isTorn, setIsTorn] = useState<boolean>(false);

  const handleTearTicket = () => {
    if (isTorn) return;
    setIsTorn(true);
    setTimeout(() => {
      onConfirm();
    }, 520);
  };

  const levelText = selectedBerth.level === 'lower' ? 'TẦNG 1' : 'TẦNG 2';
  const cleanIntent = selectedIntent.split('//')[0].trim();

  return (
    <div className="relative flex-1 w-full h-full bg-[#000000] text-white flex flex-col justify-center items-center p-6 select-none overflow-y-auto no-scrollbar">
      <div className="max-w-3xl w-full flex flex-col items-center">
        {/* Step Indicator Header */}
        <div className="text-xs font-sans text-zinc-400 font-medium mb-6 text-center">
          03 · Thẻ lên tàu & Vé khoang
        </div>

        {/* Realistic White & Blue Aviation Boarding Pass Card */}
        <div className="w-full flex flex-col sm:flex-row rounded-2xl bg-[#F8FAFC] text-slate-900 border border-slate-200 relative overflow-hidden">
          {/* ======================================================== */}
          {/* LEFT MAIN TICKET BODY (70% WIDTH)                        */}
          {/* ======================================================== */}
          <motion.div
            animate={isTorn ? { x: -15, opacity: 0.95 } : { x: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="sm:w-[70%] flex flex-col justify-between border-b sm:border-b-0 sm:border-r-2 border-dashed border-slate-300 relative bg-[#F8FAFC]"
          >
            {/* Top & Bottom Authentic Semicircular Notches at Tear Line */}
            <div className="hidden sm:block absolute -top-3 -right-3 w-6 h-6 rounded-full bg-[#000000] z-20 border-b border-l border-slate-300" />
            <div className="hidden sm:block absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-[#000000] z-20 border-t border-l border-slate-300" />

            {/* Top Airline-Style Header Strip */}
            <div className="bg-[#0F172A] px-7 py-3 flex items-center justify-between">
              <span className="text-[11px] font-sans tracking-wide text-[#38BDF8] font-semibold">
                ĐƯỜNG SẮT VIỆT NAM
              </span>
              <span className="text-[10px] font-mono text-slate-400">LOTUS CLASS</span>
            </div>

            {/* Main Ticket Content Area */}
            <div className="p-7">
              {/* Route Display */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-extrabold tracking-tight text-[#0F172A] font-sans">
                    {journeyInfo.depStation.code}
                  </div>
                  <div className="text-xs font-bold text-slate-500 mt-0.5 uppercase">
                    {journeyInfo.depStation.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    KM {journeyInfo.depStation.km}
                  </div>
                </div>

                <div className="flex flex-col items-center px-4">
                  <span className="text-[10px] font-mono tracking-widest text-[#0284C7] font-bold">
                    {journeyInfo.totalDistance} KM
                  </span>
                  <div className="w-16 sm:w-24 h-[2px] bg-slate-300 my-1 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#0284C7]" />
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                    THỐNG NHẤT
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-4xl font-extrabold tracking-tight text-[#0F172A] font-sans">
                    {journeyInfo.arrStation.code}
                  </div>
                  <div className="text-xs font-bold text-slate-500 mt-0.5 uppercase">
                    {journeyInfo.arrStation.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    KM {journeyInfo.arrStation.km}
                  </div>
                </div>
              </div>

              {/* Passenger & Trip Details (Clean 4-column flight grid) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3.5 my-4 border-t border-b border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans font-medium">
                    Toa xe
                  </span>
                  <span className="text-slate-900 font-bold font-mono text-sm">{coachNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans font-medium">
                    Chỗ nằm
                  </span>
                  <span className="text-slate-900 font-bold font-mono text-sm">
                    {selectedBerth.id} ({levelText})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans font-medium">
                    Mục tiêu
                  </span>
                  <span className="text-slate-900 font-bold truncate block font-sans">{cleanIntent}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans font-medium">
                    Thời lượng
                  </span>
                  <span className="text-[#0284C7] font-bold font-mono text-sm">{durationMinutes} phút</span>
                </div>
              </div>

              {/* Bottom: Micro-print security notice & boarding gate */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>CỬA B1 · HÀNG ĐỢI ƯU TIÊN</span>
                <span>MÃ VÉ: VNR-{journeyInfo.depStation.code}{journeyInfo.arrStation.code}-{selectedBerth.id}</span>
              </div>
            </div>
          </motion.div>

          {/* ======================================================== */}
          {/* RIGHT TEAR-OFF STUB (30% WIDTH)                          */}
          {/* ======================================================== */}
          <motion.div
            animate={
              isTorn
                ? { rotate: 10, x: 70, y: 15, opacity: 0 }
                : { rotate: 0, x: 0, y: 0, opacity: 1 }
            }
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="sm:w-[30%] bg-[#F1F5F9] p-6 flex flex-col justify-between relative"
          >
            {/* Passenger Stub Header */}
            <div>
              <div className="text-[10px] font-sans font-semibold text-slate-600 pb-2 border-b border-slate-300">
                Cuống vé hành khách
              </div>

              <div className="my-4 text-xs space-y-1 text-slate-800">
                <div className="font-bold text-sm text-[#0F172A] font-mono">
                  {journeyInfo.depStation.code} → {journeyInfo.arrStation.code}
                </div>
                <div className="text-slate-600 text-[11px] font-sans">
                  Toa {coachNumber} · Giường {selectedBerth.id}
                </div>
                <div className="text-slate-500 text-[10px] font-sans">
                  {journeyInfo.totalDistance} km · {durationMinutes} phút
                </div>
              </div>

              {/* High-Contrast Black SVG Barcode Strip */}
              <div className="my-3">
                <svg className="w-full h-9" viewBox="0 0 100 24" preserveAspectRatio="none">
                  {Array.from({ length: 28 }).map((_, i) => {
                    const width = ((i * 7 + 3) % 3) + 1;
                    const x = i * 3.5;
                    return <rect key={i} x={x} y="0" width={width} height="24" fill="#0F172A" />;
                  })}
                </svg>
                <div className="text-[8px] font-mono text-slate-500 text-center tracking-widest mt-1">
                  VNR-{selectedBerth.id}
                </div>
              </div>
            </div>

            {/* Interactive Aviation Deep Cyan Tear Action Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isTorn}
                onClick={handleTearTicket}
                className="w-full py-3.5 px-4 bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-xs rounded-xl transition-all text-center cursor-pointer shadow-md font-sans"
              >
                {isTorn ? 'Đang xé vé...' : 'Xé vé lên tàu'}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Bottom Back Button */}
        <div className="mt-8 flex justify-start w-full">
          <button
            type="button"
            disabled={isTorn}
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-white font-sans text-xs transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Đổi chỗ & toa</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketStepView;
