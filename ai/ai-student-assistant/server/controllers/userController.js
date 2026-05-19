const User    = require('../models/User');
const Message = require('../models/Message');
const Note    = require('../models/Notes');
const Task    = require('../models/Task');
const File    = require('../models/File');
const bcrypt  = require('bcryptjs');
const multer  = require('multer');
const path    = require('path');

// Avatar upload
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename:    (req, file, cb) => cb(null, 'avatar-' + req.user._id + path.extname(file.originalname))
});
exports.avatarUpload = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// PUT /api/user/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, group, faculty, subjects } = req.body;
    const update = {};
    if (name)    update.name = name;
    if (group)   update.group = group;
    if (faculty) update.faculty = faculty;
    if (subjects) update['aiMemory.subjects'] = subjects.split(',').map(s => s.trim());

    if (req.file) update.avatar = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/user/password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(oldPassword)))
      return res.status(400).json({ message: 'Неверный текущий пароль' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Пароль изменён' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/user/stats
exports.getStats = async (req, res) => {
  try {
    const uid = req.user._id;
    const [msgs, notes, tasks, files] = await Promise.all([
      Message.countDocuments({ user: uid }),
      Note.countDocuments({ user: uid }),
      Task.countDocuments({ user: uid }),
      File.countDocuments({ user: uid })
    ]);
    res.json({ messages: msgs, notes, tasks, files });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── ADMIN ─────────────────────────────────────────────────────────────
// GET /api/user/admin/users
exports.adminGetUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/user/admin/users/:id
exports.adminDeleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Message.deleteMany({ user: req.params.id });
    await Note.deleteMany({ user: req.params.id });
    await Task.deleteMany({ user: req.params.id });
    await File.deleteMany({ user: req.params.id });
    res.json({ message: 'Пользователь удалён' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/user/admin/stats
exports.adminGetStats = async (req, res) => {
  try {
    const [users, messages, notes, tasks, files] = await Promise.all([
      User.countDocuments(),
      Message.countDocuments(),
      Note.countDocuments(),
      Task.countDocuments(),
      File.countDocuments()
    ]);
    res.json({ users, messages, notes, tasks, files });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
