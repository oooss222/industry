const express = require('express'); 
const bodyParser = require('body-parser'); 
const fs = require('fs'); 
const path = require('path'); 
const multer = require('multer'); 
const cors = require('cors'); 

// Настройка multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public/img/uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Константы
const DATA_DIR = path.join(__dirname, 'data');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');
const NEWS_FILE = path.join(DATA_DIR, 'news.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const ADMIN_PASSWORD = 'fw5Gkaw]y5WmMWd-L';

// Создание директорий
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}
const uploadsDir = path.join(__dirname, 'public/img/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Инициализация app
const app = express();
app.use(cors()); 
app.use(bodyParser.json());

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// Аутентификация
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (token === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Чтение данных
function readData(file, defaultValue) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (e) {
    console.error('Ошибка чтения файла:', e); 
  }
  return defaultValue;
}

// Запись данных
function writeData(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Ошибка записи в файл:', e); 
  }
}

// API логина
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ token: ADMIN_PASSWORD });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// API контактов
app.get('/api/contacts', (req, res) => {
  const defaultContacts = {
    address: { ru: '', en: '' },
    phone: '',
    email: '',
    telegram: '',
    whatsapp: '',
    instagram: '',
    vk: '',
    facebook: '',
    ok: ''
  };
  const contacts = readData(CONTACTS_FILE, defaultContacts);
  res.json(contacts);
});

app.post('/api/contacts', authenticate, (req, res) => {
  writeData(CONTACTS_FILE, req.body);
  res.json({ message: 'Контакты сохранены' });
});

// API новостей
app.get('/api/news', (req, res) => {
  const news = readData(NEWS_FILE, []);
  res.json(news);
});

app.post('/api/news', authenticate, upload.array('images'), (req, res) => {
  const { titleRu, titleEn, contentRu, contentEn } = req.body;
  const images = req.files.map(file => `/img/uploads/${file.filename}`);
  const newNews = {
    id: Date.now().toString(),
    title: { ru: titleRu || '', en: titleEn || '' },
    content: { ru: contentRu || '', en: contentEn || '' },
    images
  };
  const list = readData(NEWS_FILE, []);
  list.push(newNews);
  writeData(NEWS_FILE, list);
  res.json({ message: 'Новость добавлена' });
});

app.put('/api/news/:id', authenticate, upload.array('images'), (req, res) => {
  const { id } = req.params;
  const { titleRu, titleEn, contentRu, contentEn } = req.body;
  const list = readData(NEWS_FILE, []);
  const index = list.findIndex(n => n.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Новость не найдена' });
  }
  const newImages = req.files.map(file => `/img/uploads/${file.filename}`);
  list[index].title.ru = titleRu || list[index].title.ru;
  list[index].title.en = titleEn || list[index].title.en;
  list[index].content.ru = contentRu || list[index].content.ru;
  list[index].content.en = contentEn || list[index].content.en;
  list[index].images = [...list[index].images, ...newImages];
  writeData(NEWS_FILE, list);
  res.json({ message: 'Новость обновлена' });
});

app.delete('/api/news/:id', authenticate, (req, res) => {
  const { id } = req.params;
  let list = readData(NEWS_FILE, []);
  const index = list.findIndex(n => n.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Новость не найдена' });
  }
  list[index].images.forEach(imgPath => {
    const fullPath = path.join(__dirname, 'public', imgPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  });
  list.splice(index, 1);
  writeData(NEWS_FILE, list);
  res.json({ message: 'Новость удалена' });
});

app.delete('/api/news/:id/image', authenticate, (req, res) => {
  const { id } = req.params;
  const { imgUrl } = req.body;
  const list = readData(NEWS_FILE, []);
  const index = list.findIndex(n => n.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Новость не найдена' });
  }
  const imgIndex = list[index].images.findIndex(i => i === imgUrl);
  if (imgIndex !== -1) {
    const fullPath = path.join(__dirname, 'public', imgUrl);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    list[index].images.splice(imgIndex, 1);
    writeData(NEWS_FILE, list);
    res.json({ message: 'Изображение удалено' });
  } else {
    res.status(404).json({ error: 'Изображение не найдено' });
  }
});

// API для проектов
app.get('/api/projects', (req, res) => {
  const projects = readData(PROJECTS_FILE, []);
  res.json(projects);
});

app.post('/api/projects', authenticate, upload.array('images'), (req, res) => {
  const { descRu, descEn } = req.body;
  const images = req.files.map(file => `/img/uploads/${file.filename}`);
  const newProject = {
    id: Date.now().toString(),
    desc: { ru: descRu || '', en: descEn || '' },
    images
  };
  const list = readData(PROJECTS_FILE, []);
  list.push(newProject);
  writeData(PROJECTS_FILE, list);
  res.json({ message: 'Проект добавлен' });
});

app.put('/api/projects/:id', authenticate, upload.array('images'), (req, res) => {
  const { id } = req.params;
  const { descRu, descEn } = req.body;
  const list = readData(PROJECTS_FILE, []);
  const index = list.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Проект не найден' });
  }
  const newImages = req.files.map(file => `/img/uploads/${file.filename}`);
  list[index].desc.ru = descRu || list[index].desc.ru;
  list[index].desc.en = descEn || list[index].desc.en;
  list[index].images = [...list[index].images, ...newImages];
  writeData(PROJECTS_FILE, list);
  res.json({ message: 'Проект обновлен' });
});

app.delete('/api/projects/:id', authenticate, (req, res) => {
  const { id } = req.params;
  let list = readData(PROJECTS_FILE, []);
  const index = list.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Проект не найден' });
  }
  list[index].images.forEach(imgPath => {
    const fullPath = path.join(__dirname, 'public', imgPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  });
  list.splice(index, 1);
  writeData(PROJECTS_FILE, list);
  res.json({ message: 'Проект удален' });
});

app.delete('/api/projects/:id/image', authenticate, (req, res) => {
  const { id } = req.params;
  const { imgUrl } = req.body;
  const list = readData(PROJECTS_FILE, []);
  const index = list.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Проект не найден' });
  }
  const imgIndex = list[index].images.findIndex(i => i === imgUrl);
  if (imgIndex !== -1) {
    const fullPath = path.join(__dirname, 'public', imgUrl);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    list[index].images.splice(imgIndex, 1);
    writeData(PROJECTS_FILE, list);
    res.json({ message: 'Изображение удалено' });
  } else {
    res.status(404).json({ error: 'Изображение не найдено' });
  }
});

// API для сброса всех данных
app.post('/api/reset', authenticate, (req, res) => {
  const defaultContacts = {
    address: { ru: '', en: '' },
    phone: '',
    email: '',
    telegram: '',
    whatsapp: '',
    instagram: '',
    vk: '',
    facebook: '',
    ok: ''
  };
  writeData(CONTACTS_FILE, defaultContacts);
  writeData(NEWS_FILE, []);
  writeData(PROJECTS_FILE, []);
  fs.readdirSync(uploadsDir).forEach(file => {
    fs.unlinkSync(path.join(uploadsDir, file));
  });
  res.json({ message: 'Все данные сброшены' });
});

// Запуск сервера на порту 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});