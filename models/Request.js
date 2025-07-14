const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  investorId: { type: String },
  entrepreneurId: { type: String },
  investorName: { type: String },
  profileSnippet: { type: String },
  status: { type: String, enum: ['Accepted', 'Pending', 'Rejected'], required: true }
});

module.exports = mongoose.model('Request', requestSchema);