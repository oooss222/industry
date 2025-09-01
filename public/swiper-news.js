function renderNews(lang) {
  const newsList = document.getElementById('news-list');
  if (!newsList) return;

  async function fetchNews() {
    const response = await fetch('/api/news');
    return response.ok ? await response.json() : getData('maftuna_news', []);
  }

  fetchNews().then(allNews => {
    newsList.innerHTML = allNews.length ? '' : `<p data-i18n="news.no_news">${I18N[lang]['news.no_news']}</p>`;

    allNews.forEach((news, index) => {
      const swiperId = `news-swiper-${index}`;
      const navPrevId = `swiper-prev-${index}`;
      const navNextId = `swiper-next-${index}`;
      const paginationId = `swiper-pagination-${index}`;
      const newsItem = document.createElement('article');
      newsItem.className = 'news-item';
      const images = news.images || [];
      newsItem.innerHTML = `
        <div class="news-container">
          <div class="news-swiper swiper${images.length > 0 ? '' : ' no-image'}" id="${swiperId}">
            <div class="swiper-wrapper">
              ${images.map((img, imgIndex) => `<div class="swiper-slide"><img src="${encodeURI(img)}" alt="News image" loading="lazy" class="zoomable-image" data-news-index="${index}" data-img-index="${imgIndex}"></div>`).join('')}
            </div>
            ${images.length > 0 ? `
              <div class="swiper-button-prev ${navPrevId}"></div>
              <div class="swiper-button-next ${navNextId}"></div>
              <div class="swiper-pagination ${paginationId}"></div>
            ` : ''}
          </div>
          <div class="news-content">
            <h3>${escapeHtml(news.title[lang] || news.title.ru || 'Untitled')}</h3>
            <p>${escapeHtml(news.content[lang] || news.content.ru || 'No content')}</p>
            <a href="#" class="read-more" data-i18n="news.read_more">${I18N[lang]['news.read_more']}</a>
          </div>
        </div>
      `;
      newsList.appendChild(newsItem);

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

    document.querySelectorAll('.news-swiper .zoomable-image').forEach(img => {
      img.addEventListener('click', () => {
        const newsIndex = parseInt(img.dataset.newsIndex);
        const imgIndex = parseInt(img.dataset.imgIndex);
        const news = allNews[newsIndex];
        if (news && news.images) {
          openImageModal(news.images, imgIndex);
        }
      });
    });
  }).catch(err => console.error('Ошибка загрузки новостей:', err));
}

document.addEventListener('DOMContentLoaded', () => {
  const lang = localStorage.getItem('maftuna_lang') || 'ru';
  applyI18n(lang);
  renderNews(lang);

  document.getElementById('lang-ru')?.addEventListener('click', () => {
    localStorage.setItem('maftuna_lang', 'ru');
    applyI18n('ru');
    renderNews('ru');
  });
  document.getElementById('lang-en')?.addEventListener('click', () => {
    localStorage.setItem('maftuna_lang', 'en');
    applyI18n('en');
    renderNews('en');
  });

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
});

function openImageModal(images, initialIndex) {
  const modal = document.querySelector('.image-modal');
  const swiperWrapper = modal.querySelector('.swiper-wrapper');
  swiperWrapper.innerHTML = images.map(img => `
    <div class="swiper-slide">
      <img src="${encodeURI(img)}" alt="Zoomed image">
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

function getData(k, d) {
  try {
    const r = localStorage.getItem(k);
    return r ? JSON.parse(r) : d;
  } catch (e) {
    console.error('Error reading localStorage:', e);
    return d;
  }
}

function escapeHtml(unsafe) {
  return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

window.addEventListener('storage', (event) => {
  if (event.key === 'maftuna_news') {
    renderNews(localStorage.getItem('maftuna_lang') || 'ru');
  }
});