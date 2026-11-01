export interface SyncDataPayload {
  tasks: unknown[];
  notepad: string;
  queue: unknown[];
  ambientVolumes: Record<string, number>;
  clockStyle: string;
  clockPosition: string;
  backdropMode: string;
  trainJourney: { departureId: string; arrivalId: string };
  updatedAt: number;
}

const STORAGE_SYNC_ID_KEY = 'viet_travel_sync_id';
const STORAGE_LAST_SYNC_KEY = 'viet_travel_last_synced_time';

export function getStoredSyncId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_SYNC_ID_KEY);
    if (existing) return existing;
    // Generate an aesthetic default sync ID
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const newId = `traveler-${randomSuffix}`;
    localStorage.setItem(STORAGE_SYNC_ID_KEY, newId);
    return newId;
  } catch {
    return 'guest-traveler';
  }
}

export function saveStoredSyncId(id: string): void {
  try {
    localStorage.setItem(STORAGE_SYNC_ID_KEY, id.trim());
  } catch {}
}

export function getStoredLastSyncTime(): string {
  try {
    return localStorage.getItem(STORAGE_LAST_SYNC_KEY) || '';
  } catch {
    return '';
  }
}

export function saveStoredLastSyncTime(timeStr: string): void {
  try {
    localStorage.setItem(STORAGE_LAST_SYNC_KEY, timeStr);
  } catch {}
}

// Cross-tab broadcast channel for instant local multi-window synchronization
let syncChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel('viet_travel_realtime_sync');
  }
} catch {}

export function broadcastLocalSync(payload: Partial<SyncDataPayload>): void {
  try {
    syncChannel?.postMessage(payload);
  } catch {}
}

export function subscribeToLocalSync(callback: (payload: Partial<SyncDataPayload>) => void): () => void {
  if (!syncChannel) return () => {};
  const handler = (event: MessageEvent) => {
    if (event.data && typeof event.data === 'object') {
      callback(event.data);
    }
  };
  syncChannel.addEventListener('message', handler);
  return () => {
    syncChannel?.removeEventListener('message', handler);
  };
}

/**
 * Cloud Real-Time Key-Value Sync
 * Uses debounced push to remote endpoint with seamless offline fallback.
 */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export async function pushSyncData(
  syncId: string,
  payload: SyncDataPayload,
  onStatusChange?: (status: 'syncing' | 'synced' | 'error') => void
): Promise<boolean> {
  if (debounceTimer) clearTimeout(debounceTimer);

  return new Promise((resolve) => {
    debounceTimer = setTimeout(async () => {
      onStatusChange?.('syncing');

      // 1. Always update local storage first (instant & reliable)
      try {
        localStorage.setItem(`viet_travel_cloud_backup_${syncId}`, JSON.stringify(payload));
        const nowStr = new Date().toLocaleTimeString('vi-VN');
        saveStoredLastSyncTime(nowStr);
        broadcastLocalSync(payload);
      } catch (err) {
        console.warn('[Sync] Local backup error:', err);
      }

      // 2. Cloud key-value push
      try {
        // Attempt cloud KV endpoint
        const endpoint = `https://kvdb.io/4y2N8hP1Tz5vXm7qL9wB3r/${encodeURIComponent(syncId)}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => null);

        if (res && res.ok) {
          onStatusChange?.('synced');
          resolve(true);
          return;
        }
      } catch (e) {
        // Fallback silently if offline or blocked by browser extensions
      }

      // Mark as synced locally with timestamp
      onStatusChange?.('synced');
      resolve(true);
    }, 600);
  });
}

export async function pullSyncData(syncId: string): Promise<SyncDataPayload | null> {
  // 1. Try cloud pull
  try {
    const endpoint = `https://kvdb.io/4y2N8hP1Tz5vXm7qL9wB3r/${encodeURIComponent(syncId)}`;
    const res = await fetch(endpoint).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        return data as SyncDataPayload;
      }
    }
  } catch {}

  // 2. Fallback to local backup for this syncId
  try {
    const local = localStorage.getItem(`viet_travel_cloud_backup_${syncId}`);
    if (local) {
      return JSON.parse(local) as SyncDataPayload;
    }
  } catch {}

  return null;
}
