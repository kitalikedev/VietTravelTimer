import React from 'react';
import { TrainBookingFlow } from './TrainBookingFlow';

export interface TrainJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  departureId: string;
  arrivalId: string;
  onSelectRoute: (departureId: string, arrivalId: string) => void;
  onActivateTrainWallpaper?: () => void;
  onStartJourney?: (
    intent: string,
    berthInfo: { coach: string; compartment: string; berth: string }
  ) => void;
}

export const TrainJourneyModal: React.FC<TrainJourneyModalProps> = ({
  isOpen,
  onClose,
  departureId,
  arrivalId,
  onSelectRoute,
  onActivateTrainWallpaper,
  onStartJourney,
}) => {
  const handleStart = (
    intent: string,
    berthInfo: { coach: string; compartment: string; berth: string }
  ) => {
    if (onStartJourney) {
      onStartJourney(intent, berthInfo);
    } else if (onActivateTrainWallpaper) {
      onActivateTrainWallpaper();
    }
  };

  return (
    <TrainBookingFlow
      isOpen={isOpen}
      onClose={onClose}
      departureId={departureId}
      arrivalId={arrivalId}
      onSelectRoute={onSelectRoute}
      onStartJourney={handleStart}
    />
  );
};

export default TrainJourneyModal;
