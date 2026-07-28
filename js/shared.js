// Mobile layout applies at narrow widths OR short viewports (phone landscape).
// Must match the media query wrapping the mobile blocks in mobile.css /
// shared.css / home.css / pages.css / contact.css.
const MOBILE_MEDIA = '(max-width: 768px), (max-height: 500px)';

document.addEventListener('DOMContentLoaded', () => {

    const photoWrapper = document.getElementById('photo-wrapper');
    const identityText = document.getElementById('identity-text');
    const header = document.querySelector('.fixed-header');
    const navLinks = document.querySelector('.nav-links');
    const stickyHeadings = document.querySelectorAll('.sticky-title, .sticky-hero');
    const hamburgerBtn = document.getElementById('hamburger-btn');

    // --- HAMBURGER MENU TOGGLE (all pages, mobile only) ---
    // iOS Safari: overflow:hidden alone doesn't lock scroll. We use position:fixed
    // on the body (set by CSS .nav-open), saving/restoring scrollY via style.top.
    let _navScrollY = 0;

    // Focus trap handler — declared here so openNav/closeNav share the same reference.
    // Wraps Tab/Shift+Tab within the open nav overlay (WCAG 2.1.2).
    function _trapFocus(e) {
        if (e.key !== 'Tab') return;
        const links = [...navLinks.querySelectorAll('a')];
        if (!links.length) return;
        const first = links[0];
        const last  = links[links.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    function openNav() {
        _navScrollY = window.scrollY;
        document.body.style.top = `-${_navScrollY}px`;
        document.body.classList.add('nav-open');
        navLinks.classList.add('is-open');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
        hamburgerBtn.setAttribute('aria-label', 'Close navigation');
        const firstLink = navLinks.querySelector('a');
        if (firstLink) requestAnimationFrame(() => firstLink.focus());
        navLinks.addEventListener('keydown', _trapFocus);
    }

    function closeNav() {
        navLinks.removeEventListener('keydown', _trapFocus);
        document.body.classList.remove('nav-open');
        document.body.style.top = '';
        window.scrollTo(0, _navScrollY);
        navLinks.classList.remove('is-open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        hamburgerBtn.setAttribute('aria-label', 'Open navigation');
    }

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.getAttribute('aria-expanded') === 'true' ? closeNav() : openNav();
        });

        // Close nav when a nav link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeNav);
        });

        // Close nav when tapping outside the header/nav area — but ONLY while the
        // menu is actually open. Without this guard, closeNav() ran on every click
        // anywhere on the page, and its window.scrollTo(0, _navScrollY) (with
        // _navScrollY still 0) yanked the page back to the top — e.g. when opening
        // a "Show Abstract" toggle on the publications page.
        document.addEventListener('click', (e) => {
            if (hamburgerBtn.getAttribute('aria-expanded') === 'true' &&
                !hamburgerBtn.contains(e.target) && !navLinks.contains(e.target)) {
                closeNav();
            }
        });

        // Escape key closes menu and returns focus to the hamburger button
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && hamburgerBtn.getAttribute('aria-expanded') === 'true') {
                closeNav();
                hamburgerBtn.focus();
            }
        });
    }

    // --- STICKY SLAB GRADIENT LOGIC (all pages) ---
    // Read all rects first, then write all styles, to avoid layout thrash
    // (interleaved getBoundingClientRect + style writes force synchronous
    // layout on every iteration).
    const stickyState = new Array(stickyHeadings.length);
    const updateStickyHeaders = () => {
        const triggerPoint = 80;
        const fadeRange = 150;

        for (let i = 0; i < stickyHeadings.length; i++) {
            const top = stickyHeadings[i].getBoundingClientRect().top;
            let stuckProgress = 0;
            if (top <= triggerPoint) {
                stuckProgress = 1;
            } else if (top < triggerPoint + fadeRange) {
                stuckProgress = 1 - ((top - triggerPoint) / fadeRange);
            }
            stickyState[i] = stuckProgress;
        }

        for (let i = 0; i < stickyHeadings.length; i++) {
            const heading = stickyHeadings[i];
            const stuckProgress = stickyState[i];

            // Only backdropFilter must be driven by JS (CSS cannot animate blur to a
            // dynamic value). Background, border, and shadow live in .is-stuck (shared.css)
            // so they remain inspectable/overridable by CSS without !important fights.
            if (stuckProgress > 0) {
                const blurVal = stuckProgress * 20;
                heading.style.backdropFilter = `blur(${blurVal}px)`;
                heading.style.webkitBackdropFilter = `blur(${blurVal}px)`;
            } else {
                heading.style.backdropFilter = '';
                heading.style.webkitBackdropFilter = '';
            }

            if (stuckProgress > 0.8) {
                heading.classList.add('is-stuck');
            } else {
                heading.classList.remove('is-stuck');
            }
        }
    };

    // Coalesce scroll events into one update per animation frame. Without this,
    // high-refresh-rate displays (120Hz trackpads/displays) fire scroll events
    // faster than the browser can paint, doing redundant work each event.
    const rafThrottle = (fn) => {
        let ticking = false;
        return () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                ticking = false;
                fn();
            });
        };
    };

    // --- CROSS-BREAKPOINT RELOAD (all pages) ---
    // When the viewport crosses the 768px boundary (e.g. orientation change or
    // resizing a browser window), reload so JS and CSS enter the correct path.
    // Guarded to >50px change to avoid firing on iOS URL-bar height changes.
    (function registerWidthReload() {
        let lastWidth = window.innerWidth;
        window.addEventListener('resize', () => {
            if (Math.abs(window.innerWidth - lastWidth) > 50) {
                location.reload();
            }
            lastWidth = window.innerWidth;
        });

        // The width guard above misses height-only crossings of the short-viewport
        // breakpoint (e.g. shrinking a desktop window vertically past 500px).
        // Reload whenever the combined mobile media query flips. Safe against iOS
        // URL-bar churn: with width ≤ 768px the query is already true regardless
        // of height, so height changes can't flip it there.
        const mq = window.matchMedia(MOBILE_MEDIA);
        const onFlip = () => location.reload();
        if (mq.addEventListener) {
            mq.addEventListener('change', onFlip);
        } else if (mq.addListener) {
            mq.addListener(onFlip); // Safari < 14
        }
    })();

    if (photoWrapper) {
        // === HOME PAGE ===
        // Use matchMedia so that at exactly 768px, JS and CSS agree on which
        // breakpoint is active (window.innerWidth < 768 would miss 768px exactly,
        // while max-width: 768px in CSS includes it).
        const isMobile = window.matchMedia(MOBILE_MEDIA).matches;

        if (isMobile) {
            // === MOBILE HOME: static layout, no photo animation ===
            // photo-wrapper is hidden via CSS; mobile-hero shows profile photo.
            identityText.classList.add('visible');

            // Header fades in as user scrolls past the mobile hero section
            const mobileHero = document.getElementById('mobile-hero');
            const mobileHeroFadeEnd = () => (mobileHero ? mobileHero.offsetHeight * 0.55 : 200);

            const handleMobileHomeScroll = () => {
                const progress = Math.min(window.scrollY / mobileHeroFadeEnd(), 1);
                header.style.backgroundColor  = `rgba(250, 250, 250, ${progress * 0.95})`;
                // Blur goes on .fixed-header::before via --header-blur: backdrop-filter
                // directly on the header would turn it into the containing block for
                // the fixed-position mobile nav overlay (collapsing it to header size).
                header.style.setProperty('--header-blur', `${progress * 12}px`);
                header.style.borderBottom      = `1px solid rgba(0, 0, 0, ${progress * 0.07})`;
                updateStickyHeaders();
            };

            window.addEventListener('scroll', rafThrottle(handleMobileHomeScroll), { passive: true });
            handleMobileHomeScroll();

        } else {
            // === DESKTOP HOME: full photo animation ===
            const maxScroll = 400;
            const startSize = 300;
            const endSize = 50;
            const startPhotoY = 220;
            let startPhotoX = 0;

            const recalculatePositions = () => {
                photoWrapper.style.transform = '';
                photoWrapper.style.width = `${endSize}px`;
                const rect = photoWrapper.getBoundingClientRect();
                const originX = rect.left;
                const screenCenter = window.innerWidth / 2;
                const halfImage = startSize / 2;
                startPhotoX = (screenCenter - halfImage) - originX;
                updateUI();
            };

            const updateUI = () => {
                const scrollY = window.scrollY;
                let progress = Math.min(scrollY / maxScroll, 1);
                const currentSize = startSize - (progress * (startSize - endSize));
                const currentX = startPhotoX * (1 - progress);
                const currentY = startPhotoY * (1 - progress);
                photoWrapper.style.width = `${currentSize}px`;
                photoWrapper.style.height = `${currentSize}px`;
                photoWrapper.style.transform = `translate(${currentX}px, ${currentY}px)`;
                header.style.backgroundColor = `rgba(255, 255, 255, ${progress * 0.7})`;
                header.style.borderBottom = `1px solid rgba(0, 0, 0, ${progress * 0.05})`;
                header.style.setProperty('--header-blur', `${progress * 12}px`);

                navLinks.style.opacity = progress;

                if (progress > 0.8) {
                    identityText.classList.add('visible');
                } else {
                    identityText.classList.remove('visible');
                }

                updateStickyHeaders();
            };

            window.addEventListener('scroll', rafThrottle(updateUI), { passive: true });
            recalculatePositions();
        }

    } else {
        // === INNER PAGES: show header fully immediately, no photo animation ===
        const isMobile = window.matchMedia(MOBILE_MEDIA).matches;
        header.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        header.style.borderBottom = '1px solid rgba(0, 0, 0, 0.08)';
        header.style.setProperty('--header-blur', '12px');

        // Only set nav opacity via JS on desktop; mobile hamburger controls it
        if (!isMobile) {
            navLinks.style.opacity = '1';
            navLinks.style.pointerEvents = 'auto';
        }

        identityText.classList.add('visible');
        window.addEventListener('scroll', rafThrottle(updateStickyHeaders), { passive: true });
    }

    // --- REVEAL ANIMATIONS (all pages) ---
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.15 });
    revealElements.forEach(el => revealObserver.observe(el));

    // Defer the bokeh canvas until the browser is idle so it doesn't compete
    // with first paint and the initial scroll handler work — biggest win for
    // perceived smoothness on initial load.
    if ('requestIdleCallback' in window) {
        requestIdleCallback(initBokeh, { timeout: 1500 });
    } else {
        setTimeout(initBokeh, 200);
    }

    // --- Active nav link highlighting ---
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.getAttribute('href') === currentFile) {
            link.classList.add('active');
        }
    });
});

function initBokeh() {
    // Canvas is hidden on mobile via CSS; skip setup entirely to save CPU/battery
    if (window.matchMedia(MOBILE_MEDIA).matches) return;

    const canvas = document.getElementById('bokeh-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    let circles = [];
    let lastFrameTime = 0;

    const isMobile = window.matchMedia(MOBILE_MEDIA).matches;
    const circleCount = isMobile ? 12 : 15;
    // On mobile cap at ~30fps to conserve battery; 0 means uncapped on desktop
    const frameInterval = isMobile ? 1000 / 30 : 0;

    // Mobile uses softer opacity so smaller circles don't overpower the clean background
    const colors = isMobile ? [
        'rgba(37, 99, 235, 0.22)',
        'rgba(124, 58, 237, 0.16)',
        'rgba(16, 185, 129, 0.13)',
        'rgba(245, 158, 11, 0.10)'
    ] : [
        'rgba(37, 99, 235, 0.38)',    /* accent blue */
        'rgba(124, 58, 237, 0.28)',   /* violet */
        'rgba(16, 185, 129, 0.25)',   /* emerald */
        'rgba(245, 158, 11, 0.18)'    /* amber */
    ];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        createCircles();
    }

    class Circle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            // Smaller circles on mobile for a subtler, cleaner background effect
            this.radius = isMobile
                ? Math.random() * 55 + 20
                : Math.random() * 150 + 50;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.vx = (Math.random() - 0.5) * 0.2;
            this.vy = (Math.random() - 0.5) * 0.2;
            this.scrollFactor = (this.radius / 200) * 0.5;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < -200) this.x = width + 200;
            if (this.x > width + 200) this.x = -200;
            if (this.y < -200) this.y = height + 200;
            if (this.y > height + 200) this.y = -200;
        }

        draw() {
            const scrollY = window.scrollY;
            // On mobile: disable scroll parallax — it causes circles to jump
            // jarringly as users scroll. On desktop the subtle parallax adds depth.
            const visibleY = isMobile ? this.y : this.y - (scrollY * this.scrollFactor);
            ctx.beginPath();
            ctx.arc(this.x, visibleY, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    function createCircles() {
        circles = [];
        for (let i = 0; i < circleCount; i++) {
            circles.push(new Circle());
        }
    }

    function animate(timestamp) {
        requestAnimationFrame(animate);

        // Skip drawing when tab is hidden — saves battery
        if (document.hidden) return;

        // On mobile, skip frames to maintain ~30fps cap
        if (frameInterval > 0 && timestamp - lastFrameTime < frameInterval) return;
        lastFrameTime = timestamp;

        ctx.clearRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'multiply';
        circles.forEach(circle => {
            circle.update();
            circle.draw();
        });
        ctx.globalCompositeOperation = 'source-over';
    }

    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(animate);
}
