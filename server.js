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

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://business-nexus-phi.vercel.app",
      "https://business-nexuss.netlify.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

// Middleware
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

// Debug middleware for all routes
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  next();
});

// API routes
app.use("/messages", messageRoutes);
app.use("/users", userRoutes);
app.use("/requests", requestRoutes);
app.use("/collaborations", collaborationRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Startup Platform API" });
});

// Connect to MongoDB
const connectDB = async () => {
  let retries = 5;
  while (retries) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
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
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};
connectDB();

// Socket.IO handlers
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("message", async (msg) => {
    try {
      const message = new Message({
        ...msg,
        id: msg.id || require("uuid").v4(), // Use client ID if provided, else generate
        timestamp: new Date(msg.timestamp),
      });
      await message.save();
      console.log("Message saved:", message);
      io.emit(`chat:${msg.chatId}`, message);
    } catch (err) {
      console.error("Error saving message:", err.message);
      socket.emit("message_error", {
        error: "Failed to save message. Please try again.",
      });
    }
  });

  socket.on("typing", ({ chatId, userId, userName }) => {
    console.log(`Typing in chat:${chatId} by ${userName}`);
    socket.broadcast.emit(`typing:${chatId}`, { userId, userName });
  });

  socket.on("stopTyping", ({ chatId, userId, userName }) => {
    console.log(`Stopped typing in chat:${chatId} by ${userName}`);
    socket.broadcast.emit(`stopTyping:${chatId}`, { userId, userName });
  });

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

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});