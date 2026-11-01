import React, { useState } from 'react';
import { BackdropMode, PIXEL_BACKGROUNDS, getBackgroundAssetUrl } from '../data/backgrounds';

export type BackgroundMode = BackdropMode;

interface BackgroundProps {
  mode: BackdropMode;
  isRunning: boolean;
  isBreak?: boolean;
  customWallpaperUrl: string | null;
  songThumbnailUrl?: string;
  isPlaying?: boolean;
}

export const Background: React.FC<BackgroundProps> = ({
  mode,
  customWallpaperUrl,
  songThumbnailUrl,
}) => {
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});

  // 1. PIXEL ART GIF BACKGROUND (PIXEL_1, PIXEL_2, PIXEL_3, POV_VIDEO fallback)
  const pixelConfig =
    PIXEL_BACKGROUNDS.find((p) => p.id === mode) ||
    (mode === 'POV_VIDEO' ? PIXEL_BACKGROUNDS[0] : null);

  if (pixelConfig) {
    const hasError = imgErrorMap[pixelConfig.id];
    const imgSrc = hasError
      ? pixelConfig.fallbackUrl
      : getBackgroundAssetUrl(pixelConfig.localPath);

    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0 bg-[#09090b]">
        <img
          key={pixelConfig.id}
          src={imgSrc}
          alt={pixelConfig.label}
          onError={() => {
            if (!hasError) {
              setImgErrorMap((prev) => ({ ...prev, [pixelConfig.id]: true }));
            }
          }}
          className="w-full h-full object-cover select-none pointer-events-none transform-gpu transition-opacity duration-700"
        />

        {/* Subtle customizable dark vignette overlay (bg-black/25) for crisp typography */}
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />
        <div className="absolute inset-0 bg-radial-vignette opacity-50 pointer-events-none" />
      </div>
    );
  }

  // 2. DARK CANVAS (Tối giản)
  if (mode === 'DARK_CANVAS') {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0 bg-[#09090b]">
        {/* Soft elegant atmospheric gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#121215] via-[#09090b] to-[#050507]" />
        <div className="absolute inset-0 bg-radial-vignette opacity-60 pointer-events-none" />
      </div>
    );
  }

  // 3. CUSTOM USER WALLPAPER (Upload or Link)
  if (mode === 'CUSTOM_WALLPAPER') {
    if (customWallpaperUrl) {
      return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0 bg-neutral-950">
          <img
            src={customWallpaperUrl}
            alt="Custom Wallpaper"
            className="fixed inset-0 w-full h-full object-cover -z-10 brightness-[0.70] contrast-[1.05] transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-black/35 pointer-events-none" />
          <div className="absolute inset-0 bg-radial-vignette opacity-70 pointer-events-none" />
        </div>
      );
    }

    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0 bg-[#09090b]">
        <div className="absolute -top-[15%] -left-[10%] w-[65vw] h-[65vw] rounded-full bg-[#1e293b] opacity-30 filter blur-[120px] transform-gpu" />
        <div className="absolute -bottom-[20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#0f172a] opacity-35 filter blur-[130px] transform-gpu" />
        <div className="absolute inset-0 bg-radial-vignette opacity-70 pointer-events-none" />
      </div>
    );
  }

  // 4. CENTER ARTWORK MODE (macOS Apple Music Style living ambient blurred backdrop)
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0 bg-[#09090b]">
      {/* Dynamic Ambient Fluid Light Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[15%] -left-[10%] w-[65vw] h-[65vw] max-w-[900px] max-h-[900px] rounded-full bg-[#1b3d82] opacity-35 filter blur-[120px] mix-blend-screen transform-gpu animate-ambient-1" />
        <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] max-w-[850px] max-h-[850px] rounded-full bg-[#102d64] opacity-35 filter blur-[120px] mix-blend-screen transform-gpu animate-ambient-2" />
        <div className="absolute -bottom-[20%] left-[20%] w-[50vw] h-[50vw] max-w-[750px] max-h-[750px] rounded-full bg-[#182346] opacity-30 filter blur-[130px] mix-blend-screen transform-gpu" />
      </div>

      {songThumbnailUrl && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src={songThumbnailUrl}
            alt=""
            className="w-[120%] h-[120%] -top-[10%] -left-[10%] absolute object-cover filter blur-[100px] opacity-45 scale-125 transform-gpu pointer-events-none animate-ambient-1"
          />
        </div>
      )}

      <div className="absolute inset-0 bg-radial-vignette opacity-70 pointer-events-none" />
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />
    </div>
  );
};

export default Background;
