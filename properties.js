document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const destinationId = urlParams.get('destination');

    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    const propertiesGrid = document.getElementById('properties-grid');
    const typeFilter = document.getElementById('type-filter');

    if (!destinationId) {
        pageTitle.textContent = "Destination Not Found";
        pageSubtitle.textContent = "Please return to the home page and select a valid destination.";
        return;
    }

    const destination = await getDestinationById(destinationId);
    if (!destination) {
        pageTitle.textContent = "Destination Not Found";
        pageSubtitle.textContent = "Please return to the home page and select a valid destination.";
        return;
    }

    pageTitle.textContent = `Properties in ${destination.name}`;
    pageSubtitle.textContent = `Discover exclusive luxury properties curated for your stay in ${destination.name}.`;

    let allProperties = await getPropertiesByDestination(destinationId);

    function renderProperties() {
        propertiesGrid.innerHTML = '';
        const selectedType = typeFilter ? typeFilter.value : 'All';

        const filtered = allProperties.filter(p => selectedType === 'All' || p.propertyType === selectedType);

        if (filtered.length === 0) {
            propertiesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; font-size: 1.1rem;">No properties found matching this criteria.</p>';
            return;
        }

        filtered.forEach((prop, index) => {
            const card = document.createElement('div');
            card.className = 'property-card fade-up';
            if (index <= 6) card.style.transitionDelay = `${index * 0.1}s`;

            const imageSrc = (prop.images && prop.images.length > 0) ? prop.images[0] : 'https://picsum.photos/seed/placeholder/800/600';

            card.innerHTML = `
                <a href="property-details.html?id=${encodeURIComponent(prop.id)}" class="property-link">
                    <img src="${imageSrc}" alt="${prop.title}" class="property-img" loading="lazy">
                    <div class="property-info">
                        <div class="property-title">${prop.title}</div>
                        <p style="font-size: 0.95rem; color: #666;">${prop.propertyType}</p>
                        <div class="property-meta">
                            <span class="property-price">$${prop.basePrice.toLocaleString()} / night</span>
                            <span class="property-rating">★ ${prop.rating}</span>
                        </div>
                    </div>
                </a>
            `;
            propertiesGrid.appendChild(card);
        });

        requestAnimationFrame(() => {
            setTimeout(() => {
                const cards = document.querySelectorAll('.property-card:not(.visible)');
                cards.forEach(card => card.classList.add('visible'));
                
                // Force Google Translate to sweep the newly added cards
                if (window.retranslatePage) window.retranslatePage();
            }, 50);
        });
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', renderProperties);
    }

    renderProperties();
});
