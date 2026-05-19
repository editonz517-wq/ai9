const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  chatId:     { type: String, required: true },           // UUID per conversation
  role:       { type: String, enum: ['user', 'assistant'], required: true },
  content:    { type: String, required: true },
  fileRef:    { type: mongoose.Schema.Types.ObjectId, ref: 'File', default: null },
  tokens:     { type: Number, default: 0 }
}, { timestamps: true });

messageSchema.index({ user: 1, chatId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
