document.addEventListener('DOMContentLoaded', () => {
    
    // 1. --- Modal Logic ---
    const authModal = document.getElementById('auth-modal');
    const modalClose = document.getElementById('modal-close');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const modalIcon = document.getElementById('modal-icon');
    
    const showModal = (e) => {
        e.preventDefault();
        e.stopPropagation();

        // 🛡️ Context-Aware Content
        const isTrustFeature = e.currentTarget.getAttribute('data-feature') === 'trust';
        
        if (isTrustFeature) {
            modalTitle.innerText = 'Appoint Your Nominees';
            modalDesc.innerText = 'Stardust Vault helps you add important contacts who can access your legacy in case of emergency. Sign in now to designate yours.';
            modalIcon.setAttribute('data-lucide', 'users');
        } else {
            modalTitle.innerText = 'Secure Your Vault';
            modalDesc.innerText = 'Join Stardust today to start organizing your digital legacy.';
            modalIcon.setAttribute('data-lucide', 'lock');
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
        authModal.classList.add('active');
    };

    const hideModal = () => {
        authModal.classList.remove('active');
    };

    // Action Triggers
    document.querySelectorAll('.btn-primary, .btn-outline, .feature-card').forEach(el => {
        el.addEventListener('click', showModal);
    });

    const trustNavLink = document.querySelector('.nav-links a[data-feature="trust"]');
    if (trustNavLink) {
        trustNavLink.addEventListener('click', showModal);
    }

    if (modalClose) modalClose.addEventListener('click', hideModal);
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) hideModal();
        });
    }

    // 2. --- Smooth Scroll (Nav Links) ---
    document.querySelectorAll('.nav-links a[href^="#"]:not([data-feature="trust"])').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // 3. --- Scroll Reveal Animations ---
    const observeOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, observeOptions);

    document.querySelectorAll('.reveal, .reveal-blur').forEach(el => {
        revealObserver.observe(el);
    });

    // 4. --- Parallax Hero ---
    if (window.innerWidth > 768) {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            const heroText = document.querySelector('.hero-content');
            if (heroText && scrolled < 600) {
                heroText.style.transform = `translateY(${scrolled * 0.15}px)`;
                heroText.style.opacity = `${1 - (scrolled / 700)}`;
            }
        });
    }

    console.log('✨ Stardust Engine: Pure Edition Active');
});
