import React from 'react';
import { X, Volume2, VolumeX, CloudRain, Flame, Waves, Activity, Trees, RotateCcw, Train, Coffee } from 'lucide-react';
import { AmbientSoundId, AMBIENT_SOUNDS } from '../hooks/useAmbientSounds';

interface AmbientSoundMixerProps {
  isOpen: boolean;
  onClose: () => void;
  volumes: Record<AmbientSoundId, number>;
  isMasterMuted: boolean;
  onVolumeChange: (id: AmbientSoundId, volume: number) => void;
  onToggleMasterMute: () => void;
  onStopAll: () => void;
}

export const AMBIENT_ICONS: Record<AmbientSoundId, React.ComponentType<{ className?: string }>> = {
  train: Train,
  rain: CloudRain,
  cafe: Coffee,
  brownNoise: Activity,
  campfire: Flame,
  ocean: Waves,
  forest: Trees,
};

const ICONS = AMBIENT_ICONS;

export const AmbientSoundMixer: React.FC<AmbientSoundMixerProps> = ({
  isOpen,
  onClose,
  volumes,
  isMasterMuted,
  onVolumeChange,
  onToggleMasterMute,
  onStopAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Popover Card */}
      <div className="relative w-full max-w-sm rounded-3xl bg-[#161618]/95 border border-white/10 shadow-2xl p-6 z-10 backdrop-blur-2xl animate-fade-in text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMasterMute}
              className={`p-1.5 rounded-xl transition ${
                isMasterMuted ? 'bg-rose-500/20 text-rose-400' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title={isMasterMuted ? 'Bật âm thanh' : 'Tắt tiếng tất cả'}
            >
              {isMasterMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Âm thanh tập trung</h3>
              <p className="text-[11px] text-neutral-400">Pha trộn âm thanh thiên nhiên</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onStopAll}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition"
              title="Đặt lại tất cả về 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5 Channels List */}
        <div className="py-4 space-y-4">
          {AMBIENT_SOUNDS.map((sound) => {
            const Icon = ICONS[sound.id];
            const currentVol = volumes[sound.id];
            const isActive = currentVol > 0 && !isMasterMuted;

            return (
              <div key={sound.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                        isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-neutral-500'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className={isActive ? 'text-white font-medium' : 'text-neutral-400'}>
                      {sound.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-500">
                    {currentVol}%
                  </span>
                </div>

                <div className="relative flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentVol}
                    onChange={(e) => onVolumeChange(sound.id, Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer focus:outline-none"
                    style={{
                      background: `linear-gradient(to right, #ffffff ${currentVol}%, rgba(255, 255, 255, 0.1) ${currentVol}%)`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Tự do mix cùng nhạc YouTube</span>
          <span className="font-mono text-[10px]">Web Audio API</span>
        </div>
      </div>
    </div>
  );
};
