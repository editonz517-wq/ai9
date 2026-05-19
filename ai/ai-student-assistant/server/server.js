require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const path       = require('path');
const rateLimit  = require('express-rate-limit');

// ── ENV validation
const required = ['MONGO_URI', 'JWT_SECRET', 'AI_API_KEY', 'AI_BASE_URL', 'AI_MODEL'];
const missing  = required.filter(k => !process.env[k] || process.env[k] === 'ВСТАВЬ_СЮДА_СВОЙ_КЛЮЧ');
if (missing.length) {
  console.error('❌ Отсутствуют переменные в .env:', missing.join(', '));
  console.error('📄 Скопируй .env.example в .env и заполни значения');
  process.exit(1);
}

const authRoutes     = require('./routes/authRoutes');
const chatRoutes     = require('./routes/chatRoutes');
const fileRoutes     = require('./routes/fileRoutes');
const noteRoutes     = require('./routes/noteRoutes');
const taskRoutes     = require('./routes/taskRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const userRoutes     = require('./routes/userRoutes');

const app = express();

// ── Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Слишком много запросов, попробуйте позже' }
});
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: 'Слишком много сообщений, подождите минуту' }
});

// ── Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(limiter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../client')));

// ── API Routes
app.use('/api/auth',     authRoutes);
app.use('/api/chat',     chatLimiter, chatRoutes);
app.use('/api/files',    fileRoutes);
app.use('/api/notes',    noteRoutes);
app.use('/api/tasks',    taskRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/user',     userRoutes);

// ── Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', model: process.env.AI_MODEL, time: new Date().toISOString() });
});

// ── Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

// ── Catch-all
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// ── MongoDB + Start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB подключён');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log('🚀 Сервер запущен: http://localhost:' + PORT);
      console.log('🤖 AI модель: ' + process.env.AI_MODEL);
    });
  })
  .catch(err => {
    console.error('❌ Ошибка MongoDB:', err.message);
    console.error('💡 Запусти MongoDB: net start MongoDB');
    process.exit(1);
  });
