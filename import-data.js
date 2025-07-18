const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Request = require('./models/Request');
const Message = require('./models/Message');
const data = require('./data/data.json');
const Collaboration = require("./models/Collaboration");


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
    await Collaboration.deleteMany({});
    console.log("Cleared existing data");



    // Insert Collaborations
    await Collaboration.insertMany(data.collaborations);
    console.log("Seeded collaborations:", data.collaborations.length);
    
    // Insert Users 
    await User.insertMany(data.users);
    console.log("Seeded users:", data.users.length);

    // Insert Requests
    await Request.insertMany(data.requests);
    console.log("Seeded requests:", data.requests.length);

    // Insert Messages
    await Message.insertMany(data.messages.map(msg => ({
      ...msg,
      senderId: String(msg.senderId), // Ensure senderId is string
      timestamp: new Date(msg.timestamp) // Convert timestamp to Date
    })));
    console.log("Seeded messages:", data.messages.length);
    
    // Show confimation
    console.log("Database seeded successfully");

    // Finall
    console.log('Data imported successfully');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.connection.close();
  });