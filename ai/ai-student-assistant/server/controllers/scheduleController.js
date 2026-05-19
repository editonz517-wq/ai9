const Schedule = require('../models/Schedule');

// GET /api/schedule
exports.getSchedule = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = { user: req.user._id };
    if (from && to) filter.startTime = { $gte: new Date(from), $lte: new Date(to) };
    const events = await Schedule.find(filter).sort({ startTime: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/schedule
exports.createEvent = async (req, res) => {
  try {
    const { title, type, subject, teacher, room, startTime, endTime, repeat, color } = req.body;
    if (!title || !startTime || !endTime)
      return res.status(400).json({ message: 'Заполните обязательные поля' });
    const event = await Schedule.create({
      user: req.user._id, title, type, subject, teacher, room, startTime, endTime, repeat, color
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/schedule/:id
exports.updateEvent = async (req, res) => {
  try {
    const event = await Schedule.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body, { new: true }
    );
    if (!event) return res.status(404).json({ message: 'Событие не найдено' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/schedule/:id
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Schedule.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!event) return res.status(404).json({ message: 'Событие не найдено' });
    res.json({ message: 'Событие удалено' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
