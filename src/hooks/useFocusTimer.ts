import { useState, useEffect, useRef, useCallback } from 'react';

export type FocusMode = 'focus' | 'shortBreak' | 'longBreak';

const DEFAULT_DURATIONS: Record<FocusMode, number> = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
};

/**
 * Synthesizes a clean, pleasant Apple-like notification chime using AudioContext.
 * Two-tone bell: Sine wave D5 (587.33Hz) -> A5 (880Hz) with smooth exponential decay.
 * Zero external audio files required.
 */
function playChimeSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Tone 1: D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.9);

    // Tone 2: A5 (880 Hz) slightly staggered
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.16);
    gain2.gain.setValueAtTime(0.22, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.16);
    osc2.stop(now + 1.2);
  } catch (err) {
    console.warn('[FocusTimer] Could not play notification chime:', err);
  }
}

/**
 * Trigger native browser notification if permitted
 */
function triggerBrowserNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
    } catch (err) {
      console.warn('[FocusTimer] Notification error:', err);
    }
  }
}

export function useFocusTimer() {
  const [mode, setModeState] = useState<FocusMode>('focus');
  const [modeDurations, setModeDurations] = useState<{
    focus: number;
    shortBreak: number;
    longBreak: number;
  }>(() => {
    try {
      const saved = localStorage.getItem('viet_travel_mode_durations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.focus && parsed.shortBreak && parsed.longBreak) return parsed;
      }
    } catch {}
    return DEFAULT_DURATIONS;
  });

  const [customFocusDuration, setCustomFocusDuration] = useState<number>(() => modeDurations.focus * 60);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => modeDurations.focus * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Anti-throttling timestamp refs
  const endTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const savedFocusSecondsRef = useRef<number | null>(null);

  const totalSeconds = mode === 'focus' ? customFocusDuration : modeDurations[mode] * 60;

  // Request notification permission once
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch {}
    }
  }, []);

  // Update minutes for a specific mode
  const updateModeDuration = useCallback((targetMode: FocusMode, minutes: number) => {
    const validMinutes = Math.max(1, Math.min(180, Math.round(minutes) || 1));
    setModeDurations((prev) => {
      const next = { ...prev, [targetMode]: validMinutes };
      try {
        localStorage.setItem('viet_travel_mode_durations', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (targetMode === 'focus') {
      setCustomFocusDuration(validMinutes * 60);
      savedFocusSecondsRef.current = null;
    }

    if (!isRunning && mode === targetMode) {
      setRemainingSeconds(validMinutes * 60);
    }
  }, [isRunning, mode]);

  // Set custom duration (e.g. for dynamic distance-based sessions)
  const setCustomDuration = useCallback((seconds: number) => {
    setCustomFocusDuration(seconds);
    savedFocusSecondsRef.current = null;
    setRemainingSeconds((prev) => (isRunning ? prev : seconds));
  }, [isRunning]);

  // Mode switcher with smart focus progress preservation
  const setMode = useCallback((newMode: FocusMode) => {
    setIsRunning(false);
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    endTimeRef.current = null;

    // If leaving focus mode into a break, preserve current focus progress
    if (mode === 'focus' && newMode !== 'focus') {
      savedFocusSecondsRef.current = remainingSeconds;
    }

    setModeState(newMode);

    if (newMode === 'focus') {
      // Return to focus session: restore saved remaining time, or default to full custom focus duration
      const resumeSecs = savedFocusSecondsRef.current !== null ? savedFocusSecondsRef.current : (modeDurations.focus * 60);
      setRemainingSeconds(resumeSecs);
    } else {
      setRemainingSeconds(modeDurations[newMode] * 60);
    }
  }, [mode, remainingSeconds, modeDurations]);

  // Timer Tick Handler using absolute timestamps
  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    endTimeRef.current = null;

    // 1. Chime sound
    playChimeSound();

    // 2. Browser notification
    const title = mode === 'focus' ? 'Phiên tập trung hoàn thành // Focus Session Completed' : 'Hết giờ giải lao // Break Finished';
    const body = mode === 'focus' ? 'Great job! Time to take a short break.' : 'Hết giờ nghỉ! Tàu sẵn sàng tiếp tục hành trình.';
    triggerBrowserNotification(title, body);

    // 3. If a break finished, automatically switch back to focus mode ready to resume
    if (mode === 'shortBreak' || mode === 'longBreak') {
      setModeState('focus');
      const resumeSecs = savedFocusSecondsRef.current !== null ? savedFocusSecondsRef.current : customFocusDuration;
      setRemainingSeconds(resumeSecs);
      endTimeRef.current = Date.now() + resumeSecs * 1000;
      setIsRunning(true);
    }
  }, [mode, customFocusDuration]);

  // Start timer with optional override duration
  const startTimer = useCallback((overrideSeconds?: number) => {
    requestNotificationPermission();
    if (overrideSeconds && overrideSeconds > 0) {
      setCustomFocusDuration(overrideSeconds);
      setRemainingSeconds(overrideSeconds);
      endTimeRef.current = Date.now() + overrideSeconds * 1000;
    } else if (remainingSeconds <= 0) {
      setRemainingSeconds(totalSeconds);
      endTimeRef.current = Date.now() + totalSeconds * 1000;
    } else {
      endTimeRef.current = Date.now() + remainingSeconds * 1000;
    }
    setIsRunning(true);
  }, [remainingSeconds, totalSeconds, requestNotificationPermission]);

  // Pause timer
  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    if (endTimeRef.current !== null) {
      const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      endTimeRef.current = null;
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Toggle timer
  const toggleTimer = useCallback(() => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  }, [isRunning, pauseTimer, startTimer]);

  // Reset timer
  const resetTimer = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    endTimeRef.current = null;
    savedFocusSecondsRef.current = null;
    setRemainingSeconds(totalSeconds);
  }, [totalSeconds]);

  // Anti-throttling active timer loop
  useEffect(() => {
    if (!isRunning) return;

    const tick = () => {
      if (!endTimeRef.current) return;
      const diffMs = endTimeRef.current - Date.now();
      const secondsLeft = Math.max(0, Math.round(diffMs / 1000));

      setRemainingSeconds(secondsLeft);

      if (diffMs <= 0) {
        handleTimerComplete();
      }
    };

    // Run tick immediately
    tick();

    // High frequency interval (250ms) to update smoothly without drift
    intervalRef.current = window.setInterval(tick, 250);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, handleTimerComplete]);

  // Format MM:SS
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Progress percentage (0 to 100)
  const progressPercent = Math.min(100, Math.max(0, ((totalSeconds - remainingSeconds) / totalSeconds) * 100));

  return {
    mode,
    setMode,
    modeDurations,
    updateModeDuration,
    isRunning,
    remainingSeconds,
    totalSeconds,
    formattedTime,
    progressPercent,
    startTimer,
    pauseTimer,
    toggleTimer,
    resetTimer,
    setCustomDuration,
    requestNotificationPermission,
  };
}
