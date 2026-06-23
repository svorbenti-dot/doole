// Generischer IndexedDB-Wrapper. Dieses Modul kennt nur "Stores" (Tabellen)
// und "Items" (Datensätze) - es weiß nichts über Profile oder Tagesprotokolle.
// So bleibt es wiederverwendbar, falls in späteren Phasen neue Stores nötig sind.

const DB_NAME = "doole-db";
const DB_VERSION = 2;

let dbPromise = null;

// Öffnet die Datenbank (oder legt sie beim ersten Aufruf an) und gibt
// immer dieselbe Promise zurück, damit die DB nur einmal geöffnet wird.
export function openDatabase() {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("profiles")) {
        db.createObjectStore("profiles", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("dailyLogs")) {
        db.createObjectStore("dailyLogs", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

// Speichert ein Item (legt es an oder überschreibt ein vorhandenes mit
// demselben Key). Gibt bei Profilen das gespeicherte Item inkl. neuer id zurück.
export async function putItem(storeName, item) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => {
      resolve({ ...item, id: request.result });
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getItem(storeName, key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getAllItems(storeName) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function deleteItem(storeName, key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}
