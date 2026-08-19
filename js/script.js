(() => {
  const body = document.body;
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  const navLinks = nav ? nav.querySelectorAll('a') : [];
  const year = document.querySelector('[data-year]');
  const filterButtons = document.querySelectorAll('[data-filter]');
  const galleryGrid = document.querySelector('[data-gallery-grid]');
  const galleryPagination = document.querySelector('[data-gallery-pagination]');
  const lightbox = document.querySelector('[data-lightbox]');
  const lightboxImage = document.querySelector('[data-lightbox-image]');
  const lightboxCaption = document.querySelector('[data-lightbox-caption]');
  const lightboxCloseButtons = document.querySelectorAll('[data-lightbox-close]');
  const previousButton = document.querySelector('[data-lightbox-prev]');
  const nextButton = document.querySelector('[data-lightbox-next]');
  const themeToggle = document.querySelector('[data-theme-toggle]');
  let visibleItems = [];
  let currentIndex = 0;
  let lastFocusedElement = null;
  let activeCategory = 'all';
  let currentPage = 1;
  let galleryData = [];
  const itemsPerPage = 6;
  const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif'];

  const applyTheme = (theme) => {
    const nextTheme = theme === 'terracotta' ? 'terracotta' : 'forest';
    document.documentElement.dataset.theme = nextTheme === 'forest' ? '' : nextTheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', nextTheme === 'terracotta' ? '#33221f' : '#18251f');
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', String(nextTheme === 'terracotta'));
      themeToggle.querySelector('span:last-child').textContent = nextTheme === 'terracotta' ? 'Forest theme' : 'Warm theme';
      themeToggle.title = nextTheme === 'terracotta' ? 'Switch to forest theme' : 'Switch to warm theme';
    }
  };

  applyTheme(localStorage.getItem('srinivasa-theme') || 'forest');
  themeToggle?.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'terracotta' ? 'forest' : 'terracotta';
    localStorage.setItem('srinivasa-theme', nextTheme);
    applyTheme(nextTheme);
  });

  const setConfigText = (selector, value) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
    });
  };

  const applySiteConfig = () => {
    if (typeof SITE_CONFIG === 'undefined') return;
    setConfigText('[data-config-business]', SITE_CONFIG.businessName);
    setConfigText('[data-config-location]', SITE_CONFIG.location);
    setConfigText('[data-config-location-short]', SITE_CONFIG.location.split(',')[0]);
    setConfigText('[data-config-domain]', SITE_CONFIG.domain);
    setConfigText('[data-config-phone]', SITE_CONFIG.phone);
    setConfigText('[data-config-alternative]', SITE_CONFIG.alternativeNumber);
    setConfigText('[data-config-whatsapp]', SITE_CONFIG.whatsapp);
    setConfigText('[data-config-maps]', SITE_CONFIG.mapsLabel);
    document.querySelectorAll('[data-config-hero-image]').forEach((element) => {
      element.style.backgroundImage = `linear-gradient(180deg, var(--dark-image-overlay), var(--image-overlay)), url("${SITE_CONFIG.heroImage}")`;
      element.addEventListener('error', () => element.classList.add('image-missing'));
    });
    document.querySelectorAll('[data-contact-phone]').forEach((link) => {
      if (!SITE_CONFIG.phone.startsWith('[')) link.href = `tel:${SITE_CONFIG.phone}`;
    });
    document.querySelectorAll('[data-contact-alternative]').forEach((link) => {
      if (!SITE_CONFIG.alternativeNumber.startsWith('[')) link.href = `tel:${SITE_CONFIG.alternativeNumber}`;
    });
    document.querySelectorAll('[data-contact-whatsapp]').forEach((link) => {
      if (!SITE_CONFIG.whatsapp.startsWith('[')) link.href = `https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}`;
    });
    document.querySelectorAll('[data-contact-maps]').forEach((link) => {
      if (SITE_CONFIG.mapsUrl) link.href = SITE_CONFIG.mapsUrl;
    });
  };

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

  const getGalleryData = () => galleryData;

  const getDirectoryFiles = async (category) => {
    try {
      const response = await fetch(`${category.folder}/`);
      if (!response.ok) return [];
      const html = await response.text();
      const links = [...html.matchAll(/href=["']([^"']+)["']/gi)].map((match) => match[1]);
      return links
        .map((link) => decodeURIComponent(link.split('/').pop()))
        .filter((file) => new RegExp(`^pic\\d+\\.(${imageExtensions.join('|')})$`, 'i').test(file));
    } catch {
      return [];
    }
  };

  const discoverGalleryImages = async () => {
    if (typeof GALLERY_CATEGORIES === 'undefined') return [];
    const discovered = [];
    for (const category of GALLERY_CATEGORIES) {
      const directoryFiles = await getDirectoryFiles(category);
      const files = directoryFiles.length ? directoryFiles : category.files || [];
      files.sort((first, second) => Number(first.match(/\d+/)?.[0]) - Number(second.match(/\d+/)?.[0])).forEach((file) => {
        const number = file.match(/\d+/)?.[0];
        discovered.push({
          category: category.category,
          title: `${category.title} ${number}`,
          alt: `${category.alt}, photo ${number}`,
          image: `${category.folder}/${file}`
        });
      });
    }
    return discovered;
  };

  const createGalleryItem = (item, index) => {
    const button = document.createElement('button');
    button.className = `gallery-item reveal is-visible ${index % 2 ? 'reveal-delay' : ''}`;
    button.type = 'button';
    button.dataset.category = item.category;
    button.dataset.image = item.image;
    button.dataset.caption = item.title;
    button.setAttribute('aria-label', `Open ${item.title} image`);
    button.innerHTML = `<img src="${item.image}" alt="${item.alt}" loading="lazy"><span class="gallery-label">${item.title} <small>Local photo</small></span><span class="gallery-open" aria-hidden="true">↗</span>`;
    button.addEventListener('click', () => openLightbox(button));
    button.querySelector('img').addEventListener('error', () => {
      button.classList.add('gallery-item-missing');
      button.querySelector('img').removeAttribute('src');
    });
    return button;
  };

  const renderGallery = () => {
    if (!galleryGrid || !galleryPagination) return;
    const allItems = getGalleryData();
    const filteredItems = activeCategory === 'all' ? allItems : allItems.filter((item) => item.category === activeCategory);
    const pageCount = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
    currentPage = Math.min(currentPage, pageCount);
    visibleItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, index) => createGalleryItem(item, index));
    visibleItems.forEach((item, index) => item.style.setProperty('--gallery-index', index));
    if (!filteredItems.length) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'gallery-empty';
      emptyMessage.textContent = 'Add local photos as pic1, pic2, pic3 in the category folders to populate the gallery.';
      galleryGrid.replaceChildren(emptyMessage);
    } else {
      galleryGrid.replaceChildren(...visibleItems);
    }
    galleryPagination.replaceChildren();
    if (filteredItems.length > itemsPerPage) {
      for (let page = 1; page <= pageCount; page += 1) {
        const button = document.createElement('button');
        button.className = `pagination-button ${page === currentPage ? 'is-active' : ''}`;
        button.type = 'button';
        button.textContent = page;
        button.setAttribute('aria-label', `Gallery page ${page}`);
        button.setAttribute('aria-current', page === currentPage ? 'page' : 'false');
        button.addEventListener('click', () => { currentPage = page; renderGallery(); });
        galleryPagination.append(button);
      }
    }
  };

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      filterButtons.forEach((filterButton) => {
        const isActive = filterButton === button;
        filterButton.classList.toggle('is-active', isActive);
        filterButton.setAttribute('aria-pressed', String(isActive));
      });
      activeCategory = button.dataset.filter;
      currentPage = 1;
      renderGallery();
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

  lightboxCloseButtons.forEach((button) => button.addEventListener('click', closeLightbox));
  previousButton?.addEventListener('click', () => moveLightbox(-1));
  nextButton?.addEventListener('click', () => moveLightbox(1));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !lightbox.hidden) closeLightbox();
    if (event.key === 'ArrowLeft' && !lightbox.hidden) moveLightbox(-1);
    if (event.key === 'ArrowRight' && !lightbox.hidden) moveLightbox(1);
  });

  applySiteConfig();
  discoverGalleryImages().then((items) => {
    galleryData = items;
    renderGallery();
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
