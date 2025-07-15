const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET all users (with optional role filter)
router.get("/", async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};
    if (role) {
      if (!["investor", "entrepreneur"].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be "investor" or "entrepreneur"' });
      }
      query.role = role;
    }
    const users = await User.find(query);
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET a user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(`Error fetching user ${req.params.id}:`, err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET a user by Email
router.get("/email/:email", async (req, res) => {
  try {
    console.log('Requested email:', req.params.email);
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error('Error fetching user by email:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST create a user
router.post("/", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(400).json({ error: err.message });
  }
});

// PUT update a user
router.put("/:id", async (req, res) => {
  try {
    console.log("PUT user request for ID:", req.params.id, "Body:", req.body);
    const user = await User.findOneAndUpdate(
      { id: req.params.id },
      {
        $set: {
          bio: req.body.bio,
          interests: req.body.interests,
          portfolio: req.body.portfolio,
          startupName: req.body.startupName,
          startupDescription: req.body.startupDescription,
          fundingNeed: req.body.fundingNeed,
          pitchDeck: req.body.pitchDeck,
          avatar: req.body.avatar,
          location: req.body.location,
          socialLinks: req.body.socialLinks,
          experience: req.body.experience,
          industry: req.body.industry,
          stage: req.body.stage,
          traction: req.body.traction,
          teamSize: req.body.teamSize
        }
      },
      { new: true, runValidators: true }
    );
    if (!user) {
      console.error(`User with ID ${req.params.id} not found`);
      return res.status(404).json({ error: "User not found" });
    }
    console.log("Updated user:", user);
    res.json(user);
  } catch (err) {
    console.error(`Error updating user ${req.params.id}:`, err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE a user
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ id: req.params.id });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(`Error deleting user ${req.params.id}:`, err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;