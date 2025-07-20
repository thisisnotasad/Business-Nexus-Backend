const express = require("express");
const router = express.Router();
const Collaboration = require("../models/Collaboration");
const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");

router.get("/", async (req, res) => {
  try {
    const { userId, status } = req.query;
    console.log("GET /collaborations query:", { userId, status });
    if (!userId) {
      console.error("Missing userId in query");
      return res.status(400).json({ error: "userId is required" });
    }
    const query = {
      $or: [{ requesterId: String(userId) }, { recipientId: String(userId) }],
    };
    if (status) {
      query.status = { $regex: `^${status}$`, $options: "i" };
    } else {
      query.status = "accepted";
    }
    console.log("MongoDB query:", JSON.stringify(query, null, 2));
    const collaborations = await Collaboration.find(query);
    console.log("Found collaborations:", JSON.stringify(collaborations, null, 2));

    const enrichedCollaborations = await Promise.all(
      collaborations.map(async (collab) => {
        const requester = await User.findOne({ id: collab.requesterId }).select("id name role avatar");
        const recipient = await User.findOne({ id: collab.recipientId }).select("id name role avatar");
        if (!requester || !recipient) {
          console.error(`User not found: requesterId=${collab.requesterId}, recipientId=${collab.recipientId}`);
        }
        return {
          ...collab._doc,
          requester: requester || {},
          recipient: recipient || {},
        };
      })
    );

    res.json(enrichedCollaborations);
  } catch (err) {
    console.error("Error fetching collaborations:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Debug endpoint to fetch all collaborations
router.get("/all", async (req, res) => {
  try {
    const collaborations = await Collaboration.find({});
    console.log("GET /collaborations/all:", JSON.stringify(collaborations, null, 2));
    res.json(collaborations);
  } catch (err) {
    console.error("Error fetching all collaborations:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { requesterId, recipientId } = req.body;
    console.log("POST /collaborations body:", { requesterId, recipientId });
    if (!requesterId || !recipientId) {
      return res.status(400).json({ error: "requesterId and recipientId are required" });
    }
    const collaboration = new Collaboration({
      id: uuidv4(),
      requesterId: String(requesterId),
      recipientId: String(recipientId),
      chatId: uuidv4(),
      status: "pending",
    });
    await collaboration.save();
    console.log("Created collaboration:", JSON.stringify(collaboration, null, 2));
    res.status(201).json(collaboration);
  } catch (err) {
    console.error("Error creating collaboration:", err.message);
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    console.log("PUT /collaborations/:id body:", { status });
    const normalizedStatus = status ? status.toLowerCase() : status;
    const collaboration = await Collaboration.findOneAndUpdate(
      { id: req.params.id },
      { status: normalizedStatus },
      { new: true, runValidators: true }
    );
    if (!collaboration) return res.status(404).json({ error: "Collaboration not found" });
    res.json(collaboration);
  } catch (err) {
    console.error("Error updating collaboration:", err.message);
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id/accept", async (req, res) => {
  try {
    const { id: userId } = req.body;
    console.log("PUT /collaborations/:id/accept body:", { userId });
    if (!userId) {
      return res.status(400).json({ error: "userId is required in request body" });
    }
    const collaboration = await Collaboration.findOne({ id: req.params.id });
    if (!collaboration) return res.status(404).json({ error: "Collaboration not found" });
    if (collaboration.status !== "pending") {
      return res.status(400).json({ error: "Collaboration already processed" });
    }
    if (collaboration.requesterId !== String(userId) && collaboration.recipientId !== String(userId)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const updatedCollaboration = await Collaboration.findOneAndUpdate(
      { id: req.params.id },
      { status: "accepted", updatedAt: new Date() },
      { new: true }
    );

    await Collaboration.deleteMany({
      chatId: collaboration.chatId,
      status: { $in: ["pending", "rejected"] },
      id: { $ne: collaboration.id },
    });

    const io = req.app.get("io");
    io.emit("collaborationUpdated", { userId: collaboration.requesterId });
    io.emit("collaborationUpdated", { userId: collaboration.recipientId });

    res.status(200).json({ message: "Collaboration accepted", chatId: collaboration.chatId });
  } catch (err) {
    console.error("Error accepting collaboration:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id/reject", async (req, res) => {
  try {
    const { id: userId } = req.body;
    console.log("PUT /collaborations/:id/reject body:", { userId });
    if (!userId) {
      return res.status(400).json({ error: "userId is required in request body" });
    }
    const collaboration = await Collaboration.findOne({ id: req.params.id });
    if (!collaboration) return res.status(404).json({ error: "Collaboration not found" });
    if (collaboration.status !== "pending") {
      return res.status(400).json({ error: "Collaboration already processed" });
    }
    if (collaboration.requesterId !== String(userId) && collaboration.recipientId !== String(userId)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Collaboration.deleteOne({ id: req.params.id });
    const io = req.app.get("io");
    io.emit("collaborationUpdated", { userId: collaboration.requesterId });
    io.emit("collaborationUpdated", { userId: collaboration.recipientId });

    res.status(200).json({ message: "Collaboration rejected" });
  } catch (err) {
    console.error("Error rejecting collaboration:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;