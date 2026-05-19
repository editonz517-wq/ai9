const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalName: { type: String, required: true },
  storedName:   { type: String, required: true },
  mimetype:     { type: String, required: true },
  size:         { type: Number, default: 0 },
  extractedText:{ type: String, default: '' },
  summary:      { type: String, default: '' },
  path:         { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);
