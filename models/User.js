const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Note: In production, hash this
  role: { type: String, enum: ['investor', 'entrepreneur'], required: true },
  name: { type: String, required: true },
  bio: { type: String },
  interests: { type: [String], default: [] },
  portfolio: { type: [String], default: [] },
  startupName: { type: String },
  startupDescription: { type: String },
  fundingNeed: { type: Number },
  pitchDeck: { type: String }
});

module.exports = mongoose.model('User', userSchema);