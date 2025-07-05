const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  sessionId: { type: String, default: null }
});

module.exports = mongoose.model('User', userSchema);
