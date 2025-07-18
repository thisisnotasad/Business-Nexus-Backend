const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const Message = require("./models/Message");
const userRoutes = require("./routes/users");
const requestRoutes = require("./routes/requests");
const messageRoutes = require("./routes/messages");
const collaborationRoutes = require("./routes/collaborations");

// Enable Socket.IO debug logging
const debug = require("debug")("socket.io:server");

// Load environment variables from .env file
dotenv.config();

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS for development and production
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", // Vite dev server
      "https://business-nexus-phi.vercel.app", // Vercel production
      "https://business-nexuss.netlify.app", // Netlify production
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware for CORS and JSON parsing
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://business-nexus-phi.vercel.app",
      "https://business-nexuss.netlify.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);
app.use(express.json());

// Connect to MongoDB with retry mechanism
const connectDB = async () => {
  let retries = 5;
  while (retries) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("Connected to MongoDB");
      break;
    } catch (err) {
      console.error("MongoDB connection error:", err.message);
      retries -= 1;
      if (retries === 0) {
        console.error("Failed to connect to MongoDB after retries. Exiting...");
        process.exit(1);
      }
      console.log(`Retrying MongoDB connection (${retries} attempts left)...`);
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
    }
  }
};
connectDB();

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Handle incoming messages
  socket.on("message", async (msg) => {
    try {
      // Save message to MongoDB, using client-provided ID
      const message = new Message({
        ...msg,
        timestamp: new Date(msg.timestamp), // Ensure timestamp is a Date object
      });
      await message.save();
      console.log("Message saved:", message);
      // Broadcast message to the chat room
      io.emit(`chat:${msg.chatId}`, message);
    } catch (err) {
      console.error("Error saving message:", err.message);
      // Notify client of error
      socket.emit("message_error", {
        error: "Failed to save message. Please try again.",
      });
    }
  });

  // Handle typing events
  socket.on("typing", ({ chatId }) => {
    console.log(`Typing in chat:${chatId}`);
    socket.broadcast.emit(`typing:${chatId}`);
  });

  // Handle stop typing events
  socket.on("stopTyping", ({ chatId }) => {
    console.log(`Stopped typing in chat:${chatId}`);
    socket.broadcast.emit(`stopTyping:${chatId}`);
  });

  // Handle message read events
  socket.on("read", async ({ messageId, chatId }) => {
    try {
      const message = await Message.findOneAndUpdate(
        { id: messageId },
        { read: true },
        { new: true }
      );
      if (message) {
        console.log(`Message marked as read: ${messageId}`);
        io.emit(`chat:${chatId}`, message);
      } else {
        console.error(`Message not found: ${messageId}`);
        socket.emit("read_error", {
          error: "Message not found.",
        });
      }
    } catch (err) {
      console.error("Error marking message as read:", err.message);
      socket.emit("read_error", {
        error: "Failed to mark message as read.",
      });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// API routes
app.use("/users", userRoutes);
app.use("/requests", requestRoutes);
app.use("/messages", messageRoutes);
app.use("/collaborations", collaborationRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Startup Platform API" });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});