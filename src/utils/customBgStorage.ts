/**
 * Lightweight IndexedDB helper for user-uploaded custom GIF / image backgrounds.
 * Database: 'VietTravelTimerDB', Object Store: 'customBackgrounds'
 * Handles large GIF files (>5MB) safely without exceeding localStorage quotas.
 */

const DB_NAME = 'VietTravelTimerDB';
const DB_VERSION = 1;
const STORE_NAME = 'customBackgrounds';

export interface CustomBgItem {
  id: string;
  name: string;
  blob: Blob;
  createdAt: number;
  url?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves an uploaded Blob/File to IndexedDB.
 */
export async function saveCustomBgToDB(id: string, name: string, file: Blob | File): Promise<string> {
  const db = await openDB();
  const item: CustomBgItem = {
    id,
    name,
    blob: file,
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(item);
    req.onsuccess = () => {
      const objectUrl = URL.createObjectURL(file);
      resolve(objectUrl);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Loads all saved custom backgrounds from IndexedDB.
 * Returns items with valid Blob object URLs attached.
 */
export async function getAllCustomBgsFromDB(): Promise<Array<{ id: string; name: string; url: string; blob: Blob }>> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const records: CustomBgItem[] = req.result || [];
        const result = records.map((r) => ({
          id: r.id,
          name: r.name,
          blob: r.blob,
          url: URL.createObjectURL(r.blob),
        }));
        resolve(result);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[CustomBgDB] Failed to load custom backgrounds:', err);
    return [];
  }
}

/**
 * Deletes a custom background by ID from IndexedDB.
 */
export async function deleteCustomBgFromDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[CustomBgDB] Failed to delete custom background:', err);
  }
}
