// cache.js - A lightweight in-memory TTL (Time To Live) cache
// Avoids hammering the database for the same data on every request.

const CACHE_TTL_MS = 60 * 1000; // 60 seconds

const store = new Map();

function get(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
    }
    return entry.value;
}

function set(key, value) {
    store.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function invalidate(pattern) {
    for (const key of store.keys()) {
        if (key.startsWith(pattern)) {
            store.delete(key);
        }
    }
}

module.exports = { get, set, invalidate };
