document.addEventListener("DOMContentLoaded", function() {
  const toggleBtn = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".site-nav");
  const breakpoint = 768;

  function handleMenuState() {
    if (window.innerWidth > breakpoint) {
      navMenu.classList.remove("open");
      navMenu.style.display = "flex";
    } else {
      if (!navMenu.classList.contains("open")) {
        navMenu.style.display = "none";
      }
    }
  }

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener("click", function() {
      const isOpen = navMenu.classList.toggle("open");
      navMenu.style.display = isOpen ? "flex" : "none";
      toggleBtn.setAttribute("aria-expanded", isOpen);
      navMenu.setAttribute("aria-hidden", !isOpen);
    });
    toggleBtn.setAttribute("aria-expanded", "false");
    navMenu.setAttribute("aria-hidden", "true");
  }

  window.addEventListener("resize", handleMenuState);
  handleMenuState();

  function getData(k, d) {
    try {
      const r = localStorage.getItem(k);
      return r ? JSON.parse(r) : d;
    } catch (e) {
      console.error('Error reading localStorage:', e);
      return d;
    }
  }

  function setData(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {
      console.error('Error writing to localStorage:', e);
    }
  }

  function renderContacts() {
    const lang = localStorage.getItem('maftuna_lang') || 'ru';
    const c = getData('maftuna_contacts', {
      address: { ru: 'Республика Таджикистан, Хатлонская область, город Бохтар, улица Вахдат, д.3', en: 'Republic of Tajikistan, Khatlon Region, Bokhtar city, Vahdat St., 3' },
      phone: '+992 00 655 66 79',
      email: 'info@maftuna.tj',
      telegram: 'https://t.me/maftuna_company',
      whatsapp: 'https://wa.me/992985737899',
      instagram: 'https://instagram.com/maftuna_company',
      vk: 'https://vk.com/your_page',
      facebook: 'https://www.facebook.com/your_page',
      ok: 'https://ok.ru/your_page'
    });

    const a = document.getElementById('address-text');
    if (a) {
      a.textContent = c.address[lang];
      a.href = `https://yandex.ru/maps/?text=${encodeURIComponent(c.address[lang])}`;
    }

    const p = document.getElementById('phone-link');
    if (p) {
      p.href = 'tel:' + c.phone.replace(/\s+/g, '');
      p.querySelector('span').textContent = c.phone;
    }

    const e = document.getElementById('email-link');
    if (e) {
      e.href = 'mailto:' + c.email;
      e.querySelector('span').textContent = c.email;
    }

    const socialLinks = {
      tg: document.querySelector('.social-btn.tg'),
      wa: document.querySelector('.social-btn.wa'),
      ig: document.querySelector('.social-btn.ig'),
      vk: document.querySelector('.social-btn.vk'),
      fb: document.querySelector('.social-btn.fb'),
      ok: document.querySelector('.social-btn.ok')
    };

    if (socialLinks.tg) socialLinks.tg.href = c.telegram;
    if (socialLinks.wa) socialLinks.wa.href = c.whatsapp;
    if (socialLinks.ig) socialLinks.ig.href = c.instagram;
    if (socialLinks.vk) socialLinks.vk.href = c.vk;
    if (socialLinks.fb) socialLinks.fb.href = c.facebook;
    if (socialLinks.ok) socialLinks.ok.href = c.ok;
  }

  function renderProjects() {
    const lang = localStorage.getItem('maftuna_lang') || 'ru';
    const all = getData('maftuna_projects', []);
    const grid = document.getElementById('projects-list');
    if (!grid) return;
    grid.innerHTML = '';
    if (all.length === 0) {
      grid.innerHTML = `<p style="padding:12px;background:var(--card);border-radius:8px" data-i18n="projects.no_projects">${I18N[lang]['projects.no_projects']}</p>`;
      return;
    }
    all.forEach((p, index) => {
      const swiperId = `project-swiper-${index}`;
      const navPrevId = `project-prev-${index}`;
      const navNextId = `project-next-${index}`;
      const paginationId = `project-pagination-${index}`;
      const card = document.createElement('div');
      card.className = 'project-item';
      const images = p.images || [];
      card.innerHTML = `
        <div class="project-swiper swiper${images.length > 0 ? '' : ' no-image'}" id="${swiperId}">
          <div class="swiper-wrapper">
            ${images.map((img, imgIndex) => `<div class="swiper-slide"><img src="${escape(img)}" alt="Project image" loading="lazy" class="zoomable-image" data-project-index="${index}" data-img-index="${imgIndex}"></div>`).join('')}
          </div>
          ${images.length > 0 ? `
            <div class="swiper-button-prev ${navPrevId}"></div>
            <div class="swiper-button-next ${navNextId}"></div>
            <div class="swiper-pagination ${paginationId}"></div>
          ` : ''}
        </div>
        <div class="descr"><p>${escape(p.desc[lang] || p.desc.ru || 'No description')}</p></div>
      `;
      grid.appendChild(card);

      if (images.length > 0) {
        new Swiper(`#${swiperId}`, {
          loop: images.length > 1,
          pagination: { el: `.${paginationId}`, clickable: true },
          navigation: { 
            nextEl: `.${navNextId}`, 
            prevEl: `.${navPrevId}` 
          },
          spaceBetween: 10,
          breakpoints: {
            320: { slidesPerView: 1 },
            600: { slidesPerView: 1 },
            768: { slidesPerView: 1 }
          }
        });
      }
    });

    // Добавление обработчиков кликов для увеличения изображений
    document.querySelectorAll('.project-swiper .zoomable-image').forEach(img => {
      img.addEventListener('click', () => {
        const projectIndex = parseInt(img.dataset.projectIndex);
        const imgIndex = parseInt(img.dataset.imgIndex);
        const project = getData('maftuna_projects', [])[projectIndex];
        if (project && project.images) {
          openImageModal(project.images, imgIndex);
        }
      });
    });
  }

  function escape(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Инициализация текущего языка и рендеринг
  const lang = localStorage.getItem('maftuna_lang') || 'ru';
  applyI18n(lang);
  renderContacts();
  renderProjects();

  // Обработчики переключения языка
  document.getElementById('lang-ru')?.addEventListener('click', () => {
    localStorage.setItem('maftuna_lang', 'ru');
    applyI18n('ru');
    renderContacts();
    renderProjects();
  });
  document.getElementById('lang-en')?.addEventListener('click', () => {
    localStorage.setItem('maftuna_lang', 'en');
    applyI18n('en');
    renderContacts();
    renderProjects();
  });

  // Создание модального окна для увеличения изображения (если оно ещё не создано)
  if (!document.querySelector('.image-modal')) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="image-modal-content">
        <div class="swiper image-modal-swiper">
          <div class="swiper-wrapper"></div>
          <div class="swiper-button-prev"></div>
          <div class="swiper-button-next"></div>
          <div class="swiper-pagination"></div>
        </div>
        <button class="image-modal-close">&times;</button>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.image-modal-close').addEventListener('click', () => {
      modal.setAttribute('aria-hidden', 'true');
      const swiperWrapper = modal.querySelector('.swiper-wrapper');
      swiperWrapper.innerHTML = '';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.setAttribute('aria-hidden', 'true');
        const swiperWrapper = modal.querySelector('.swiper-wrapper');
        swiperWrapper.innerHTML = '';
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
        modal.setAttribute('aria-hidden', 'true');
        const swiperWrapper = modal.querySelector('.swiper-wrapper');
        swiperWrapper.innerHTML = '';
      }
    });
  }

  function openImageModal(images, initialIndex) {
    const modal = document.querySelector('.image-modal');
    const swiperWrapper = modal.querySelector('.swiper-wrapper');
    swiperWrapper.innerHTML = images.map(img => `
      <div class="swiper-slide">
        <img src="${escape(img)}" alt="Zoomed image">
      </div>
    `).join('');

    const swiper = new Swiper('.image-modal-swiper', {
      initialSlide: initialIndex,
      loop: images.length > 1,
      pagination: { el: '.image-modal .swiper-pagination', clickable: true },
      navigation: { 
        nextEl: '.image-modal .swiper-button-next', 
        prevEl: '.image-modal .swiper-button-prev' 
      },
      spaceBetween: 10,
      breakpoints: {
        320: { slidesPerView: 1 },
        600: { slidesPerView: 1 },
        768: { slidesPerView: 1 }
      }
    });

    modal.setAttribute('aria-hidden', 'false');
  }
});

window.addEventListener('storage', (event) => {
  if (event.key === 'maftuna_projects') {
    renderProjects();
  }
});

window.addEventListener('storage', (event) => {
  if (event.key === 'maftuna_contacts') {
    renderContacts();
  }
});