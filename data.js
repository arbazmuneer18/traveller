// data.js - Persistent Data Layer (Migrated to MongoDB Backend)

const API_BASE_URL = window.APP_CONFIG.API_BASE_URL;

/**
 * Seeds initial database data if empty. 
 * This is usually called once from the Admin Panel's Reset function.
 */
async function initDatabase() {
    const destinations = await getDestinations();
    const properties = await getProperties();

    if (destinations.length === 0) {
        console.log("Seeding Destinations...");
        const initialDestinations = [
            { id: 'dest-victoria-falls', name: 'Victoria Falls', imagePath: 'https://upload.wikimedia.org/wikipedia/commons/d/da/Cataratas_Victoria%2C_Zambia-Zimbabue%2C_2018-07-27%2C_DD_04.jpg', description: 'Africa - The Smoke That Thunders' },
            { id: 'dest-kyoto', name: 'Kyoto, Japan', imagePath: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Kinkaku-ji_2010.jpg', description: 'Asia - Imperial elegance' },
            { id: 'dest-santorini', name: 'Santorini', imagePath: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Oia_Santorini_Greece_2.jpg', description: 'Europe - White-washed caldera' }
        ];

        for (const dest of initialDestinations) {
            await saveDestination(dest);
        }
    }

    if (properties.length === 0) {
        console.log("Seeding Properties...");
        const initialProperties = [
            {
                id: 'prop-1',
                destinationId: 'dest-kyoto',
                title: 'Private Imperial Lodge',
                propertyType: 'Villa',
                basePrice: 14465,
                rating: 5.0,
                aboutText: "Designed for the ultimate connoisseur of travel, this extraordinary property offers an unparalleled blend of architectural brilliance and natural beauty.",
                images: ["https://images.unsplash.com/photo-1542718610-a1d656d1884c?q=80&w=2070&auto=format&fit=crop"],
                amenities: ["Dedicated 24/7 Butler", "Private Infinity Pool"],
                packages: {
                    affordable: { name: "Affordable", multiplier: 1, desc: "Standard suite", features: ["Housekeeping"] },
                    value: { name: "Value for Money", multiplier: 1.4, desc: "Upgraded view", features: ["Full Board"] },
                    luxury: { name: "Luxury", multiplier: 2.2, desc: "Signature suite", features: ["Butler Service"] }
                }
            }
        ];

        for (const prop of initialProperties) {
            await saveProperty(prop);
        }
    }
}

// --- SWR Client-Side Cache ---
// Stale data is returned instantly from localStorage; fresh data is fetched
// in the background and the UI is updated when it arrives.
const SWR_TTL = 5 * 60 * 1000; // 5 minutes

function swrGet(key) {
    try {
        const raw = localStorage.getItem(`swr:${key}`);
        if (!raw) return null;
        const entry = JSON.parse(raw);
        if (Date.now() > entry.expiresAt) { localStorage.removeItem(`swr:${key}`); return null; }
        return entry.data;
    } catch { return null; }
}

function swrSet(key, data) {
    try {
        localStorage.setItem(`swr:${key}`, JSON.stringify({ data, expiresAt: Date.now() + SWR_TTL }));
    } catch { /* storage full - silently skip */ }
}

function swrInvalidate(prefix) {
    for (const k of Object.keys(localStorage)) {
        if (k.startsWith(`swr:${prefix}`)) localStorage.removeItem(k);
    }
}

// --- CRUD OPERATIONS: DESTINATIONS ---

async function getDestinations() {
    const key = 'destinations:all';
    const stale = swrGet(key);
    
    // Background refresh
    const fresh = fetch(`${API_BASE_URL}/destinations`)
        .then(r => r.json())
        .then(data => { swrSet(key, data); return data; })
        .catch(() => null);

    // Return stale instantly, or wait for fresh if nothing is cached
    return stale ?? await fresh;
}

async function getDestinationById(id) {
    const key = `destinations:${id}`;
    const stale = swrGet(key);

    const fresh = fetch(`${API_BASE_URL}/destinations/${id}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) swrSet(key, data); return data; })
        .catch(() => null);

    return stale ?? await fresh;
}


async function saveDestination(dest) {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/destinations`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dest)
        });
        return await response.json();
        swrInvalidate('destinations:');
    } catch (err) {
        console.error("Error saving destination:", err);
    }
}

async function deleteDestination(id) {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/destinations/${id}`, {
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${token}`
            }
        });
        return await response.json();
        swrInvalidate('destinations:');
    } catch (err) {
        console.error(`Error deleting destination ${id}:`, err);
    }
}

// --- CRUD OPERATIONS: PROPERTIES ---

async function getProperties() {
    const key = 'properties:all';
    const stale = swrGet(key);
    const fresh = fetch(`${API_BASE_URL}/properties`)
        .then(r => r.json())
        .then(data => { swrSet(key, data); return data; })
        .catch(() => null);
    return stale ?? await fresh;
}

async function getPropertiesByDestination(destinationId) {
    const key = `properties:dest:${destinationId}`;
    const stale = swrGet(key);
    const fresh = fetch(`${API_BASE_URL}/properties/destination/${destinationId}`)
        .then(r => r.json())
        .then(data => { swrSet(key, data); return data; })
        .catch(() => []);
    return stale ?? await fresh;
}

async function getPropertyById(id) {
    const key = `properties:${id}`;
    const stale = swrGet(key);
    const fresh = fetch(`${API_BASE_URL}/properties/${id}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) swrSet(key, data); return data; })
        .catch(() => null);
    return stale ?? await fresh;
}

async function saveProperty(prop) {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/properties`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(prop)
        });
        const result = await response.json();
        swrInvalidate('properties:'); // Bust client-side cache
        return result;
    } catch (err) {
        console.error("Error saving property:", err);
    }
}

async function deleteProperty(id) {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();
        swrInvalidate('properties:'); // Bust client-side cache
        return result;
    } catch (err) {
        console.error(`Error deleting property ${id}:`, err);
    }
}

// Generate unique IDs for new records
function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
