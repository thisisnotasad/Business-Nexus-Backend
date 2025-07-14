const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET all users (with optional role filter)
router.get("/", async (req, res) => {
  try {
    const { role } = req.query; // Get the 'role' query parameter
    let query = {};
    if (role) {
      // Ensure role is either 'investor' or 'entrepreneur'
      if (!["investor", "entrepreneur"].includes(role)) {
        return res
          .status(400)
          .json({
            error: 'Invalid role. Must be "investor" or "entrepreneur"',
          });
      }
      query.role = role; // Add role filter to the query
    }
    const users = await User.find(query);
    res.json(users);
  } catch (err) {
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
    res.status(400).json({ error: err.message });
  }
});

// PUT update a user
router.put("/:id", async (req, res) => {
  try {
    const user = await User.findOneAndUpdate({ id: req.params.id }, req.body, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
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
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
