const Task = require('../models/Task');

// GET /api/tasks
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({ deadline: 1 });
    // Auto-mark overdue
    const now = new Date();
    for (const t of tasks) {
      if (t.status === 'pending' && t.deadline < now) {
        t.status = 'overdue';
        await t.save();
      }
    }
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, deadline, subject, priority } = req.body;
    if (!title || !deadline) return res.status(400).json({ message: 'Укажите название и дедлайн' });
    const task = await Task.create({ user: req.user._id, title, description, deadline, subject, priority });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!task) return res.status(404).json({ message: 'Задание не найдено' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'Задание не найдено' });
    res.json({ message: 'Задание удалено' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
