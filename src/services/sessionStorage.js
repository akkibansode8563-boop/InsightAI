const DB_NAME = 'InsightAI_DB';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

/**
 * Open or create the IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('agentId', 'agentId', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Save or update a session
 * @param {Object} session - Session object with id, agentId, messages, etc.
 */
export async function saveSession(session) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ ...session, updatedAt: Date.now() });
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Load all sessions sorted by most recently updated
 * @returns {Promise<Array>}
 */
export async function loadSessions() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).index('updatedAt').getAll();
    req.onsuccess = (e) => resolve([...e.target.result].reverse());
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Delete a session by ID
 * @param {string} id - Session ID
 */
export async function deleteSession(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Load all sessions for a specific agent
 * @param {string} agentId - Agent ID to filter by
 * @returns {Promise<Array>}
 */
export async function loadSessionsByAgent(agentId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).index('agentId').getAll(agentId);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Load a single session by ID
 * @param {string} id - Session ID
 * @returns {Promise<Object|undefined>}
 */
export async function loadSession(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Clear all sessions from the database
 * @returns {Promise<void>}
 */
export async function clearAllSessions() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Create a new empty session object
 * @param {string} agentId - Agent ID for this session
 * @param {string} agentName - Display name for the agent
 * @returns {Object} New session object
 */
export function createSession(agentId, agentName) {
  return {
    id: Date.now().toString(),
    agentId,
    agentName,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    preview: 'New conversation'
  };
}

/**
 * Update the preview text of a session based on its messages
 * @param {Object} session - Session to update
 * @returns {Object} Updated session with new preview
 */
export function updateSessionPreview(session) {
  const lastUserMsg = [...session.messages]
    .reverse()
    .find(m => m.role === 'user');
  const preview = lastUserMsg
    ? lastUserMsg.content.slice(0, 60) + (lastUserMsg.content.length > 60 ? '...' : '')
    : 'New conversation';
  return { ...session, preview };
}
