document.addEventListener('DOMContentLoaded', async () => {
    // Parse URL params passed from properties.js
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id');

    const prop = await getPropertyById(propertyId);
    if (!prop) {
        document.getElementById('prop-title').textContent = "Property Not Found";
        return;
    }

    const dest = await getDestinationById(prop.destinationId);
    const destination = dest ? dest.name : 'Unknown Destination';

    const basePrice = prop.basePrice;
    const title = prop.title;

    // Populate data
    document.getElementById('prop-title').textContent = prop.title;
    document.getElementById('prop-dest').textContent = destination;
    document.getElementById('prop-rating').textContent = prop.rating;
    document.getElementById('prop-about-text').innerHTML = prop.aboutText.replace(/\n/g, '<br>');

    // Amenities
    const amenitiesList = document.getElementById('prop-amenities-list');
    amenitiesList.innerHTML = '';
    if (prop.amenities) {
        prop.amenities.forEach(amenity => {
            amenitiesList.innerHTML += `
                <li>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ${amenity}
                </li>
            `;
        });
    }

    // Images
    const galleryImages = prop.images && prop.images.length > 0 ? prop.images : ['https://picsum.photos/seed/placeholder/800/600'];
    document.getElementById('main-img').src = galleryImages[0];
    if (galleryImages[1]) document.getElementById('sub-img-1').src = galleryImages[1];
    if (galleryImages[2]) document.getElementById('sub-img-2').src = galleryImages[2];

    // Packages setup
    const packagesContainer = document.getElementById('packages-container');
    packagesContainer.innerHTML = '';
    if (prop.packages) {
        const pkgKeys = ['affordable', 'value', 'luxury'];
        pkgKeys.forEach((key, idx) => {
            const pkg = prop.packages[key];
            if (!pkg) return;

            const featuresHTML = pkg.features.map(f => `<li>${f}</li>`).join('');
            const isSelected = idx === 0 ? 'selected' : '';

            packagesContainer.innerHTML += `
                <div class="package-card ${isSelected}" data-multiplier="${pkg.multiplier}" data-name="${pkg.name}">
                    <div class="pkg-header">
                        <span class="pkg-title">${pkg.name}</span>
                        <span class="pkg-price" id="price-${key}"></span>
                    </div>
                    <p class="pkg-desc">${pkg.desc}</p>
                    <ul class="pkg-features">${featuresHTML}</ul>
                </div>
            `;
        });
    }

    // Modal gallery logic
    const modal = document.getElementById('gallery-modal');
    const modalTrack = document.getElementById('modal-track');

    // Populate modal track
    galleryImages.forEach(imgSrc => {
        const wrap = document.createElement('div');
        wrap.className = 'modal-img-wrapper';
        wrap.innerHTML = `<img src="${imgSrc}" loading="lazy">`;
        modalTrack.appendChild(wrap);
    });

    document.getElementById('show-gallery-btn').addEventListener('click', () => {
        modal.classList.add('active');
    });

    document.getElementById('close-modal').addEventListener('click', () => {
        modal.classList.remove('active');
    });

    // Configure Go Back button to retain the destination state
    const backBtn = document.getElementById('back-btn');
    backBtn.href = `properties.html?destination=${encodeURIComponent(prop.destinationId)}`;

    // Currency Conversion & Package Logic
    const currencySelect = document.getElementById('currency-select');
    const displayPrice = document.getElementById('display-price');
    const packageCards = document.querySelectorAll('.package-card');

    function updatePrice() {
        const selectedOption = currencySelect.options[currencySelect.selectedIndex];
        const rate = parseFloat(selectedOption.getAttribute('data-rate'));
        const sym = selectedOption.getAttribute('data-sym');

        const convertedBase = basePrice * rate;

        // Update Base Price Display (Header)
        const selectedPackageCard = document.querySelector('.package-card.selected');
        let currentMultiplier = 1;
        if (selectedPackageCard) {
            currentMultiplier = parseFloat(selectedPackageCard.getAttribute('data-multiplier'));
        }
        const currentTotal = Math.round(convertedBase * currentMultiplier);
        displayPrice.textContent = `${sym}${currentTotal.toLocaleString()}`;

        // Update Package Cards Display
        if (prop.packages) {
            if (prop.packages.affordable && document.getElementById('price-affordable')) {
                document.getElementById('price-affordable').textContent = `${sym}${Math.round(convertedBase * prop.packages.affordable.multiplier).toLocaleString()}`;
            }
            if (prop.packages.value && document.getElementById('price-value')) {
                document.getElementById('price-value').textContent = `${sym}${Math.round(convertedBase * prop.packages.value.multiplier).toLocaleString()}`;
            }
            if (prop.packages.luxury && document.getElementById('price-luxury')) {
                document.getElementById('price-luxury').textContent = `${sym}${Math.round(convertedBase * prop.packages.luxury.multiplier).toLocaleString()}`;
            }
        }
    }

    // Initial price set
    updatePrice();
    currencySelect.addEventListener('change', updatePrice);

    // Package Selection Logic
    packageCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove selected class from all
            packageCards.forEach(c => c.classList.remove('selected'));
            // Add to clicked
            card.classList.add('selected');
            // Recalculate main display price based on multiplier
            updatePrice();
        });
    });

    // Force Google Translate to re-sweep the page now that dynamic content is loaded
    if (window.retranslatePage) window.retranslatePage();


    // Validations & Setup
    const checkinInput = document.getElementById('res-checkin');
    const checkoutInput = document.getElementById('res-checkout');

    // Set min date for checkin to today
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    checkinInput.setAttribute('min', todayStr);

    checkinInput.addEventListener('change', () => {
        if (checkinInput.value) {
            const checkinDate = new Date(checkinInput.value);
            checkinDate.setDate(checkinDate.getDate() + 1);
            const nextDayStr = checkinDate.toISOString().split('T')[0];
            checkoutInput.setAttribute('min', nextDayStr);

            // If current checkout is before new min, clear it
            if (checkoutInput.value && checkoutInput.value < nextDayStr) {
                checkoutInput.value = '';
            }
        } else {
            checkoutInput.removeAttribute('min');
        }
    });



    const phoneInput = document.getElementById('res-phone');

    // Initialize intl-tel-input
    const iti = window.intlTelInput(phoneInput, {
        utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@19.2.16/build/js/utils.js",
        initialCountry: "auto",
        geoIpLookup: function (callback) {
            fetch("https://ipapi.co/json")
                .then(res => res.json())
                .then(data => callback(data.country_code))
                .catch(() => callback("us"));
        },
        separateDialCode: true,
    });

    // Reservation Handlers
    const waBtn = document.getElementById('wa-btn');

    function getFormData() {
        const name = document.getElementById('res-name').value;
        const email = document.getElementById('res-email').value;
        const checkin = document.getElementById('res-checkin').value;
        const checkout = document.getElementById('res-checkout').value;

        if (!name || !email || !checkin || !checkout) {
            alert("Please fill in all reservation details, including dates.");
            return null;
        }

        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Please enter a valid email address.");
            return null;
        }

        if (!iti.isValidNumber()) {
            alert("Please enter a valid contact number with the correct country code.");
            return null;
        }

        const fullPhoneStr = iti.getNumber();

        const selectedPackage = document.querySelector('.package-card.selected');
        const packageName = selectedPackage.getAttribute('data-name');
        const packageMultiplier = parseFloat(selectedPackage.getAttribute('data-multiplier'));

        // Calculate final USD price for the payload
        const finalUSDPrice = Math.round(basePrice * packageMultiplier);

        const msg = `New Reservation Request:\n\nProperty: ${title} in ${destination}\nPackage Selected: ${packageName}\nName: ${name}\nEmail: ${email}\nPhone: ${fullPhoneStr}\nCheck-in: ${checkin}\nCheck-out: ${checkout}\nBase Price: $${finalUSDPrice}/night`;
        return encodeURIComponent(msg);
    }

    // The Admin contact numbers/emails would typically be loaded securely via backend, 
    // but we use hardcoded XYZ agency contacts for this static front-end.
    const adminWaNumber = window.APP_CONFIG.ADMIN_WHATSAPP_NUMBER;

    waBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const payload = getFormData();
        if (payload) {
            window.open(`https://wa.me/${adminWaNumber}?text=${payload}`, '_blank');
        }
    });
});
