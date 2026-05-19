const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:   { type: String, required: true },
  content: { type: String, required: true },
  subject: { type: String, default: '' },
  tags:    { type: [String], default: [] },
  source:  { type: String, enum: ['chat', 'file', 'manual'], default: 'manual' }
}, { timestamps: true });

noteSchema.index({ user: 1, subject: 1 });

module.exports = mongoose.model('Note', noteSchema);
