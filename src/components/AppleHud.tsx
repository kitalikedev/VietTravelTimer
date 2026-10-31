import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';

interface AppleHudProps {
  volume: number;
  isMuted: boolean;
  visible: boolean;
}

export const AppleHud: React.FC<AppleHudProps> = ({ volume, isMuted, visible }) => {
  const [show, setShow] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [visible, volume, isMuted]);

  if (!show) return null;

  const currentLevel = isMuted ? 0 : volume;

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none animate-fade-in">
      <div className="px-4 py-2.5 rounded-2xl bg-neutral-900/90 border border-white/[0.08] backdrop-blur-2xl shadow-2xl flex items-center gap-3 text-white">
        {isMuted || volume === 0 ? (
          <VolumeX className="w-4 h-4 text-neutral-400" />
        ) : volume < 50 ? (
          <Volume1 className="w-4 h-4 text-neutral-400" />
        ) : (
          <Volume2 className="w-4 h-4 text-neutral-400" />
        )}

        <div className="w-24 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-75"
            style={{ width: `${currentLevel}%` }}
          />
        </div>

        <span className="text-[11px] font-mono text-neutral-400 w-7 text-right">
          {currentLevel}%
        </span>
      </div>
    </div>
  );
};
