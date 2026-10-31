import { useState, useEffect, useCallback } from 'react';
import { DemoSong } from '../types';
import { DEMO_SONGS } from '../data/demoSongs';

const QUEUE_STORAGE_KEY = 'ytmusic_apple_lyrics_queue';
const QUEUE_INDEX_STORAGE_KEY = 'ytmusic_apple_lyrics_queue_index';

export function useQueue() {
  const [queue, setQueue] = useState<DemoSong[]>(() => {
    try {
      const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEMO_SONGS;
  });

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(QUEUE_INDEX_STORAGE_KEY);
      if (saved !== null) {
        const idx = parseInt(saved, 10);
        if (!isNaN(idx) && idx >= 0) return idx;
      }
    } catch {}
    return 0;
  });

  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
      localStorage.setItem(QUEUE_INDEX_STORAGE_KEY, currentIndex.toString());
    } catch {}
  }, [queue, currentIndex]);

  const currentTrack: DemoSong | undefined = queue[currentIndex] || queue[0];

  const nextTrack = useCallback((): DemoSong | null => {
    if (queue.length === 0) return null;

    if (repeatMode === 'one') {
      return queue[currentIndex] || null;
    }

    let nextIdx = 0;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
      if (nextIdx === currentIndex && queue.length > 1) {
        nextIdx = (currentIndex + 1) % queue.length;
      }
    } else {
      if (currentIndex + 1 < queue.length) {
        nextIdx = currentIndex + 1;
      } else if (repeatMode === 'all') {
        nextIdx = 0;
      } else {
        // Reached end of queue with repeat off
        return null;
      }
    }

    setCurrentIndex(nextIdx);
    return queue[nextIdx] || null;
  }, [queue, currentIndex, isShuffle, repeatMode]);

  const prevTrack = useCallback((): DemoSong | null => {
    if (queue.length === 0) return null;

    let prevIdx = currentIndex - 1;
    if (prevIdx < 0) {
      prevIdx = repeatMode === 'all' ? queue.length - 1 : 0;
    }

    setCurrentIndex(prevIdx);
    return queue[prevIdx] || null;
  }, [queue, currentIndex, repeatMode]);

  const selectTrackByIndex = useCallback((index: number): DemoSong | null => {
    if (index >= 0 && index < queue.length) {
      setCurrentIndex(index);
      return queue[index];
    }
    return null;
  }, [queue]);

  const addToQueue = useCallback((song: DemoSong) => {
    setQueue((prev) => [...prev, song]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.length > 0 ? updated : DEMO_SONGS;
    });

    setCurrentIndex((prevIdx) => {
      if (index === prevIdx) {
        return Math.max(0, Math.min(prevIdx, queue.length - 2));
      } else if (index < prevIdx) {
        return Math.max(0, prevIdx - 1);
      }
      return prevIdx;
    });
  }, [queue.length]);

  const resetQueue = useCallback(() => {
    setQueue(DEMO_SONGS);
    setCurrentIndex(0);
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  return {
    queue,
    currentIndex,
    currentTrack,
    isShuffle,
    repeatMode,
    nextTrack,
    prevTrack,
    selectTrackByIndex,
    addToQueue,
    removeFromQueue,
    resetQueue,
    toggleShuffle,
    toggleRepeat,
    setQueue,
    setCurrentIndex,
  };
}
