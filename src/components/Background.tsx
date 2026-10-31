import React, { useRef, useEffect, useState } from 'react';
import { BackdropMode } from './WallpaperManager';

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
  isRunning,
  isBreak = false,
  customWallpaperUrl,
  songThumbnailUrl,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [isLoopFading, setIsLoopFading] = useState<boolean>(false);

  // Playback Synchronization for POV Train Video:
  // When timer is RUNNING & NOT on break -> videoRef.current?.play()
  // When timer is PAUSED or on BREAK -> videoRef.current?.pause()
  useEffect(() => {
    if (mode !== 'POV_VIDEO' || videoError) return;

    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (isRunning && !isBreak) {
      try {
        videoEl.volume = 0.35;
      } catch {}
      videoEl.play().catch((err) => {
        console.warn('[Background] Video play error:', err);
      });
    } else {
      videoEl.pause();
    }
  }, [isRunning, isBreak, mode, videoError]);

  // 1. POV TRAIN VIDEO MODE
  if (mode === 'POV_VIDEO') {
    if (videoError) {
      return <div className="fixed inset-0 pointer-events-none select-none z-0 bg-[#09090b]" />;
    }

    const baseUrl = import.meta.env.BASE_URL || '/';
    const videoSrc = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}povtrain.mp4`;

    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0 bg-[#09090b]">
        <video
          ref={videoRef}
          src={videoSrc}
          preload="metadata"
          playsInline
          muted
          loop
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            if (!el.duration || isNaN(el.duration)) return;
            // Smoothly fade out to black 1.2s before loop end
            if (el.currentTime >= el.duration - 1.2) {
              if (!isLoopFading) setIsLoopFading(true);
            } else if (el.currentTime <= 1.0) {
              // Smoothly fade back in
              if (isLoopFading) setIsLoopFading(false);
            }
          }}
          onError={() => {
            console.warn('[Background] Failed to load train video, falling back.');
            setVideoError(true);
          }}
          className="w-full h-full object-cover select-none pointer-events-none transform-gpu"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>

        {/* Minimal Hairline Contrast Tint */}
        <div className="absolute inset-0 bg-black/35 pointer-events-none" />
        <div className="absolute inset-0 bg-radial-vignette opacity-50 pointer-events-none" />

        {/* Seamless Video Loop Blackout Crossfade Overlay */}
        <div
          className={`absolute inset-0 bg-black pointer-events-none transition-opacity duration-1000 ${
            isLoopFading ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    );
  }

  // 2. CUSTOM USER WALLPAPER MODE (IndexedDB stored Blob URL)
  if (mode === 'CUSTOM_WALLPAPER') {
    if (customWallpaperUrl) {
      return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0 bg-neutral-950">
          <img
            src={customWallpaperUrl}
            alt="Custom Wallpaper"
            className="fixed inset-0 w-full h-full object-cover -z-10 brightness-[0.65] contrast-[1.05] transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
          <div className="absolute inset-0 bg-radial-vignette opacity-70 pointer-events-none" />
        </div>
      );
    }

    // Fallback if no custom wallpaper uploaded yet
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0 bg-[#09090b]">
        <div className="absolute -top-[15%] -left-[10%] w-[65vw] h-[65vw] rounded-full bg-[#1e293b] opacity-30 filter blur-[120px] transform-gpu" />
        <div className="absolute -bottom-[20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#0f172a] opacity-35 filter blur-[130px] transform-gpu" />
        <div className="absolute inset-0 bg-radial-vignette opacity-70 pointer-events-none" />
      </div>
    );
  }

  // 3. CENTER ARTWORK MODE (macOS Apple Music Style living ambient blurred backdrop)
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0 bg-[#09090b]">
      {/* Dynamic Ambient Fluid Light Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Orb 1: Upper Left (Cobalt Sapphire) */}
        <div className="absolute -top-[15%] -left-[10%] w-[65vw] h-[65vw] max-w-[900px] max-h-[900px] rounded-full bg-[#1b3d82] opacity-35 filter blur-[120px] mix-blend-screen transform-gpu animate-ambient-1" />

        {/* Orb 2: Center Right (Midnight Cyan Azure) */}
        <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] max-w-[850px] max-h-[850px] rounded-full bg-[#102d64] opacity-35 filter blur-[120px] mix-blend-screen transform-gpu animate-ambient-2" />

        {/* Orb 3: Bottom Left (Deep Slate Violet) */}
        <div className="absolute -bottom-[20%] left-[20%] w-[50vw] h-[50vw] max-w-[750px] max-h-[750px] rounded-full bg-[#182346] opacity-30 filter blur-[130px] mix-blend-screen transform-gpu" />
      </div>

      {/* Direct Full-Screen Cover Artwork Spill */}
      {songThumbnailUrl && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src={songThumbnailUrl}
            alt=""
            className="w-[120%] h-[120%] -top-[10%] -left-[10%] absolute object-cover filter blur-[100px] opacity-45 scale-125 transform-gpu pointer-events-none animate-ambient-1"
          />
        </div>
      )}

      {/* Dark Vignette Overlay for crisp timer contrast */}
      <div className="absolute inset-0 bg-radial-vignette opacity-70 pointer-events-none" />
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />
    </div>
  );
};

export default Background;
