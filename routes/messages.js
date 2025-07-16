const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Collaboration = require("../models/Collaboration");
const { v4: uuidv4 } = require("uuid");

router.get("/chat/:chatId", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    const collaboration = await Collaboration.findOne({
      chatId: req.params.chatId,
      status: "accepted",
      $or: [{ requesterId: userId }, { recipientId: userId }],
    });
    if (!collaboration) return res.status(403).json({ error: "No accepted collaboration found" });

    const messages = await Message.find({ chatId: req.params.chatId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const message = await Message.findOne({ id: req.params.id });
    if (!message) return res.status(404).json({ error: "Message not found" });
    const collaboration = await Collaboration.findOne({
      chatId: message.chatId,
      status: "accepted",
      $or: [{ requesterId: message.senderId }, { recipientId: message.senderId }],
    });
    if (!collaboration) return res.status(403).json({ error: "Unauthorized access to message" });
    res.json(message);
  } catch (err) {
    console.error("Error fetching message:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { senderId, chatId, text, senderName } = req.body;
    if (!senderId || !chatId || !text || !senderName) {
      return res.status(400).json({ error: "senderId, chatId, text, and senderName are required" });
    }
    const collaboration = await Collaboration.findOne({
      chatId,
      status: "accepted",
      $or: [{ requesterId: senderId }, { recipientId: senderId }],
    });
    if (!collaboration) return res.status(403).json({ error: "No accepted collaboration found" });

    const message = new Message({
      id: uuidv4(),
      chatId,
      senderId,
      senderName,
      text,
      timestamp: new Date(),
      read: false,
    });
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    console.error("Error creating message:", err.message);
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const message = await Message.findOne({ id: req.params.id });
    if (!message) return res.status(404).json({ error: "Message not found" });
    const collaboration = await Collaboration.findOne({
      chatId: message.chatId,
      status: "accepted",
      $or: [{ requesterId: message.senderId }, { recipientId: message.senderId }],
    });
    if (!collaboration) return res.status(403).json({ error: "Unauthorized access to message" });

    const updatedMessage = await Message.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, read: req.body.read || message.read },
      { new: true, runValidators: true }
    );
    res.json(updatedMessage);
  } catch (err) {
    console.error("Error updating message:", err.message);
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const message = await Message.findOne({ id: req.params.id });
    if (!message) return res.status(404).json({ error: "Message not found" });
    const collaboration = await Collaboration.findOne({
      chatId: message.chatId,
      status: "accepted",
      $or: [{ requesterId: message.senderId }, { recipientId: message.senderId }],
    });
    if (!collaboration) return res.status(403).json({ error: "Unauthorized access to message" });

    await Message.findOneAndDelete({ id: req.params.id });
    res.json({ message: "Message deleted" });
  } catch (err) {
    console.error("Error deleting message:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;