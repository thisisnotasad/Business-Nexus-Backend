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
  pitchDeck: { type: String },
  avatar: { type: String, default: 'https://images.unsplash.com/photo-1502685104226-ee32379f453f?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150' },
  location: { type: String },
  socialLinks: {
    linkedin: { type: String },
    twitter: { type: String },
    website: { type: String }
  },
  experience: { type: String },
  industry: { type: String },
  stage: { type: String, enum: ['Pre-Seed', 'Seed', 'Series A', 'Series B'], default:null },
  traction: { type: String },
  teamSize: { type: Number }
});

module.exports = mongoose.model('User', userSchema);