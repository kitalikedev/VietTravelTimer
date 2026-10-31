import { useEffect, useRef } from 'react';

export interface UseShortcutsProps {
  onTogglePlay: () => void;
  onSeekRelative: (deltaSeconds: number) => void;
  onVolumeChangeRelative: (deltaPercent: number) => void;
  onToggleMute: () => void;
  onToggleLyrics?: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onNudgeOffset?: (delta: number) => void;
  enabled?: boolean;
}

/**
 * useShortcuts
 * Apple Music keyboard shortcuts with strict editable element guards:
 * - Space: Toggle Play / Pause
 * - ArrowLeft / ArrowRight: Seek -5s / +5s (or Shift+Arrow to skip track)
 * - ArrowUp / ArrowDown: Volume +5% / -5%
 * - KeyM: Toggle Mute / Unmute
 * - KeyL: Toggle Lyrics view
 * - KeyN / KeyP: Next / Previous track in queue
 * - BracketLeft ([): Nudge lyrics offset -100ms (-0.1s) / Shift + [ for -500ms (-0.5s)
 * - BracketRight (]): Nudge lyrics offset +100ms (+0.1s) / Shift + ] for +500ms (+0.5s)
 */
export function useShortcuts({
  onTogglePlay,
  onSeekRelative,
  onVolumeChangeRelative,
  onToggleMute,
  onToggleLyrics,
  onNextTrack,
  onPrevTrack,
  onNudgeOffset,
  enabled = true,
}: UseShortcutsProps) {
  const handlersRef = useRef({
    onTogglePlay,
    onSeekRelative,
    onVolumeChangeRelative,
    onToggleMute,
    onToggleLyrics,
    onNextTrack,
    onPrevTrack,
    onNudgeOffset,
  });

  useEffect(() => {
    handlersRef.current = {
      onTogglePlay,
      onSeekRelative,
      onVolumeChangeRelative,
      onToggleMute,
      onToggleLyrics,
      onNextTrack,
      onPrevTrack,
      onNudgeOffset,
    };
  });

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Crucial Guard: completely bypass if typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handlersRef.current.onTogglePlay();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            handlersRef.current.onPrevTrack();
          } else {
            handlersRef.current.onSeekRelative(-5);
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            handlersRef.current.onNextTrack();
          } else {
            handlersRef.current.onSeekRelative(5);
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          handlersRef.current.onVolumeChangeRelative(5);
          break;

        case 'ArrowDown':
          e.preventDefault();
          handlersRef.current.onVolumeChangeRelative(-5);
          break;

        case 'KeyM':
          e.preventDefault();
          handlersRef.current.onToggleMute();
          break;

        case 'KeyL':
          e.preventDefault();
          handlersRef.current.onToggleLyrics?.();
          break;

        case 'KeyN':
          e.preventDefault();
          handlersRef.current.onNextTrack();
          break;

        case 'KeyP':
          e.preventDefault();
          handlersRef.current.onPrevTrack();
          break;

        case 'BracketLeft':
          e.preventDefault();
          {
            const delta = e.shiftKey ? -0.5 : -0.1;
            handlersRef.current.onNudgeOffset?.(delta);
          }
          break;

        case 'BracketRight':
          e.preventDefault();
          {
            const delta = e.shiftKey ? 0.5 : 0.1;
            handlersRef.current.onNudgeOffset?.(delta);
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);
}
