// IndexedDB layer, the browser equivalent of the app's DiskStorage (which
// keys cached days by languageCode|date). Days and fixed texts go to IDB;
// settings stay in localStorage via zustand persist.

const DB_NAME = 'ibreviary'
const DB_VERSION = 1

type StoreName = 'days' | 'fixed'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('days')) db.createObjectStore('days')
      if (!db.objectStoreNames.contains('fixed')) db.createObjectStore('fixed')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withStore<T>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await open()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode)
    const req = fn(tx.objectStore(store))
    req.onsuccess = () => resolve(req.result as T)
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}

export const dayKey = (lang: string, date: string) => `${lang}|${date}`

export async function putDay(lang: string, date: string, day: unknown): Promise<void> {
  await withStore('days', 'readwrite', (s) => s.put(day, dayKey(lang, date)))
}

export async function getDay<T>(lang: string, date: string): Promise<T | undefined> {
  try {
    return await withStore<T>('days', 'readonly', (s) => s.get(dayKey(lang, date)))
  } catch {
    return undefined
  }
}

export async function deleteDay(lang: string, date: string): Promise<void> {
  await withStore('days', 'readwrite', (s) => s.delete(dayKey(lang, date)))
}

export async function listDays(): Promise<{ key: IDBValidKey; lang: string; date: string }[]> {
  const keys = await withStore<IDBValidKey[]>('days', 'readonly', (s) => s.getAllKeys())
  return keys.map((key) => {
    const [lang, date] = String(key).split('|')
    return { key, lang, date }
  })
}

export async function clearDays(): Promise<void> {
  await withStore('days', 'readwrite', (s) => s.clear())
}

export async function putFixed(lang: string, data: unknown): Promise<void> {
  await withStore('fixed', 'readwrite', (s) => s.put(data, lang))
}

export async function getFixed<T>(lang: string): Promise<T | undefined> {
  try {
    return await withStore<T>('fixed', 'readonly', (s) => s.get(lang))
  } catch {
    return undefined
  }
}

export async function deleteFixed(lang: string): Promise<void> {
  await withStore('fixed', 'readwrite', (s) => s.delete(lang))
}

export async function listFixed(): Promise<string[]> {
  const keys = await withStore<IDBValidKey[]>('fixed', 'readonly', (s) => s.getAllKeys())
  return keys.map(String)
}
