import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import {
  CARRIAGE_BERTHS,
  TYPOGRAPHIC_FOCUS_INTENTS,
  calculateJourneyInfo,
  saveTrainJourney,
  getDefaultDurationForDistance,
} from '../data/trainStations';
import { RouteStepView } from './RouteStepView';
import { CabinStepView } from './CabinStepView';
import { TicketStepView } from './TicketStepView';
import { DepartGateView } from './DepartGateView';

export type JourneyStep = 'ROUTE' | 'CABIN' | 'TICKET' | 'DEPART' | 'ACTIVE';

export interface TrainBookingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  departureId: string;
  arrivalId: string;
  onSelectRoute: (departureId: string, arrivalId: string) => void;
  onStartJourney: (
    intent: string,
    berthInfo: { coach: string; compartment: string; berth: string },
    durationMinutes: number
  ) => void;
  initialStep?: JourneyStep;
}

const stepMotionVariants = {
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -12, filter: 'blur(4px)' },
};
const stepMotionTransition = { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const };

const TrainBookingFlowComponent: React.FC<TrainBookingFlowProps> = ({
  isOpen,
  onClose,
  departureId,
  arrivalId,
  onSelectRoute,
  onStartJourney,
  initialStep = 'ROUTE',
}) => {
  // 1. Single Source of Truth State Machine (All hooks declared unconditionally)
  const [step, setStep] = useState<JourneyStep>(initialStep);
  const [selectedDepId, setSelectedDepId] = useState<string>(departureId || 'hn');
  const [selectedArrId, setSelectedArrId] = useState<string>(arrivalId || 'dn');
  const [selectedBerthId, setSelectedBerthId] = useState<string>('07');
  const [selectedIntent, setSelectedIntent] = useState<string>(TYPOGRAPHIC_FOCUS_INTENTS[0]);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);

  const coachNumber = '03';

  // 2. Unconditional synchronization effects
  useEffect(() => {
    if (departureId) setSelectedDepId(departureId);
    if (arrivalId) setSelectedArrId(arrivalId);
  }, [departureId, arrivalId]);

  useEffect(() => {
    if (isOpen) {
      setStep(initialStep || 'ROUTE');
    }
  }, [isOpen, initialStep]);

  // 3. Journey Info Calculation Memo
  const journeyInfo = useMemo(
    () => calculateJourneyInfo(selectedDepId, selectedArrId, 0),
    [selectedDepId, selectedArrId]
  );

  // Auto-sync baseline focus duration when route distance changes
  useEffect(() => {
    const recommended = getDefaultDurationForDistance(journeyInfo.totalDistance);
    setDurationMinutes(recommended);
  }, [journeyInfo.totalDistance]);

  const selectedBerth = useMemo(
    () => CARRIAGE_BERTHS.find((b) => b.id === selectedBerthId) || CARRIAGE_BERTHS[6],
    [selectedBerthId]
  );

  // 4. Keyboard Listener for ESC (Unconditionally registered)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && step !== 'DEPART') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, step]);

  // 5. Handlers
  const handleSwapStations = useCallback(() => {
    const nextDep = selectedArrId;
    const nextArr = selectedDepId;
    setSelectedDepId(nextDep);
    setSelectedArrId(nextArr);
    onSelectRoute(nextDep, nextArr);
    saveTrainJourney({ departureId: nextDep, arrivalId: nextArr });
  }, [selectedArrId, selectedDepId, onSelectRoute]);

  const handleSelectStation = useCallback(
    (id: string) => {
      if (id === selectedDepId) {
        handleSwapStations();
      } else {
        setSelectedArrId(id);
        onSelectRoute(selectedDepId, id);
        saveTrainJourney({ departureId: selectedDepId, arrivalId: id });
      }
    },
    [selectedDepId, handleSwapStations, onSelectRoute]
  );

  const handleSelectRouteFromRouteStep = useCallback(
    (depId: string, arrId: string) => {
      setSelectedDepId(depId);
      setSelectedArrId(arrId);
      onSelectRoute(depId, arrId);
    },
    [onSelectRoute]
  );

  const handleConfirmRoute = useCallback(() => {
    setStep('CABIN');
  }, []);

  const handleStartDepart = useCallback(() => {
    // 1. Unblock Web AudioContext on direct user gesture
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
      }
    } catch {}

    // 2. Construct berth info labels
    const compartmentLabel = `Khoang ${String(selectedBerth.compartment).padStart(2, '0')}`;
    const berthLabel = `Giường ${String(selectedBerth.number).padStart(2, '0')} (${
      selectedBerth.level === 'lower' ? 'Tầng 1' : 'Tầng 2'
    })`;

    onStartJourney(
      selectedIntent,
      {
        coach: `Toa ${coachNumber}`,
        compartment: compartmentLabel,
        berth: berthLabel,
      },
      durationMinutes
    );

    setStep('ACTIVE');
    onClose();
  }, [coachNumber, durationMinutes, onClose, onStartJourney, selectedBerth, selectedIntent]);

  // 6. Zero-slop structure: Keep container persistently rendered without destroying on isOpen toggle
  return (
    <div
      className={`fixed inset-0 z-50 bg-[#000000] flex flex-col text-white select-none overflow-hidden font-apple transition-opacity duration-300 ease-out ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none invisible'
      }`}
    >
      {/* Top Flight-Style Navigation HUD */}
      <header className="relative z-30 w-full px-4 sm:px-6 py-3.5 sm:py-4 pt-[max(env(safe-area-inset-top),1rem)] border-b border-white/[0.08] flex items-center justify-between bg-[#000000]/95 backdrop-blur-md">
        {/* Left: Brand Label */}
        <div className="flex items-center gap-3">
          <div className="text-xs font-sans tracking-wide text-zinc-300 font-medium">
            Đường sắt Việt Nam
          </div>
        </div>

        {/* Center: Large Typography Codes */}
        <div className="hidden sm:flex items-center gap-2 font-medium text-sm">
          <span className="text-white font-mono font-bold">{journeyInfo.depStation.code}</span>
          <span className="text-zinc-400 font-sans text-xs">{journeyInfo.depStation.name}</span>
          <span className="text-zinc-600 font-sans">→</span>
          <span className="text-amber-400 font-mono font-bold">{journeyInfo.arrStation.code}</span>
          <span className="text-amber-300/90 font-sans text-xs">{journeyInfo.arrStation.name}</span>
          <span className="text-xs text-zinc-500 font-sans ml-1.5">
            · {journeyInfo.totalDistance} km
          </span>
        </div>

        {/* Right: Exit / Close Button (Apple Design Standard) */}
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:border-white/30 text-zinc-300 hover:text-white transition bg-white/[0.04] hover:bg-white/[0.08]"
          title="Thoát chế độ đặt vé (Esc)"
        >
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono border border-white/15 text-zinc-300 leading-none">
            esc
          </kbd>
          <span className="text-xs font-sans font-medium">Đóng</span>
          <X className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </header>

      {/* Dynamic Step View Switcher with Framer Motion */}
      <div className="relative flex-1 w-full h-full flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 'ROUTE' && (
            <motion.div
              key="step-route"
              variants={stepMotionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepMotionTransition}
              className="relative flex-1 w-full h-full flex flex-col overflow-hidden"
            >
              <RouteStepView
                isOpen={isOpen && step === 'ROUTE'}
                departureId={selectedDepId}
                arrivalId={selectedArrId}
                durationMinutes={durationMinutes}
                onSelectDuration={setDurationMinutes}
                onSelectStation={handleSelectStation}
                onSelectRoute={handleSelectRouteFromRouteStep}
                onSwapStations={handleSwapStations}
                onConfirm={handleConfirmRoute}
              />
            </motion.div>
          )}

          {step === 'CABIN' && (
            <motion.div
              key="step-cabin"
              variants={stepMotionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepMotionTransition}
              className="relative flex-1 w-full h-full flex flex-col overflow-hidden"
            >
              <CabinStepView
                selectedBerthId={selectedBerthId}
                onSelectBerth={setSelectedBerthId}
                selectedIntent={selectedIntent}
                onSelectIntent={setSelectedIntent}
                coachNumber={coachNumber}
                onBack={() => setStep('ROUTE')}
                onConfirm={() => setStep('TICKET')}
              />
            </motion.div>
          )}

          {step === 'TICKET' && (
            <motion.div
              key="step-ticket"
              variants={stepMotionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepMotionTransition}
              className="relative flex-1 w-full h-full flex flex-col overflow-hidden"
            >
              <TicketStepView
                journeyInfo={journeyInfo}
                coachNumber={coachNumber}
                selectedBerth={selectedBerth}
                selectedIntent={selectedIntent}
                durationMinutes={durationMinutes}
                onBack={() => setStep('CABIN')}
                onConfirm={() => setStep('DEPART')}
              />
            </motion.div>
          )}

          {step === 'DEPART' && (
            <motion.div
              key="step-depart"
              variants={stepMotionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepMotionTransition}
              className="relative flex-1 w-full h-full flex flex-col overflow-hidden"
            >
              <DepartGateView
                journeyInfo={journeyInfo}
                coachNumber={coachNumber}
                selectedBerth={selectedBerth}
                selectedIntent={selectedIntent}
                durationMinutes={durationMinutes}
                onStartJourney={handleStartDepart}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const TrainBookingFlow = React.memo(TrainBookingFlowComponent);
export default TrainBookingFlow;
