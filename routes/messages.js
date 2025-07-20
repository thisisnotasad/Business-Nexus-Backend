const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Collaboration = require("../models/Collaboration");
const { v4: uuidv4 } = require("uuid");

// Debug route to confirm /chat is mounted
router.get("/", (req, res) => {
  console.log("Hit /chat endpoint");
  res.json({ message: "Chat endpoint is active" });
});

// Debug route to confirm /chat is mounted
router.get("/", (req, res) => {
  console.log("Hit /chat endpoint");
  res.json({ message: "Chat endpoint is active" });
});

// Fetch messages for a chat
router.get("/chat/:chatId", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      console.log("Missing userId in query");
      return res.status(400).json({ error: "userId is required" });
    }
    console.log("Fetching messages for chatId:", req.params.chatId, "userId:", userId);
    const collaboration = await Collaboration.findOne({
      chatId: req.params.chatId,
      status: "accepted",
      $or: [{ requesterId: userId }, { recipientId: userId }],
    });
    console.log("Collaboration query result:", collaboration);
    if (!collaboration) {
      console.log("No collaboration found for chatId:", req.params.chatId, "userId:", userId);
      return res.status(403).json({ error: "No accepted collaboration found for this chat" });
    }
    const messages = await Message.find({ chatId: req.params.chatId }).sort({ timestamp: 1 });
    console.log("Messages found:", messages.length, messages);
    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err.message, err.stack);
    res.status(500).json({ error: "Server error" });
  }
});

// Fetch a single message by ID
router.get("/:id", async (req, res) => {
  try {
    console.log("Fetching message by id:", req.params.id);
    const message = await Message.findOne({ id: req.params.id });
    if (!message) {
      console.log("Message not found for id:", req.params.id);
      return res.status(404).json({ error: "Message not found" });
    }
    const collaboration = await Collaboration.findOne({
      chatId: message.chatId,
      status: "accepted",
      $or: [{ requesterId: message.senderId }, { recipientId: message.senderId }],
    });
    if (!collaboration) {
      console.log("Unauthorized access to message:", req.params.id);
      return res.status(403).json({ error: "Unauthorized access to message" });
    }
    res.json(message);
  } catch (err) {
    console.error("Error fetching message:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});



router.post("/", async (req, res) => {
  try {
    const { senderId, chatId, content, senderName } = req.body;
    if (!senderId || !chatId || !content || !senderName) {
      console.log("Missing required fields:", { senderId, chatId, content, senderName });
      return res.status(400).json({ error: "senderId, chatId, content, and senderName are required" });
    }
    const collaboration = await Collaboration.findOne({
      chatId,
      status: "accepted",
      $or: [{ requesterId: senderId }, { recipientId: senderId }],
    });
    if (!collaboration) {
      console.log("No collaboration found for chatId:", chatId, "senderId:", senderId);
      return res.status(404).json({ error: "No accepted collaboration found for this chat" });
    }
    const message = new Message({
      id: uuidv4(),
      chatId,
      senderId,
      senderName,
      text: content, // Store as text for backward compatibility
      content, // Also store as content
      timestamp: new Date(),
      read: false,
    });
    await message.save();
    console.log("Message saved:", message);
    res.status(201).json(message);
  } catch (err) {
    console.error("Error creating message:", err.message);
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const message = await Message.findOne({ id: req.params.id });
    if (!message) {
      console.log("Message not found for id:", req.params.id);
      return res.status(404).json({ error: "Message not found" });
    }
    const collaboration = await Collaboration.findOne({
      chatId: message.chatId,
      status: "accepted",
      $or: [{ requesterId: message.senderId }, { recipientId: message.senderId }],
    });
    if (!collaboration) {
      console.log("Unauthorized access to message:", req.params.id);
      return res.status(403).json({ error: "Unauthorized access to message" });
    }
    const updatedMessage = await Message.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, text: req.body.content || message.text, read: req.body.read || message.read },
      { new: true, runValidators: true }
    );
    console.log("Message updated:", updatedMessage);
    res.json(updatedMessage);
  } catch (err) {
    console.error("Error updating message:", err.message);
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const message = await Message.findOne({ id: req.params.id });
    if (!message) {
      console.log("Message not found for id:", req.params.id);
      return res.status(404).json({ error: "Message not found" });
    }
    const collaboration = await Collaboration.findOne({
      chatId: message.chatId,
      status: "accepted",
      $or: [{ requesterId: message.senderId }, { recipientId: message.senderId }],
    });
    if (!collaboration) {
      console.log("Unauthorized access to message:", req.params.id);
      return res.status(403).json({ error: "Unauthorized access to message" });
    }
    await Message.findOneAndDelete({ id: req.params.id });
    console.log("Message deleted:", req.params.id);
    res.json({ message: "Message deleted" });
  } catch (err) {
    console.error("Error deleting message:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Fallback for unmatched routes
router.use((req, res) => {
  console.log("Unmatched route:", req.method, req.originalUrl);
  res.status(404).json({ error: "Route not found" });
});

module.exports = router;