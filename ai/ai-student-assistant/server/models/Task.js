const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  subject:     { type: String, default: '' },
  deadline:    { type: Date, required: true },
  status:      { type: String, enum: ['pending', 'done', 'overdue'], default: 'pending' },
  priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
