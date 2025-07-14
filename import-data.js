const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Request = require('./models/Request');
const Message = require('./models/Message');
const data = require('./data/data.json');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Request.deleteMany({});
    await Message.deleteMany({});

    // Insert data
    await User.insertMany(data.users);
    await Request.insertMany(data.requests);
    await Message.insertMany(data.messages.map(msg => ({
      ...msg,
      senderId: String(msg.senderId), // Ensure senderId is string
      timestamp: new Date(msg.timestamp) // Convert timestamp to Date
    })));

    console.log('Data imported successfully');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.connection.close();
  });