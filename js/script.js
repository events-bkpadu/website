(() => {
  const body = document.body;
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  const navLinks = nav ? nav.querySelectorAll('a') : [];
  const year = document.querySelector('[data-year]');
  const filterButtons = document.querySelectorAll('[data-filter]');
  const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
  const lightbox = document.querySelector('[data-lightbox]');
  const lightboxImage = document.querySelector('[data-lightbox-image]');
  const lightboxCaption = document.querySelector('[data-lightbox-caption]');
  const lightboxCloseButtons = document.querySelectorAll('[data-lightbox-close]');
  const previousButton = document.querySelector('[data-lightbox-prev]');
  const nextButton = document.querySelector('[data-lightbox-next]');
  let visibleItems = galleryItems.slice();
  let currentIndex = 0;
  let lastFocusedElement = null;

  if (year) year.textContent = new Date().getFullYear();

  const setMenu = (isOpen) => {
    if (!menuToggle || !nav) return;
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.querySelector('.sr-only').textContent = isOpen ? 'Close menu' : 'Open menu';
    nav.classList.toggle('is-open', isOpen);
    body.classList.toggle('menu-open', isOpen);
  };

  menuToggle?.addEventListener('click', () => {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });

  navLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));

  const updateGallery = (category) => {
    visibleItems = [];
    galleryItems.forEach((item) => {
      const isVisible = category === 'all' || item.dataset.category === category;
      item.hidden = !isVisible;
      if (isVisible) visibleItems.push(item);
    });
  };

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      filterButtons.forEach((filterButton) => {
        const isActive = filterButton === button;
        filterButton.classList.toggle('is-active', isActive);
        filterButton.setAttribute('aria-pressed', String(isActive));
      });
      updateGallery(button.dataset.filter);
    });
  });

  const renderLightbox = () => {
    const item = visibleItems[currentIndex];
    if (!item || !lightboxImage || !lightboxCaption) return;
    lightboxImage.src = item.dataset.image;
    lightboxImage.alt = item.querySelector('img').alt;
    lightboxCaption.textContent = `${item.dataset.caption} · Replace with a Srinivasa Tent House photograph`;
  };

  const openLightbox = (item) => {
    currentIndex = visibleItems.indexOf(item);
    lastFocusedElement = document.activeElement;
    renderLightbox();
    lightbox.hidden = false;
    body.classList.add('menu-open');
    document.querySelector('[data-lightbox-close]').focus();
  };

  const closeLightbox = () => {
    lightbox.hidden = true;
    body.classList.remove('menu-open');
    lightboxImage.removeAttribute('src');
    lastFocusedElement?.focus();
  };

  const moveLightbox = (direction) => {
    currentIndex = (currentIndex + direction + visibleItems.length) % visibleItems.length;
    renderLightbox();
  };

  galleryItems.forEach((item) => item.addEventListener('click', () => openLightbox(item)));
  lightboxCloseButtons.forEach((button) => button.addEventListener('click', closeLightbox));
  previousButton?.addEventListener('click', () => moveLightbox(-1));
  nextButton?.addEventListener('click', () => moveLightbox(1));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !lightbox.hidden) closeLightbox();
    if (event.key === 'ArrowLeft' && !lightbox.hidden) moveLightbox(-1);
    if (event.key === 'ArrowRight' && !lightbox.hidden) moveLightbox(1);
  });

  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries, revealObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealElements.forEach((element) => observer.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add('is-visible'));
  }
})();
