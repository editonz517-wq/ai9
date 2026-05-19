const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  group:    { type: String, default: '' },
  faculty:  { type: String, default: '' },
  avatar:   { type: String, default: '' },
  role:     { type: String, enum: ['student', 'admin'], default: 'student' },
  aiMemory: {
    subjects:      { type: [String], default: [] },
    lastTopics:    { type: [String], default: [] },
    preferredLang: { type: String, default: 'ru' }
  },
  stats: {
    totalChats:    { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    totalNotes:    { type: Number, default: 0 },
    filesUploaded: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
userSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
