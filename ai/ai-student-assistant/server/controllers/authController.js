const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, group, faculty } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Заполните все обязательные поля' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email уже используется' });

    const user = await User.create({ name, email, password, group, faculty });
    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, group, faculty }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Введите email и пароль' });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Неверный email или пароль' });

    const token = signToken(user._id);
    res.json({
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, group: user.group, faculty: user.faculty,
        avatar: user.avatar, stats: user.stats
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  const user = req.user;
  res.json({
    id: user._id, name: user.name, email: user.email,
    role: user.role, group: user.group, faculty: user.faculty,
    avatar: user.avatar, stats: user.stats, aiMemory: user.aiMemory
  });
};
