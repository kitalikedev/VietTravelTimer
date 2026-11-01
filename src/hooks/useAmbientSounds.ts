import { useState, useEffect, useRef, useCallback } from 'react';

export type AmbientSoundId = 'train' | 'rain' | 'cafe' | 'brownNoise' | 'campfire' | 'ocean' | 'forest';

export interface AmbientSoundConfig {
  id: AmbientSoundId;
  label: string;
  iconName: string;
  defaultVolume: number;
}

export const AMBIENT_SOUNDS: AmbientSoundConfig[] = [
  { id: 'train', label: 'Tiếng tàu chạy (Train)', iconName: 'Train', defaultVolume: 0 },
  { id: 'rain', label: 'Mưa rào (Rain)', iconName: 'CloudRain', defaultVolume: 0 },
  { id: 'cafe', label: 'Quán cà phê (Cafe)', iconName: 'Coffee', defaultVolume: 0 },
  { id: 'brownNoise', label: 'Deep Brown Noise', iconName: 'Activity', defaultVolume: 0 },
  { id: 'campfire', label: 'Lửa trại (Campfire)', iconName: 'Flame', defaultVolume: 0 },
  { id: 'ocean', label: 'Sóng biển (Ocean Waves)', iconName: 'Waves', defaultVolume: 0 },
  { id: 'forest', label: 'Rừng đêm (Night Forest)', iconName: 'Trees', defaultVolume: 0 },
];

const STORAGE_KEY = 'ytlyrics_ambient_volumes';

export function useAmbientSounds() {
  const [volumes, setVolumes] = useState<Record<AmbientSoundId, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            train: Number(parsed.train) || 0,
            rain: Number(parsed.rain) || 0,
            cafe: Number(parsed.cafe) || 0,
            brownNoise: Number(parsed.brownNoise) || 0,
            campfire: Number(parsed.campfire) || 0,
            ocean: Number(parsed.ocean) || 0,
            forest: Number(parsed.forest) || 0,
          };
        }
      }
    } catch {}
    return {
      train: 0,
      rain: 0,
      cafe: 0,
      brownNoise: 0,
      campfire: 0,
      ocean: 0,
      forest: 0,
    };
  });

  const [isMasterMuted, setIsMasterMuted] = useState<boolean>(false);

  // Audio Context & Nodes Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const channelGainsRef = useRef<Record<AmbientSoundId, GainNode | null>>({
    train: null,
    rain: null,
    cafe: null,
    brownNoise: null,
    campfire: null,
    ocean: null,
    forest: null,
  });
  const isInitializedRef = useRef<boolean>(false);

  // Helper to ensure AudioContext is active
  const ensureAudioContext = useCallback(() => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    }

    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;

    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.setValueAtTime(isMasterMuted ? 0 : 1, ctx.currentTime);
    master.connect(ctx.destination);
    masterGainRef.current = master;

    // Helper: Create White/Pink Noise Buffer
    const sampleRate = ctx.sampleRate;
    const bufferLength = sampleRate * 5; // 5-second seamless loop buffer

    // 0. TRAIN RHYTHM SYNTHESIS (Mechanical cadence chug-chug)
    const trainGain = ctx.createGain();
    trainGain.gain.setValueAtTime((volumes.train / 100) * 0.85, ctx.currentTime);
    trainGain.connect(master);
    channelGainsRef.current.train = trainGain;

    const trainBuffer = ctx.createBuffer(1, bufferLength, sampleRate);
    const trainData = trainBuffer.getChannelData(0);
    let trainLast = 0.0;
    for (let i = 0; i < bufferLength; i++) {
      const white = Math.random() * 2 - 1;
      trainLast = (trainLast + 0.02 * white) / 1.02;
      const t = i / sampleRate;
      const pattern = (t * 1.8) % 1;
      const beat1 = Math.exp(-Math.pow((pattern - 0.0) * 30, 2));
      const beat2 = Math.exp(-Math.pow((pattern - 0.15) * 30, 2));
      const beat3 = Math.exp(-Math.pow((pattern - 0.5) * 30, 2));
      const beat4 = Math.exp(-Math.pow((pattern - 0.65) * 30, 2));
      const railPulse = (beat1 + beat2 * 0.8 + beat3 * 0.9 + beat4 * 0.7) * 0.45;
      trainData[i] = (trainLast * 2.2 + white * 0.08) * (0.6 + railPulse);
    }
    const trainSource = ctx.createBufferSource();
    trainSource.buffer = trainBuffer;
    trainSource.loop = true;
    const trainFilter = ctx.createBiquadFilter();
    trainFilter.type = 'lowpass';
    trainFilter.frequency.setValueAtTime(320, ctx.currentTime);
    trainSource.connect(trainFilter);
    trainFilter.connect(trainGain);
    trainSource.start();

    // 0B. CAFE AMBIENCE SYNTHESIS (Warm room chatter + clinks)
    const cafeGain = ctx.createGain();
    cafeGain.gain.setValueAtTime((volumes.cafe / 100) * 0.75, ctx.currentTime);
    cafeGain.connect(master);
    channelGainsRef.current.cafe = cafeGain;

    const cafeBuffer = ctx.createBuffer(1, bufferLength, sampleRate);
    const cafeData = cafeBuffer.getChannelData(0);
    let cafeLast = 0.0;
    for (let i = 0; i < bufferLength; i++) {
      const white = Math.random() * 2 - 1;
      cafeLast = (cafeLast + 0.04 * white) / 1.04;
      const t = i / sampleRate;
      const clink1 = Math.sin(2 * Math.PI * 2200 * t) * (Math.random() < 0.0004 ? 0.35 : 0);
      const clink2 = Math.sin(2 * Math.PI * 3400 * t) * (Math.random() < 0.0003 ? 0.25 : 0);
      cafeData[i] = cafeLast * 1.8 + clink1 + clink2;
    }
    const cafeSource = ctx.createBufferSource();
    cafeSource.buffer = cafeBuffer;
    cafeSource.loop = true;
    const cafeFilter = ctx.createBiquadFilter();
    cafeFilter.type = 'bandpass';
    cafeFilter.frequency.setValueAtTime(650, ctx.currentTime);
    cafeFilter.Q.setValueAtTime(0.7, ctx.currentTime);
    cafeSource.connect(cafeFilter);
    cafeFilter.connect(cafeGain);
    cafeSource.start();

    // 1. RAIN SYNTHESIS (Pink noise + Bandpass + Highpass)
    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime((volumes.rain / 100) * 0.7, ctx.currentTime);
    rainGain.connect(master);
    channelGainsRef.current.rain = rainGain;

    const rainBuffer = ctx.createBuffer(1, bufferLength, sampleRate);
    const rainData = rainBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferLength; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      rainData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
      b6 = white * 0.115926;
    }
    const rainSource = ctx.createBufferSource();
    rainSource.buffer = rainBuffer;
    rainSource.loop = true;
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(1400, ctx.currentTime);
    rainSource.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainSource.start();

    // 2. CAMPFIRE SYNTHESIS (Brown rumble + Crackle bursts)
    const fireGain = ctx.createGain();
    fireGain.gain.setValueAtTime((volumes.campfire / 100) * 0.85, ctx.currentTime);
    fireGain.connect(master);
    channelGainsRef.current.campfire = fireGain;

    const fireBuffer = ctx.createBuffer(1, bufferLength, sampleRate);
    const fireData = fireBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferLength; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise base
      lastOut = (lastOut + 0.02 * white) / 1.02;
      // Random crackle clicks (1 in every 800 samples)
      const isCrackle = Math.random() < 0.0012;
      const crackle = isCrackle ? (Math.random() > 0.5 ? 0.8 : -0.8) : 0;
      fireData[i] = lastOut * 1.5 + crackle;
    }
    const fireSource = ctx.createBufferSource();
    fireSource.buffer = fireBuffer;
    fireSource.loop = true;
    const fireFilter = ctx.createBiquadFilter();
    fireFilter.type = 'lowpass';
    fireFilter.frequency.setValueAtTime(900, ctx.currentTime);
    fireSource.connect(fireFilter);
    fireFilter.connect(fireGain);
    fireSource.start();

    // 3. OCEAN WAVES SYNTHESIS (Filtered noise modulated by a gentle LFO ~0.11Hz)
    const oceanGain = ctx.createGain();
    oceanGain.gain.setValueAtTime((volumes.ocean / 100) * 0.75, ctx.currentTime);
    oceanGain.connect(master);
    channelGainsRef.current.ocean = oceanGain;

    const oceanBuffer = ctx.createBuffer(1, bufferLength, sampleRate);
    const oceanData = oceanBuffer.getChannelData(0);
    let oceanLast = 0.0;
    for (let i = 0; i < bufferLength; i++) {
      const white = Math.random() * 2 - 1;
      oceanLast = (oceanLast + 0.03 * white) / 1.03;
      oceanData[i] = oceanLast * 2.2;
    }
    const oceanSource = ctx.createBufferSource();
    oceanSource.buffer = oceanBuffer;
    oceanSource.loop = true;

    const oceanFilter = ctx.createBiquadFilter();
    oceanFilter.type = 'lowpass';
    oceanFilter.frequency.setValueAtTime(450, ctx.currentTime);

    // LFO to swell wave cutoff & volume
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // ~8.3s cycle
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(280, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(oceanFilter.frequency);
    lfo.start();

    oceanSource.connect(oceanFilter);
    oceanFilter.connect(oceanGain);
    oceanSource.start();

    // 4. DEEP BROWN NOISE SYNTHESIS (1/f^2 smooth lowpass rumble)
    const brownGain = ctx.createGain();
    brownGain.gain.setValueAtTime((volumes.brownNoise / 100) * 0.9, ctx.currentTime);
    brownGain.connect(master);
    channelGainsRef.current.brownNoise = brownGain;

    const brownBuffer = ctx.createBuffer(1, bufferLength, sampleRate);
    const brownData = brownBuffer.getChannelData(0);
    let brownVal = 0.0;
    for (let i = 0; i < bufferLength; i++) {
      const white = Math.random() * 2 - 1;
      brownVal = (brownVal + 0.02 * white) / 1.02;
      brownData[i] = brownVal * 3.5;
    }
    const brownSource = ctx.createBufferSource();
    brownSource.buffer = brownBuffer;
    brownSource.loop = true;
    const brownFilter = ctx.createBiquadFilter();
    brownFilter.type = 'lowpass';
    brownFilter.frequency.setValueAtTime(220, ctx.currentTime);
    brownSource.connect(brownFilter);
    brownFilter.connect(brownGain);
    brownSource.start();

    // 5. NIGHT FOREST / BIRDS SYNTHESIS (Wind murmur + subtle crickets)
    const forestGain = ctx.createGain();
    forestGain.gain.setValueAtTime((volumes.forest / 100) * 0.7, ctx.currentTime);
    forestGain.connect(master);
    channelGainsRef.current.forest = forestGain;

    const forestBuffer = ctx.createBuffer(1, bufferLength, sampleRate);
    const forestData = forestBuffer.getChannelData(0);
    for (let i = 0; i < bufferLength; i++) {
      // Wind base
      const wind = (Math.random() * 2 - 1) * 0.12;
      // High frequency cricket chirp modulation (4.8kHz ring)
      const t = i / sampleRate;
      const cricketEnvelope = Math.sin(t * Math.PI * 4) > 0.85 ? 0.08 : 0;
      const chirp = Math.sin(2 * Math.PI * 4600 * t) * cricketEnvelope;
      forestData[i] = wind + chirp;
    }
    const forestSource = ctx.createBufferSource();
    forestSource.buffer = forestBuffer;
    forestSource.loop = true;
    forestSource.connect(forestGain);
    forestSource.start();

    isInitializedRef.current = true;
    return ctx;
  }, [volumes, isMasterMuted]);

  // Update volume for a specific channel
  const setChannelVolume = useCallback(
    (id: AmbientSoundId, newVolume: number) => {
      const clamped = Math.max(0, Math.min(100, newVolume));
      setVolumes((prev) => {
        const next = { ...prev, [id]: clamped };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });

      // Lazy initialize audio engine when user adjusts any sound
      ensureAudioContext();

      // Update Web Audio node smoothly
      const gainNode = channelGainsRef.current[id];
      const ctx = audioCtxRef.current;
      if (gainNode && ctx) {
        gainNode.gain.cancelScheduledValues(ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime((clamped / 100) * 0.8, ctx.currentTime + 0.05);
      }
    },
    [ensureAudioContext]
  );

  // Toggle master mute
  const toggleMasterMute = useCallback(() => {
    setIsMasterMuted((prev) => {
      const next = !prev;
      const ctx = audioCtxRef.current;
      const master = masterGainRef.current;
      if (master && ctx) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(next ? 0 : 1, ctx.currentTime + 0.08);
      }
      return next;
    });
  }, []);

  // Stop all sounds
  const stopAll = useCallback(() => {
    setVolumes({
      train: 0,
      rain: 0,
      cafe: 0,
      brownNoise: 0,
      campfire: 0,
      ocean: 0,
      forest: 0,
    });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}

    const ctx = audioCtxRef.current;
    if (ctx) {
      Object.values(channelGainsRef.current).forEach((gain) => {
        if (gain) {
          gain.gain.cancelScheduledValues(ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
        }
      });
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const hasAnyActiveSound = Object.values(volumes).some((v) => v > 0) && !isMasterMuted;

  return {
    volumes,
    isMasterMuted,
    hasAnyActiveSound,
    setChannelVolume,
    toggleMasterMute,
    stopAll,
  };
}
