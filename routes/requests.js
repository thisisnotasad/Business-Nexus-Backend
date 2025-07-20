const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const Collaboration = require("../models/Collaboration");
const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");

router.get("/", async (req, res) => {
  try {
    const { userId, status } = req.query;
    console.log("GET /requests query:", { userId, status });
    if (!userId) {
      console.error("Missing userId in query");
      return res.status(400).json({ error: "userId is required" });
    }
    const query = {
      $or: [{ investorId: String(userId) }, { entrepreneurId: String(userId) }],
    };
    if (status) {
      query.status = { $regex: `^${status}$`, $options: "i" };
    } else {
      query.status = "pending";
    }
    console.log("MongoDB query:", JSON.stringify(query, null, 2));
    const requests = await Request.find(query);
    console.log("Found requests:", JSON.stringify(requests, null, 2));

    const enrichedRequests = await Promise.all(
      requests.map(async (req) => {
        const investor = await User.findOne({ id: req.investorId }).select("id name role avatar");
        const entrepreneur = await User.findOne({ id: req.entrepreneurId }).select("id name role avatar");
        if (!investor || !entrepreneur) {
          console.error(`User not found: investorId=${req.investorId}, entrepreneurId=${req.entrepreneurId}`);
        }
        return {
          ...req._doc,
          investor: investor || {},
          entrepreneur: entrepreneur || {},
        };
      })
    );

    res.json(enrichedRequests);
  } catch (err) {
    console.error("Error fetching requests:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { investorId, entrepreneurId, investorName, profileSnippet } = req.body;
    console.log("POST /requests body:", { investorId, entrepreneurId, investorName, profileSnippet });
    if (!investorId || !entrepreneurId || !investorName) {
      return res.status(400).json({ error: "investorId, entrepreneurId, and investorName are required" });
    }
    const request = new Request({
      id: uuidv4(),
      investorId: String(investorId),
      entrepreneurId: String(entrepreneurId),
      investorName,
      profileSnippet,
      status: "pending",
    });
    await request.save();
    console.log("Created request:", JSON.stringify(request, null, 2));
    res.status(201).json(request);
  } catch (err) {
    console.error("Error creating request:", err.message);
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id/accept", async (req, res) => {
  try {
    const { id: userId } = req.body;
    console.log("PUT /requests/:id/accept body:", { userId });
    if (!userId) {
      return res.status(400).json({ error: "userId is required in request body" });
    }
    const request = await Request.findOne({ id: req.params.id });
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.status !== "pending") {
      return res.status(400).json({ error: "Request already processed" });
    }
    if (request.entrepreneurId !== String(userId)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Create new collaboration
    const collaboration = new Collaboration({
      id: uuidv4(),
      requesterId: request.investorId,
      recipientId: request.entrepreneurId,
      chatId: uuidv4(),
      status: "accepted",
      createdAt: new Date(),
    });
    await collaboration.save();

    // Delete the request
    await Request.deleteOne({ id: req.params.id });

    const io = req.app.get("io");
    io.emit("requestUpdated", { userId: request.investorId });
    io.emit("requestUpdated", { userId: request.entrepreneurId });

    res.status(200).json({ message: "Request accepted", chatId: collaboration.chatId });
  } catch (err) {
    console.error("Error accepting request:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id/reject", async (req, res) => {
  try {
    const { id: userId } = req.body;
    console.log("PUT /requests/:id/reject body:", { userId });
    if (!userId) {
      return res.status(400).json({ error: "userId is required in request body" });
    }
    const request = await Request.findOne({ id: req.params.id });
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.status !== "pending") {
      return res.status(400).json({ error: "Request already processed" });
    }
    if (request.entrepreneurId !== String(userId)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Request.deleteOne({ id: req.params.id });
    const io = req.app.get("io");
    io.emit("requestUpdated", { userId: request.investorId });
    io.emit("requestUpdated", { userId: request.entrepreneurId });

    res.status(200).json({ message: "Request rejected" });
  } catch (err) {
    console.error("Error rejecting request:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Debug endpoint to fetch all requests
router.get("/all", async (req, res) => {
  try {
    const requests = await Request.find({});
    console.log("GET /requests/all:", JSON.stringify(requests, null, 2));
    res.json(requests);
  } catch (err) {
    console.error("Error fetching all requests:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;