document.addEventListener('DOMContentLoaded', () => {
    // Parallax effect for hero image
    const parallaxImg = document.querySelector('.parallax-img');

    window.addEventListener('scroll', () => {
        let scrollPosition = window.pageYOffset;
        if (parallaxImg && scrollPosition < window.innerHeight) {
            parallaxImg.style.transform = `translateY(${scrollPosition * 0.4}px)`;
        }
    });

    // Intersection Observer for fade-up animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Unobserve once animated
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-up');
    fadeElements.forEach(element => {
        observer.observe(element);
    });

    // Populate Contact Details from Config (Homepage only)
    const phoneEl = document.getElementById('config-phone');
    const emailEl = document.getElementById('config-email');
    const locationEl = document.getElementById('config-location');
    const instagramEl = document.getElementById('config-instagram');

    if (phoneEl && window.APP_CONFIG.CONTACT_PHONE) {
        phoneEl.textContent = window.APP_CONFIG.CONTACT_PHONE;
        phoneEl.href = window.APP_CONFIG.CONTACT_PHONE_LINK;
    }
    if (emailEl && window.APP_CONFIG.CONTACT_EMAIL) {
        emailEl.textContent = window.APP_CONFIG.CONTACT_EMAIL;
        emailEl.href = `mailto:${window.APP_CONFIG.CONTACT_EMAIL}`;
    }
    if (locationEl && window.APP_CONFIG.CONTACT_LOCATION) {
        locationEl.innerHTML = window.APP_CONFIG.CONTACT_LOCATION.replace(', ', ',<br>');
        locationEl.href = window.APP_CONFIG.CONTACT_LOCATION_LINK;
    }
    if (instagramEl && window.APP_CONFIG.CONTACT_INSTAGRAM) {
        instagramEl.textContent = window.APP_CONFIG.CONTACT_INSTAGRAM;
        instagramEl.href = window.APP_CONFIG.CONTACT_INSTAGRAM_LINK;
    }

    // Fetch and render configurable destinations
    const destinationsContainer = document.getElementById('destinations-grid-container');
    if (destinationsContainer) {
        let _cachedDestinations = [];

        window.renderDestinationCards = async function() {
            const lang = localStorage.getItem('xyz_lang') || 'en';
            destinationsContainer.innerHTML = '';

            for (let index = 0; index < _cachedDestinations.length; index++) {
                const dest = _cachedDestinations[index];
                const card = document.createElement('a');
                card.href = `properties.html?destination=${encodeURIComponent(dest.id)}`;
                card.className = 'destination-card fade-up';
                if (index < 3) card.style.transitionDelay = `${index * 0.1}s`;

                // Render card immediately with English text, then upgrade with translation
                card.innerHTML = `
                    <div class="card-img-wrapper">
                        <img src="${dest.imagePath}" alt="${dest.name}" loading="lazy">
                    </div>
                    <div class="card-content">
                        <h3 class="dest-name">${dest.name}</h3>
                        <p class="dest-desc">${dest.description}</p>
                    </div>
                `;
                destinationsContainer.appendChild(card);

                requestAnimationFrame(() => {
                    observer.observe(card);
                    const rect = card.getBoundingClientRect();
                    if (rect.top <= window.innerHeight && rect.bottom >= 0) {
                        setTimeout(() => card.classList.add('visible'), 50);
                    }
                });
            }
        };

        async function loadDestinations() {
            await initDatabase();
            _cachedDestinations = await getDestinations();
            window.renderDestinationCards();
        }
        loadDestinations();
    }

    // Fetch, filter, and render Google Reviews
    const reviewsContainer = document.getElementById('reviews-container');
    if (reviewsContainer) {
        const reviews = [
            {
                "author": "Sarah Jenkins",
                "rating": 5,
                "text": "The private jet charter to the Maldives was absolutely flawless. From the moment we boarded to the seamless transfer to our overwater bungalow, Aero handled everything with unparalleled attention to detail. Worth every penny.",
                "date": "2 weeks ago",
                "avatar": "https://ui-avatars.com/api/?name=Sarah+Jenkins&background=random"
            },
            {
                "author": "Michael Chen",
                "rating": 5,
                "text": "Unmatched service. The concierge team secured us last-minute reservations at a 3-Michelin star restaurant in Tokyo that had a 6-month waitlist. Truly a 'curated for the elite' experience. Will definitely book again.",
                "date": "1 month ago",
                "avatar": "https://ui-avatars.com/api/?name=Michael+Chen&background=random"
            },
            {
                "author": "David R",
                "rating": 3,
                "text": "Good trip overall but the flight.",
                "date": "2 months ago",
                "avatar": "https://ui-avatars.com/api/?name=David+R&background=random"
            },
            {
                "author": "Elena Rostova",
                "rating": 4,
                "text": "A magnificent stay in the Swiss Alps. The cabin was exactly as pictured, perhaps even more beautiful. The only slight hiccup was a delay in our ground transportation, but the Aero team resolved it quickly and professionally.",
                "date": "3 months ago",
                "avatar": "https://ui-avatars.com/api/?name=Elena+Rostova&background=random"
            },
            {
                "author": "James Harrington",
                "rating": 5,
                "text": "I've used many luxury travel agencies over the years, but Aero operates on another level entirely. Their access is genuine, and their discretion is absolute. Highly recommended for those who value their time.",
                "date": "6 months ago",
                "avatar": "https://ui-avatars.com/api/?name=James+Harrington&background=random"
            }
        ];

        // Filter: >= 4 stars AND text length > 20 characters
        const filteredReviews = reviews.filter(review => review.rating >= 4 && review.text.length > 20);

        filteredReviews.forEach((review, index) => {
            const card = document.createElement('div');
            card.className = 'review-card fade-up';

            if (index < 3) {
                card.style.transitionDelay = `${index * 0.1}s`;
            }

            // Generate star string
            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

            card.innerHTML = `
                <div class="review-header">
                    <img src="${review.avatar}" alt="${review.author}" class="review-avatar">
                    <div class="review-meta">
                        <h4>${review.author}</h4>
                        <div class="review-date">${review.date}</div>
                    </div>
                </div>
                <div class="review-stars">${stars}</div>
                <div class="review-text">"${review.text}"</div>
            `;

            reviewsContainer.appendChild(card);

            requestAnimationFrame(() => {
                observer.observe(card);

                // Fallback check if it's already in viewport on load
                const rect = card.getBoundingClientRect();
                if (rect.top <= window.innerHeight && rect.bottom >= 0) {
                    setTimeout(() => card.classList.add('visible'), 50);
                }
            });
        });
    }

    // Contact button toggle
    const contactBtn = document.getElementById('contact-btn');
    const contactDetails = document.getElementById('contact-details');

    if (contactBtn && contactDetails) {
        contactBtn.addEventListener('click', (e) => {
            e.preventDefault();
            contactBtn.classList.toggle('active');

            if (contactDetails.classList.contains('hidden')) {
                contactDetails.classList.remove('hidden');
                // Trigger reflow for transition
                void contactDetails.offsetWidth;
                contactDetails.classList.add('visible');
            } else {
                contactDetails.classList.remove('visible');
                // Wait for transition before hiding
                setTimeout(() => {
                    contactDetails.classList.add('hidden');
                }, 400); // Should match CSS transition duration
            }
        });
    }


    // Initial check for elements in viewport on load
    setTimeout(() => {
        fadeElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
                element.classList.add('visible');
            }
        });
    }, 100);

    // ===== Admin Login Modal =====
    const adminLink = document.getElementById('admin-link');
    const loginModal = document.getElementById('login-modal');
    const closeLogin = document.getElementById('close-login');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    if (adminLink && loginModal) {
        const openModal = () => {
            loginModal.classList.remove('hidden');
            requestAnimationFrame(() => loginModal.classList.add('visible'));
            document.body.style.overflow = 'hidden';
        };

        const closeModal = () => {
            loginModal.classList.remove('visible');
            setTimeout(() => {
                loginModal.classList.add('hidden');
                document.body.style.overflow = '';
                if (loginForm) loginForm.reset();
                if (loginError) loginError.classList.add('hidden');
            }, 350);
        };

        adminLink.addEventListener('click', e => { e.preventDefault(); openModal(); });
        closeLogin.addEventListener('click', closeModal);
        loginModal.addEventListener('click', e => { if (e.target === loginModal) closeModal(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && loginModal.classList.contains('visible')) closeModal(); });

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = loginForm.querySelector('button');
                const user = document.getElementById('admin-username').value;
                const pass = document.getElementById('admin-password').value;
                
                btn.textContent = 'Authenticating...';
                btn.style.opacity = '0.7';
                loginError.classList.add('hidden');

                try {
                    const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: user, password: pass })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        // Store the secure JWT token
                        localStorage.setItem('adminToken', data.token);
                        window.location.href = 'admin.html';
                    } else {
                        loginError.textContent = data.message || 'Invalid credentials.';
                        loginError.classList.remove('hidden');
                        document.getElementById('admin-password').value = '';
                        btn.textContent = 'Sign In';
                        btn.style.opacity = '1';
                    }
                } catch (error) {
                    loginError.textContent = 'Auth server unreachable. Check API URL.';
                    loginError.classList.remove('hidden');
                    btn.textContent = 'Sign In';
                    btn.style.opacity = '1';
                }
            });
        }
    }
});
