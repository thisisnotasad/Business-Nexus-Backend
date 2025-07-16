const mongoose = require("mongoose");

const collaborationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  requesterId: { type: String, required: true },
  recipientId: { type: String, required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  chatId: { type: String, required: true, unique: true }, // Links to messages
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Collaboration", collaborationSchema);