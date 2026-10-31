const DB_NAME = 'ytlyrics_wallpaper_db';
const STORE_NAME = 'wallpapers';
const PRIMARY_KEY = 'ytlyrics_active_wallpaper';
const LEGACY_KEY = 'custom_user_wallpaper';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves custom wallpaper image (Blob or File) to IndexedDB without localStorage size limitations.
 */
export async function saveCustomWallpaperToDB(data: Blob | File | string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(data, PRIMARY_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Loads custom wallpaper from IndexedDB. Returns object URL if Blob, or string.
 */
export async function getCustomWallpaperFromDB(): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(PRIMARY_KEY);
      req.onsuccess = () => {
        let res = req.result;
        if (!res) {
          // Check legacy key
          const legacyReq = store.get(LEGACY_KEY);
          legacyReq.onsuccess = () => {
            const legacyRes = legacyReq.result;
            if (!legacyRes) {
              resolve(null);
              return;
            }
            if (legacyRes instanceof Blob) {
              resolve(URL.createObjectURL(legacyRes));
            } else if (typeof legacyRes === 'string') {
              resolve(legacyRes);
            } else {
              resolve(null);
            }
          };
          legacyReq.onerror = () => resolve(null);
          return;
        }

        if (res instanceof Blob) {
          resolve(URL.createObjectURL(res));
        } else if (typeof res === 'string') {
          resolve(res);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[WallpaperDB] Could not load custom wallpaper:', err);
    return null;
  }
}

/**
 * Safely revokes previous object URLs to prevent browser memory leaks.
 */
export function revokeWallpaperUrl(url: string | null): void {
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch {}
  }
}

/**
 * Deletes custom wallpaper from IndexedDB.
 */
export async function deleteCustomWallpaperFromDB(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(PRIMARY_KEY);
      store.delete(LEGACY_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}
