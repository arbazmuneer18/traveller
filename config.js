// config.js - Centralized Configuration File
// This file stores all application-level configurations that might change per environment.
// In a true production setup, sensitive keys should ideally remain hidden behind an API,
// but for static frontend delivery, this file centralizes environment-specific variables.

const APP_CONFIG = {
    // API endpoint for fetching dynamically generated content from MongoDB
    API_BASE_URL: 'https://traveller-ka4b.onrender.com/api',

    // The WhatsApp number used to receive reservation requests via the chat payload
    ADMIN_WHATSAPP_NUMBER: '8150074722',

    // Contact Details
    CONTACT_PHONE: '+91 7892693578',
    CONTACT_PHONE_LINK: 'tel:+91 7892693578',
    CONTACT_EMAIL: 'advisors@arbaz.inc',
    CONTACT_LOCATION: 'Udupi, Karnataka, India',
    CONTACT_LOCATION_LINK: 'http://maps.apple.com/?daddr=One+Apple+Park+Way,+Cupertino,+CA',
    CONTACT_INSTAGRAM: '@arb4z.01',
    CONTACT_INSTAGRAM_LINK: 'https://www.instagram.com/arb4z.01/'
};

// Make config globally available to all scripts
window.APP_CONFIG = APP_CONFIG;
