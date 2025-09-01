document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('adminModal'); 
  const loginBtn = document.getElementById('modalLogin'); 
  const passwordInput = document.getElementById('adminPassword'); 
  const loginError = document.getElementById('loginError'); 
  const navToggle = document.querySelector('.nav-toggle'); 
  const siteNav = document.querySelector('.site-nav'); 

  if (!modal || !loginBtn || !passwordInput || !loginError || !navToggle || !siteNav) {
    console.error('Одна или несколько DOM-элементов не найдены.');
    return;
  }

  modal.setAttribute('aria-hidden', 'false'); 
  passwordInput.focus(); 

  loginBtn.addEventListener('click', async () => {
    const password = passwordInput.value; 
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (response.ok) {
        const { token } = await response.json(); 
        localStorage.setItem('adminToken', token); 
        modal.setAttribute('aria-hidden', 'true'); 
        await loadContacts(); 
        await loadNews(); 
        await loadProjects(); 
      } else {
        loginError.textContent = 'Неверный пароль. Попробуйте снова.'; 
        passwordInput.value = ''; 
        passwordInput.focus(); 
      }
    } catch (e) {
      console.error('Ошибка логина:', e); 
      loginError.textContent = 'Ошибка соединения.';
    }
  });

  document.getElementById('modalCancel').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  document.getElementById('modalClose').addEventListener('click', () => {
    window.location.href = 'index.html'; 
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window.location.href = 'index.html'; 
  });

  // Логика бургер-меню
  navToggle.addEventListener('click', () => {
    const isExpanded = navToggle.getAttribute('aria-expanded') === 'true'; 
    navToggle.setAttribute('aria-expanded', !isExpanded); 
    siteNav.classList.toggle('open'); 
    navToggle.setAttribute('aria-label', isExpanded ? 'Открыть меню' : 'Закрыть меню'); 
  });
});

// Функция для получения заголовков с токеном
function getAuthHeader() {
  const token = localStorage.getItem('adminToken'); 
  if (!token) {
    console.error('Токен авторизации отсутствует.');
    return {};
  }
  return { 'Authorization': `Bearer ${token}` }; 
}

// Функция для загрузки контактов с сервера
async function loadContacts() {
  try {
    const response = await fetch('/api/contacts', { headers: getAuthHeader() });
    if (response.ok) {
      const contacts = await response.json(); 
      const fields = {
        'admin-address-ru': contacts.address?.ru || '',
        'admin-address-en': contacts.address?.en || '',
        'admin-phone': contacts.phone || '',
        'admin-email': contacts.email || '',
        'admin-tg': contacts.telegram || '',
        'admin-wa': contacts.whatsapp || '',
        'admin-ig': contacts.instagram || '',
        'admin-vk': contacts.vk || '',
        'admin-fb': contacts.facebook || '',
        'admin-ok': contacts.ok || ''
      };
      Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
        else console.warn(`Элемент с ID ${id} не найден.`);
      });
      // Обновляем локальное хранилище для синхронизации
      localStorage.setItem('maftuna_contacts', JSON.stringify(contacts));
    } else {
      console.error('Ошибка ответа сервера при загрузке контактов:', response.status);
      alert('Не удалось загрузить контакты. Проверьте подключение.');
    }
  } catch (e) {
    console.error('Ошибка загрузки контактов:', e); 
    alert('Ошибка соединения при загрузке контактов.');
  }
}

// Функция для сохранения контактов на сервере
async function saveContacts() {
  const data = {
    address: {
      ru: document.getElementById('admin-address-ru')?.value.trim() || '',
      en: document.getElementById('admin-address-en')?.value.trim() || ''
    },
    phone: document.getElementById('admin-phone')?.value.trim() || '',
    email: document.getElementById('admin-email')?.value.trim() || '',
    telegram: document.getElementById('admin-tg')?.value.trim() || '',
    whatsapp: document.getElementById('admin-wa')?.value.trim() || '',
    instagram: document.getElementById('admin-ig')?.value.trim() || '',
    vk: document.getElementById('admin-vk')?.value.trim() || '',
    facebook: document.getElementById('admin-fb')?.value.trim() || '',
    ok: document.getElementById('admin-ok')?.value.trim() || ''
  };
  try {
    const response = await fetch('/api/contacts', {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (response.ok) {
      const updatedContacts = await response.json(); // Получаем обновленные данные от сервера
      alert('Контакты успешно сохранены'); 
      // Обновляем локальное хранилище и отправляем событие
      localStorage.setItem('maftuna_contacts', JSON.stringify(updatedContacts));
      window.dispatchEvent(new Event('storage'));
      // Перезагружаем данные в админке
      await loadContacts();
    } else {
      const error = await response.json();
      alert(`Ошибка сохранения контактов: ${error.error || 'Попробуйте снова'}`);
    }
  } catch (e) {
    console.error('Ошибка:', e); 
    alert('Ошибка соединения при сохранении контактов.');
  }
}

// Функция для загрузки новостей с сервера
async function loadNews() {
  try {
    const response = await fetch('/api/news', { headers: getAuthHeader() });
    if (response.ok) {
      const data = await response.json(); 
      renderAdminNews(data); 
      localStorage.setItem('maftuna_news', JSON.stringify(data)); 
    } else {
      console.error('Ошибка ответа сервера при загрузке новостей:', response.status);
    }
  } catch (e) {
    console.error('Ошибка загрузки новостей:', e); 
  }
}

// Функция для рендеринга списка новостей в админке
function renderAdminNews(list) {
  const container = document.getElementById('admin-news-list'); 
  if (!container) {
    console.error('Контейнер admin-news-list не найден.');
    return;
  }
  container.innerHTML = ''; 
  list.forEach((n, index) => {
    const div = document.createElement('div');
    div.className = 'admin-item card';
    div.innerHTML = `
      <div class="lang-fields">
        <div>
          <label>Заголовок (RU)</label>
          <input type="text" data-field="title-ru" value="${escapeHtml(n.title?.ru || '')}" class="form-input">
        </div>
        <div>
          <label>Title (EN)</label>
          <input type="text" data-field="title-en" value="${escapeHtml(n.title?.en || '')}" class="form-input">
        </div>
      </div>
      <div class="lang-fields">
        <div>
          <label>Содержание (RU)</label>
          <textarea data-field="content-ru" rows="5" class="form-input">${escapeHtml(n.content?.ru || '')}</textarea>
        </div>
        <div>
          <label>Content (EN)</label>
          <textarea data-field="content-en" rows="5" class="form-input">${escapeHtml(n.content?.en || '')}</textarea>
        </div>
      </div>
      <label>Изображения</label>
      <div class="admin-images">
        ${(n.images || []).map(img => `<div class="admin-image-item"><img src="${encodeURI(img)}" alt="News image" style="max-width:100px;margin-bottom:10px;"><button class="btn btn-ghost small" onclick="removeImage(${index}, '${encodeURI(img)}')"><i class="fa-solid fa-trash"></i></button></div>`).join('')}
      </div>
      <input type="file" data-field="images" accept="image/*" multiple class="form-input">
      <div class="modal-actions">
        <button class="btn" onclick="updateNews(${index})"><i class="fa-solid fa-floppy-disk"></i> Обновить</button>
        <button class="btn btn-ghost" onclick="deleteNews(${index})"><i class="fa-solid fa-trash"></i> Удалить</button>
      </div>
    `;
    container.appendChild(div); 
  });
}

// Функция для добавления новости на сервер
async function addNews() {
  const titleRu = document.getElementById('admin-news-title-ru')?.value.trim() || '';
  const titleEn = document.getElementById('admin-news-title-en')?.value.trim() || '';
  const contentRu = document.getElementById('admin-news-content-ru')?.value.trim() || '';
  const contentEn = document.getElementById('admin-news-content-en')?.value.trim() || '';
  const imageInput = document.getElementById('admin-news-image');

  if (!titleRu && !titleEn && !contentRu && !contentEn && (!imageInput?.files || imageInput.files.length === 0)) {
    alert('Пожалуйста, заполните хотя бы одно поле (заголовок, содержание или изображение).');
    return;
  }

  const formData = new FormData();
  formData.append('titleRu', titleRu);
  formData.append('titleEn', titleEn);
  formData.append('contentRu', contentRu);
  formData.append('contentEn', contentEn);
  if (imageInput?.files) {
    Array.from(imageInput.files).forEach(file => formData.append('images', file)); 
  }

  try {
    const response = await fetch('/api/news', {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData
    });
    if (response.ok) {
      document.getElementById('admin-news-title-ru').value = '';
      document.getElementById('admin-news-title-en').value = '';
      document.getElementById('admin-news-content-ru').value = '';
      document.getElementById('admin-news-content-en').value = '';
      imageInput.value = '';
      await loadNews(); 
      alert('Новость успешно добавлена');
    } else {
      alert('Ошибка добавления новости');
    }
  } catch (e) {
    console.error('Ошибка:', e); 
  }
}

// Функция для обновления новости на сервере
async function updateNews(index) {
  const containers = document.querySelectorAll('#admin-news-list > .admin-item');
  if (index >= containers.length) {
    alert('Новость не найдена.');
    return;
  }
  const cont = containers[index];
  const titleRu = cont.querySelector('[data-field="title-ru"]').value;
  const titleEn = cont.querySelector('[data-field="title-en"]').value;
  const contentRu = cont.querySelector('[data-field="content-ru"]').value;
  const contentEn = cont.querySelector('[data-field="content-en"]').value;
  const imageInput = cont.querySelector('[data-field="images"]');

  if (!titleRu && !titleEn && !contentRu && !contentEn) {
    alert('Пожалуйста, заполните хотя бы одно поле для заголовка или содержания.');
    return;
  }

  const existingNews = await (await fetch('/api/news', { headers: getAuthHeader() })).json();
  const id = existingNews[index].id;

  const formData = new FormData();
  formData.append('titleRu', titleRu);
  formData.append('titleEn', titleEn);
  formData.append('contentRu', contentRu);
  formData.append('contentEn', contentEn);
  if (imageInput.files && imageInput.files.length > 0) {
    Array.from(imageInput.files).forEach(file => formData.append('images', file));
  }

  try {
    const response = await fetch(`/api/news/${id}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: formData
    });
    if (response.ok) {
      await loadNews(); 
      alert('Новость обновлена');
    } else {
      alert('Ошибка обновления новости');
    }
  } catch (e) {
    console.error('Ошибка:', e); 
  }
}

// Функция для удаления новости с сервера
async function deleteNews(index) {
  if (!confirm('Удалить новость?')) return;
  const existingNews = await (await fetch('/api/news', { headers: getAuthHeader() })).json();
  if (index >= existingNews.length) {
    alert('Новость не найдена.');
    return;
  }
  const id = existingNews[index].id;
  try {
    const response = await fetch(`/api/news/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    if (response.ok) {
      await loadNews(); 
      alert('Новость удалена');
    } else {
      alert('Ошибка удаления новости');
    }
  } catch (e) {
    console.error('Ошибка:', e); 
  }
}

// Функция для удаления изображения новости с сервера
async function removeImage(newsIndex, imgUrl) {
  if (!confirm('Удалить изображение?')) return; 
  const existingNews = await (await fetch('/api/news', { headers: getAuthHeader() })).json();
  if (newsIndex >= existingNews.length) {
    alert('Новость не найдена.');
    return;
  }
  const id = existingNews[newsIndex].id;
  try {
    const response = await fetch(`/api/news/${id}/image`, {
      method: 'DELETE',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ imgUrl })
    });
    if (response.ok) {
      await loadNews(); 
    } else {
      alert('Ошибка удаления изображения');
    }
  } catch (e) {
    console.error('Ошибка:', e); 
  }
}

// Функция для загрузки проектов с сервера
async function loadProjects() {
  try {
    const response = await fetch('/api/projects', { headers: getAuthHeader() });
    if (response.ok) {
      const data = await response.json(); 
      renderAdminProjects(data); 
      localStorage.setItem('maftuna_projects', JSON.stringify(data)); 
    } else {
      console.error('Ошибка ответа сервера при загрузке проектов:', response.status);
    }
  } catch (e) {
    console.error('Ошибка загрузки проектов:', e); 
  }
}

// Функция для рендеринга списка проектов в админке
function renderAdminProjects(list) {
  const container = document.getElementById('admin-projects-list'); 
  if (!container) {
    console.error('Контейнер admin-projects-list не найден.');
    return;
  }
  container.innerHTML = ''; 
  list.forEach((p, index) => {
    const div = document.createElement('div');
    div.className = 'admin-item card';
    div.innerHTML = `
      <div class="lang-fields">
        <div>
          <label>Описание (RU)</label>
          <input type="text" data-field="desc-ru" value="${escapeHtml(p.desc?.ru || '')}" class="form-input">
        </div>
        <div>
          <label>Description (EN)</label>
          <input type="text" data-field="desc-en" value="${escapeHtml(p.desc?.en || '')}" class="form-input">
        </div>
      </div>
      <label>Изображения</label>
      <div class="admin-images">
        ${(p.images || []).map(img => `<div class="admin-image-item"><img src="${encodeURI(img)}" alt="Project image" style="max-width:100px;margin-bottom:10px;"><button class="btn btn-ghost small" onclick="removeProjectImage(${index}, '${encodeURI(img)}')"><i class="fa-solid fa-trash"></i></button></div>`).join('')}
      </div>
      <input type="file" data-field="images" accept="image/*" multiple class="form-input">
      <div class="modal-actions">
        <button class="btn" onclick="updateProject(${index})"><i class="fa-solid fa-floppy-disk"></i> Обновить</button>
        <button class="btn btn-ghost" onclick="deleteProject(${index})"><i class="fa-solid fa-trash"></i> Удалить</button>
      </div>
    `;
    container.appendChild(div); 
  });
}

// Функция для добавления проекта на сервер
async function addProject() {
  const descRu = document.getElementById('admin-project-desc-ru')?.value.trim() || '';
  const descEn = document.getElementById('admin-project-desc-en')?.value.trim() || '';
  const imageInput = document.getElementById('admin-project-img');

  const formData = new FormData();
  formData.append('descRu', descRu);
  formData.append('descEn', descEn);
  if (imageInput?.files) {
    Array.from(imageInput.files).forEach(file => formData.append('images', file)); 
  }

  try {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData
    });
    if (response.ok) {
      document.getElementById('admin-project-desc-ru').value = '';
      document.getElementById('admin-project-desc-en').value = '';
      imageInput.value = '';
      await loadProjects(); 
      alert('Проект добавлен');
    } else {
      alert('Ошибка добавления проекта');
    }
  } catch (e) {
    console.error('Ошибка:', e); 
  }
}

// Функция для обновления проекта на сервере
async function updateProject(index) {
  const containers = document.querySelectorAll('#admin-projects-list > .admin-item');
  if (index >= containers.length) {
    alert('Проект не найден.');
    return;
  }
  const cont = containers[index];
  const descRu = cont.querySelector('[data-field="desc-ru"]').value;
  const descEn = cont.querySelector('[data-field="desc-en"]').value;
  const imageInput = cont.querySelector('[data-field="images"]');

  const existingProjects = await (await fetch('/api/projects', { headers: getAuthHeader() })).json();
  const id = existingProjects[index].id;

  const formData = new FormData();
  formData.append('descRu', descRu);
  formData.append('descEn', descEn);
  if (imageInput.files && imageInput.files.length > 0) {
    Array.from(imageInput.files).forEach(file => formData.append('images', file));
  }

  try {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: formData
    });
    if (response.ok) {
      await loadProjects(); 
      alert('Проект обновлен');
    } else {
      alert('Ошибка обновления проекта');
    }
  } catch (e) {
    console.error('Ошибка:', e); 
  }
}

// Функция для удаления проекта с сервера
async function deleteProject(index) {
  if (!confirm('Удалить проект?')) return; 
  const existingProjects = await (await fetch('/api/projects', { headers: getAuthHeader() })).json();
  if (index >= existingProjects.length) {
    alert('Проект не найден.');
    return;
  }
  const id = existingProjects[index].id;
  try {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    if (response.ok) {
      await loadProjects(); 
      alert('Проект удален');
    } else {
      alert('Ошибка удаления проекта');
    }
  } catch (e) {
    console.error('Ошибка:', e); 
  }
}

// Функция для удаления изображения проекта с сервера
async function removeProjectImage(projectIndex, imgUrl) {
  if (!confirm('Удалить изображение?')) return; 
  const existingProjects = await (await fetch('/api/projects', { headers: getAuthHeader() })).json();
  if (projectIndex >= existingProjects.length) {
    alert('Проект не найден.');
    return;
  }
  const id = existingProjects[projectIndex].id;
  try {
    const response = await fetch(`/api/projects/${id}/image`, {
      method: 'DELETE',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ imgUrl })
    });
    if (response.ok) {
      await loadProjects(); 
    } else {
      alert('Ошибка удаления изображения');
    }
  } catch (e) {
    console.error('Ошибка:', e); 
  }
}

// Функция для сброса всех данных на сервере
async function resetAll() {
  if (!confirm('Вы уверены, что хотите сбросить все данные? Это действие нельзя отменить.')) return; 
  try {
    const response = await fetch('/api/reset', {
      method: 'POST',
      headers: getAuthHeader()
    });
    if (response.ok) {
      await loadContacts(); 
      await loadNews(); 
      await loadProjects(); 
      alert('Все данные сброшены');
    } else {
      alert('Ошибка сброса данных');
    }
  } catch (e) {
    console.error('Ошибка:', e); 
  }
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;"); // Экранируем HTML-символы
}