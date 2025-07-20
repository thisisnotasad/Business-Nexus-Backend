const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Request = require('./models/Request');
const Message = require('./models/Message');
const Collaboration = require("./models/Collaboration");
const data = require('./data/data.json');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    console.log('--- Starting Database Reset and Seeding ---');

    // 1. Clear existing data from all relevant collections
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Request.deleteMany({});
    await Message.deleteMany({});
    await Collaboration.deleteMany({});
    console.log('All specified collections cleared.');

    // 2. Insert new data from data.json
    console.log('Inserting new data...');

    // Insert Users
    await User.insertMany(data.users);
    console.log(`Seeded ${data.users.length} users.`);

    // Insert Requests
    await Request.insertMany(data.requests);
    console.log(`Seeded ${data.requests.length} requests.`);

    // Insert Collaborations
    await Collaboration.insertMany(data.collaborations);
    console.log(`Seeded ${data.collaborations.length} collaborations.`);

    // Insert Messages
    await Message.insertMany(data.messages.map(msg => ({
      ...msg,
      senderId: String(msg.senderId),
      timestamp: new Date(msg.timestamp)
    })));
    console.log(`Seeded ${data.messages.length} messages.`);

    // Verify inserted data
    const seededRequests = await Request.find({});
    console.log("Inserted requests:", JSON.stringify(seededRequests, null, 2));
    const seededCollaborations = await Collaboration.find({});
    console.log("Inserted collaborations:", JSON.stringify(seededCollaborations, null, 2));

    console.log('--- Database Reset and Seeding Complete! ---');
    console.log('Data imported successfully.');

    // Close the MongoDB connection
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error connecting to MongoDB or during seeding:', err);
    mongoose.connection.close();
    process.exit(1);
  });