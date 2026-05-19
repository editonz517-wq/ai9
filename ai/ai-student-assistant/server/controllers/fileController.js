const path   = require('path');
const fs     = require('fs');
const multer = require('multer');
const File   = require('../models/File');
const Note   = require('../models/Notes');
const User   = require('../models/User');
const { summarizeDocument } = require('../services/aiService');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  }
});
const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Неподдерживаемый формат файла'));
};
exports.upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });

// POST /api/files/upload
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Файл не загружен' });

    let extractedText = '';
    const filePath = req.file.path;
    const mime = req.file.mimetype;

    if (mime === 'text/plain') {
      extractedText = fs.readFileSync(filePath, 'utf-8');
    } else if (mime === 'application/pdf') {
      const pdfParse = require('pdf-parse');
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      extractedText = data.text;
    } else if (mime.includes('word') || mime.includes('wordprocessingml')) {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value;
    }

    // Auto-summarize
    let summary = '';
    if (extractedText.length > 200) {
      summary = await summarizeDocument(extractedText);
    }

    const file = await File.create({
      user:          req.user._id,
      originalName:  req.file.originalname,
      storedName:    req.file.filename,
      mimetype:      mime,
      size:          req.file.size,
      extractedText: extractedText.slice(0, 50000),
      summary,
      path:          filePath
    });

    // If asked to save as note
    if (summary) {
      await Note.create({
        user:    req.user._id,
        title:   `Конспект: ${req.file.originalname}`,
        content: summary,
        source:  'file'
      });
    }

    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.filesUploaded': 1 } });

    res.status(201).json({ file, summary, extractedText: extractedText.slice(0, 2000) });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/files
exports.getFiles = async (req, res) => {
  try {
    const files = await File.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/files/:id
exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, user: req.user._id });
    if (!file) return res.status(404).json({ message: 'Файл не найден' });
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    await file.deleteOne();
    res.json({ message: 'Файл удалён' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
