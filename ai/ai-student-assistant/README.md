# 🤖 AI Student Assistant

Полноценный AI-чатбот для студентов. Объясняет темы, пишет конспекты, генерирует код, анализирует PDF, хранит расписание и задания.

---

## 📁 Структура проекта

```
ai-student-assistant/
├── client/                  # Фронтенд (HTML + CSS + JS)
│   ├── index.html
│   ├── styles/main.css
│   └── components/
│       ├── api.js           # Хелпер для запросов к серверу
│       ├── app.js           # Инициализация, роутинг, модалки
│       ├── auth.js          # Вход / регистрация
│       ├── chat.js          # AI-чат, голосовой ввод, файлы
│       ├── notes.js         # Конспекты (CRUD + AI-генерация)
│       ├── tasks.js         # Домашние задания
│       ├── schedule.js      # Расписание
│       ├── files.js         # Загрузка файлов
│       ├── profile.js       # Профиль и статистика
│       └── admin.js         # Панель администратора
│
└── server/                  # Бэкенд (Node.js + Express)
    ├── server.js            # Точка входа
    ├── .env                 # Конфигурация (заполните!)
    ├── package.json
    ├── controllers/         # Логика
    ├── routes/              # API-маршруты
    ├── models/              # Mongoose-схемы
    ├── middleware/          # JWT-авторизация
    ├── services/aiService.js# Работа с AI API
    └── uploads/             # Загруженные файлы
```

---

## ⚙️ Требования

- **Node.js** v18+ → https://nodejs.org
- **MongoDB** (локально или MongoDB Atlas)
  - Локально: https://www.mongodb.com/try/download/community
  - Или бесплатно в облаке: https://cloud.mongodb.com

---

## 🚀 Запуск (шаг за шагом)

### 1. Установить зависимости

```bash
cd server
npm install
```

### 2. Настроить `.env`

Открой файл `server/.env` и заполни:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai_student_db
JWT_SECRET=любой_секретный_ключ_здесь
AI_API_KEY=sk-ai-v1-0a01b60e75c0830cdaefaf4270010f8036d4d29d532c2781d3b34ef1f36a31cd
AI_BASE_URL=https://zenmux.ai/api/v1
AI_MODEL=openai/chat-latest
```

> Если используешь MongoDB Atlas — замени `MONGO_URI` на строку подключения из Atlas.

### 3. Запустить сервер

```bash
cd server
node server.js
```

Или с автоперезагрузкой (dev-режим):
```bash
npm run dev
```

### 4. Открыть сайт

Перейди в браузере: **http://localhost:5000**

---

## 👤 Создание администратора

После регистрации первого пользователя — зайди в MongoDB и смени ему роль:

```js
// В MongoDB Shell или Compass
db.users.updateOne(
  { email: "твой@email.ru" },
  { $set: { role: "admin" } }
)
```

---

## 🔧 Возможности

| Функция | Описание |
|---|---|
| 💬 AI-чат | Вопросы по учёбе, объяснения, код |
| 📄 Анализ файлов | PDF / DOCX / TXT → автоконспект |
| 📝 Конспекты | Создание, редактирование, AI-генерация |
| ✅ Задания | Дедлайны, статусы, приоритеты |
| 📅 Расписание | Пары, экзамены, консультации |
| 🎤 Голосовой ввод | Речь → текст → AI-ответ |
| 👤 Профиль | Аватар, статистика, пароль |
| ⚙️ Админ-панель | Управление пользователями |

---

## 📡 API Endpoints

### Auth
| Метод | URL | Описание |
|---|---|---|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| GET  | `/api/auth/me` | Текущий пользователь |

### Chat
| Метод | URL | Описание |
|---|---|---|
| POST | `/api/chat/send` | Отправить сообщение |
| GET  | `/api/chat/history` | Список чатов |
| GET  | `/api/chat/:chatId` | Сообщения чата |
| DELETE | `/api/chat/:chatId` | Удалить чат |

### Notes
| Метод | URL | Описание |
|---|---|---|
| GET  | `/api/notes` | Список конспектов |
| POST | `/api/notes` | Создать конспект |
| POST | `/api/notes/generate` | AI-генерация конспекта |
| PUT  | `/api/notes/:id` | Редактировать |
| DELETE | `/api/notes/:id` | Удалить |

### Tasks
| Метод | URL |
|---|---|
| GET/POST | `/api/tasks` |
| PUT/DELETE | `/api/tasks/:id` |

### Schedule
| Метод | URL |
|---|---|
| GET/POST | `/api/schedule` |
| PUT/DELETE | `/api/schedule/:id` |

### Files
| Метод | URL | Описание |
|---|---|---|
| POST | `/api/files/upload` | Загрузить файл |
| GET  | `/api/files` | Список файлов |
| DELETE | `/api/files/:id` | Удалить файл |

### User / Admin
| Метод | URL |
|---|---|
| PUT | `/api/user/profile` |
| PUT | `/api/user/password` |
| GET | `/api/user/stats` |
| GET | `/api/user/admin/users` |
| DELETE | `/api/user/admin/users/:id` |
| GET | `/api/user/admin/stats` |

---

## 🛠 Технологии

**Frontend:** Vanilla JS, HTML5, CSS3 (без фреймворков)  
**Backend:** Node.js, Express.js  
**База данных:** MongoDB + Mongoose  
**AI:** Zenmux API (OpenAI-совместимый)  
**Авторизация:** JWT + bcrypt  
**Файлы:** Multer, pdf-parse, mammoth  
