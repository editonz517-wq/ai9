const Note = require('../models/Notes');
const User = require('../models/User');
const { askAI } = require('../services/aiService');

// GET /api/notes
exports.getNotes = async (req, res) => {
  try {
    const { search, subject } = req.query;
    const filter = { user: req.user._id };
    if (subject) filter.subject = subject;
    if (search)  filter.$text = { $search: search };

    const notes = await Note.find(filter).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/notes
exports.createNote = async (req, res) => {
  try {
    const { title, content, subject, tags } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Заполните название и содержание' });

    const note = await Note.create({ user: req.user._id, title, content, subject, tags });
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.totalNotes': 1 } });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/notes/generate — AI generates note from topic
exports.generateNote = async (req, res) => {
  try {
    const { topic, type = 'конспект' } = req.body;
    if (!topic) return res.status(400).json({ message: 'Укажите тему' });

    const prompt = `Создай подробный ${type} по теме: "${topic}". Используй заголовки, пункты, примеры.`;
    const content = await askAI([{ role: 'user', content: prompt }]);

    const note = await Note.create({
      user: req.user._id,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)}: ${topic}`,
      content,
      subject: topic,
      source: 'chat'
    });
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.totalNotes': 1 } });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/notes/:id
exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!note) return res.status(404).json({ message: 'Конспект не найден' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/notes/:id
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ message: 'Конспект не найден' });
    res.json({ message: 'Конспект удалён' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
