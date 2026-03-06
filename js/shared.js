document.addEventListener('DOMContentLoaded', () => {

    const photoWrapper = document.getElementById('photo-wrapper');
    const identityText = document.getElementById('identity-text');
    const header = document.querySelector('.fixed-header');
    const navLinks = document.querySelector('.nav-links');
    const stickyHeadings = document.querySelectorAll('.sticky-title, .sticky-hero');

    // --- STICKY SLAB GRADIENT LOGIC (all pages) ---
    const updateStickyHeaders = () => {
        const triggerPoint = 80;
        const fadeRange = 150;
        stickyHeadings.forEach(heading => {
            const top = heading.getBoundingClientRect().top;
            let stuckProgress = 0;
            if (top <= triggerPoint) {
                stuckProgress = 1;
            } else if (top < triggerPoint + fadeRange) {
                stuckProgress = 1 - ((top - triggerPoint) / fadeRange);
            }
            const alpha = stuckProgress * 0.7;
            const blurVal = stuckProgress * 20;
            const shadowAlpha = stuckProgress * 0.08;
            const borderAlpha = stuckProgress * 0.1;
            heading.style.backgroundColor = `rgba(255, 255, 255, ${alpha})`;
            heading.style.backdropFilter = `blur(${blurVal}px)`;
            heading.style.webkitBackdropFilter = `blur(${blurVal}px)`;
            heading.style.borderBottom = `1px solid rgba(0, 0, 0, ${borderAlpha})`;
            if (!heading.classList.contains('sticky-hero')) {
                heading.style.boxShadow = `0 10px 20px -5px rgba(0, 0, 0, ${shadowAlpha})`;
            }
            if (stuckProgress > 0.8) {
                heading.classList.add('is-stuck');
            } else {
                heading.classList.remove('is-stuck');
            }
        });
    };

    if (photoWrapper) {
        // === HOME PAGE: full photo animation ===
        const maxScroll = 400;
        const isMobile = window.innerWidth < 768;
        const startSize = isMobile ? 180 : 300;
        const endSize = isMobile ? 40 : 50;
        const startPhotoY = isMobile ? 140 : 220;
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
            header.style.backdropFilter = `blur(${progress * 12}px)`;
            header.style.webkitBackdropFilter = `blur(${progress * 12}px)`;
            navLinks.style.opacity = progress;
            navLinks.style.pointerEvents = progress > 0.5 ? 'auto' : 'none';
            if (progress > 0.8) {
                identityText.classList.add('visible');
            } else {
                identityText.classList.remove('visible');
            }
            updateStickyHeaders();
        };

        window.addEventListener('scroll', updateUI);
        window.addEventListener('resize', () => {
            if (Math.abs(window.innerWidth - (window.lastWidth || window.innerWidth)) > 50) {
                location.reload();
            }
            window.lastWidth = window.innerWidth;
        });

        recalculatePositions();

    } else {
        // === INNER PAGES: show header fully immediately, no photo animation ===
        header.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        header.style.borderBottom = '1px solid rgba(0, 0, 0, 0.08)';
        header.style.backdropFilter = 'blur(12px)';
        header.style.webkitBackdropFilter = 'blur(12px)';
        navLinks.style.opacity = '1';
        navLinks.style.pointerEvents = 'auto';
        identityText.classList.add('visible');
        window.addEventListener('scroll', updateStickyHeaders);
    }

    // --- REVEAL ANIMATIONS (all pages) ---
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.15 });
    revealElements.forEach(el => revealObserver.observe(el));

    initBokeh();

    // --- Active nav link highlighting ---
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.getAttribute('href') === currentFile) {
            link.classList.add('active');
        }
    });
});

function initBokeh() {
    const canvas = document.getElementById('bokeh-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    let circles = [];

    const isMobile = window.innerWidth < 768;
    const circleCount = isMobile ? 8 : 15;

    const colors = [
        'rgba(45, 140, 255, 0.3)',
        'rgba(180, 100, 255, 0.25)',
        'rgba(100, 200, 200, 0.3)',
        'rgba(255, 150, 150, 0.2)'
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
            this.radius = Math.random() * 150 + 50;
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
            const visibleY = this.y - (scrollY * this.scrollFactor);
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

    function animate() {
        ctx.clearRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'multiply';
        circles.forEach(circle => {
            circle.update();
            circle.draw();
        });
        ctx.globalCompositeOperation = 'source-over';
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    animate();
}
