const express = require("express");
const router = express.Router();
const Collaboration = require("../models/Collaboration");
const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");

router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      console.error("Missing userId in query");
      return res.status(400).json({ error: "userId is required" });
    }
    const collaborations = await Collaboration.find({
      $or: [{ requesterId: userId }, { recipientId: userId }],
      status: "accepted",
    });
    console.log("Found collaborations:", collaborations);

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

router.post("/", async (req, res) => {
  try {
    const { requesterId, recipientId } = req.body;
    if (!requesterId || !recipientId) {
      return res.status(400).json({ error: "requesterId and recipientId are required" });
    }
    const collaboration = new Collaboration({
      id: uuidv4(),
      requesterId,
      recipientId,
      chatId: uuidv4(),
      status: "pending",
    });
    await collaboration.save();
    res.status(201).json(collaboration);
  } catch (err) {
    console.error("Error creating collaboration:", err.message);
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const collaboration = await Collaboration.findOneAndUpdate(
      { id: req.params.id },
      { status },
      { new: true, runValidators: true }
    );
    if (!collaboration) return res.status(404).json({ error: "Collaboration not found" });
    res.json(collaboration);
  } catch (err) {
    console.error("Error updating collaboration:", err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;