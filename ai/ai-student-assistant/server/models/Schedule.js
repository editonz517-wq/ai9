const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:     { type: String, required: true },
  type:      { type: String, enum: ['lecture', 'lab', 'exam', 'consultation', 'other'], default: 'lecture' },
  subject:   { type: String, default: '' },
  teacher:   { type: String, default: '' },
  room:      { type: String, default: '' },
  startTime: { type: Date, required: true },
  endTime:   { type: Date, required: true },
  repeat:    { type: String, enum: ['none', 'weekly', 'biweekly'], default: 'none' },
  color:     { type: String, default: '#7c5cfc' }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
