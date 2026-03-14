// i18n.js — Language Switcher powered by Google Translate
// The GT widget handles all page text (static + dynamic) automatically.
// This file just manages the dropdown UI and RTL layout for Arabic.

const RTL_LANGS = ['ar'];

function googleTranslatePage(lang) {
    const currentLang = localStorage.getItem('xyz_lang') || 'en';
    if (currentLang === lang) {
        // Just close dropdown if clicking the active language
        const dropdown = document.getElementById('lang-dropdown');
        const container = document.querySelector('.nav-dropdown');
        if (dropdown) {
            dropdown.classList.remove('visible');
            setTimeout(() => { if (!dropdown.classList.contains('visible')) dropdown.classList.add('hidden'); }, 400);
        }
        if (container) container.classList.remove('active');
        return;
    }

    // Store our selection for RTL handling on page load
    localStorage.setItem('xyz_lang', lang);

    // Update trigger label
    const labelEl = document.getElementById('current-lang');
    if (labelEl) labelEl.textContent = lang.toUpperCase();

    // Highlight active dropdown item
    document.querySelectorAll('.dropdown-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Handle RTL for Arabic
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';

    // Close dropdown
    const dropdown = document.getElementById('lang-dropdown');
    const container = document.querySelector('.nav-dropdown');
    if (dropdown) {
        dropdown.classList.remove('visible');
        setTimeout(() => { dropdown.classList.add('hidden'); }, 400);
    }
    if (container) container.classList.remove('active');

    // Robust trigger using the URL hash technique
    // This entirely avoids local file cookie restrictions and brittle DOM dispatching
    if (lang === 'en') {
        window.location.hash = ''; // Clear translation
    } else {
        window.location.hash = `googtrans(en|${lang})`;
    }
    
    // Reload the page to let Google Translate read the hash during initialization
    window.location.reload();
}

function initLangSwitcher() {
    // Determine language by inspecting the hash
    let savedLang = localStorage.getItem('xyz_lang') || 'en';
    const hashMatches = window.location.hash.match(/googtrans\(en\|(.*?)\)/);
    if (hashMatches && hashMatches[1]) {
        savedLang = hashMatches[1];
        localStorage.setItem('xyz_lang', savedLang);
    } else if (savedLang !== 'en') {
        // If local storage has a lang but the hash is missing, append the hash and reload immediately
        window.location.hash = `googtrans(en|${savedLang})`;
        window.location.reload();
        return;
    }


    // Set RTL immediately
    document.documentElement.lang = savedLang;
    document.documentElement.dir = RTL_LANGS.includes(savedLang) ? 'rtl' : 'ltr';

    // Update label and active state
    const labelEl = document.getElementById('current-lang');
    if (labelEl) labelEl.textContent = savedLang.toUpperCase();
    document.querySelectorAll('.dropdown-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === savedLang);
    });

    // Dropdown toggle
    const trigger = document.getElementById('lang-trigger');
    const dropdown = document.getElementById('lang-dropdown');
    const container = document.querySelector('.nav-dropdown');

    if (trigger && dropdown && container) {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = dropdown.classList.contains('visible');
            if (isVisible) {
                dropdown.classList.remove('visible');
                setTimeout(() => { if (!dropdown.classList.contains('visible')) dropdown.classList.add('hidden'); }, 400);
                container.classList.remove('active');
            } else {
                dropdown.classList.remove('hidden');
                requestAnimationFrame(() => dropdown.classList.add('visible'));
                container.classList.add('active');
            }
        });

        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                dropdown.classList.remove('visible');
                setTimeout(() => { if (!dropdown.classList.contains('visible')) dropdown.classList.add('hidden'); }, 400);
                container.classList.remove('active');
            }
        });
    }
}

// Auto-initialize on all pages
document.addEventListener('DOMContentLoaded', () => {
    // Immediately hide the body if a translation is pending to prevent FOUT (Flash of Un-translated Text)
    const savedLang = localStorage.getItem('xyz_lang') || 'en';
    if (savedLang !== 'en') {
        document.body.classList.add('translate-hiding');
        // Failsafe: always show the body after 1.5 seconds in case GT fails to load
        setTimeout(() => document.body.classList.add('translate-visible'), 1500);
    }
    initLangSwitcher();
});

// Google Translate init callback (called by GT script)
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'ru,ar',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
    }, 'google_translate_element');

    // Remove the hiding class once GT has initialized and performed its first pass
    setTimeout(() => {
        document.body.classList.add('translate-visible');
    }, 400); // Give GT a moment to finish translating DOM nodes
}

window.googleTranslatePage = googleTranslatePage;
window.googleTranslateElementInit = googleTranslateElementInit;

// Global helper to force a re-translation sweep after async DOM updates
window.retranslatePage = function() {
    const savedLang = localStorage.getItem('xyz_lang') || 'en';
    if (savedLang === 'en') {
        document.body.classList.add('translate-visible');
        return;
    }
    
    // Slight delay to allow DOM to settle
    setTimeout(() => {
        const combo = document.querySelector('.goog-te-combo');
        if (combo && combo.options.length > 1) {
            combo.value = savedLang;
            combo.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        }
        
        // Ensure body is visible after async re-translation
        setTimeout(() => document.body.classList.add('translate-visible'), 100);
    }, 300);
};
