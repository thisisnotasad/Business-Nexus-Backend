const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  investorId: { type: String, required: true },
  entrepreneurId: { type: String, required: true },
  investorName: { type: String, required: true },
  profileSnippet: { type: String },
  status: { type: String, enum: ["pending", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Request", requestSchema);