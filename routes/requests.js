const express = require('express');
const router = express.Router();
const Request = require('../models/Request');

// GET all requests
router.get('/', async (req, res) => {
  try {
    const requests = await Request.find();
    res.json(requests);
  } catch (err) {
    console.error('Error fetching requests:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET a request by ID
router.get('/:id', async (req, res) => {
  try {
    const request = await Request.findOne({ id: req.params.id });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json(request);
  } catch (err) {
    console.error(`Error fetching request ${req.params.id}:`, err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create a request
router.post('/', async (req, res) => {
  try {
    const request = new Request(req.body);
    await request.save();
    res.status(201).json(request);
  } catch (err) {
    console.error('Error creating request:', err);
    res.status(400).json({ error: err.message });
  }
});

// PUT update a request
router.put('/:id', async (req, res) => {
  try {
    console.log('PUT request received for ID:', req.params.id, 'Body:', req.body);
    const request = await Request.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!request) {
      console.error(`Request with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'Request not found' });
    }
    console.log('Updated request:', request);
    res.json(request);
  } catch (err) {
    console.error(`Error updating request ${req.params.id}:`, err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE a request
router.delete('/:id', async (req, res) => {
  try {
    const request = await Request.findOneAndDelete({ id: req.params.id });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json({ message: 'Request deleted' });
  } catch (err) {
    console.error(`Error deleting request ${req.params.id}:`, err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;