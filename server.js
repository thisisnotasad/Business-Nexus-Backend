const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const userRoutes = require("./routes/users");
const requestRoutes = require("./routes/requests");
const messageRoutes = require("./routes/messages");
const collaborationRoutes = require("./routes/collaborations");
const { Server } = require("socket.io");
const http = require("http");
const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173", "https://business-nexus-phi.vercel.app", "https://business-nexuss.netlify.app"],
    methods: ["GET", "POST"],
  },
});

dotenv.config();

app.use(cors({
  origin: ["http://localhost:5173", "https://business-nexus-phi.vercel.app", "https://business-nexuss.netlify.app"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("message", async (msg) => {
    try {
      const message = new Message({ ...msg, id: require("uuid").v4(), timestamp: new Date() });
      await message.save();
      io.emit(`chat:${msg.chatId}`, message);
    } catch (err) {
      console.error("Error saving message:", err.message);
    }
  });
  socket.on("typing", ({ chatId }) => {
    socket.broadcast.emit(`typing:${chatId}`);
  });
  socket.on("stopTyping", ({ chatId }) => {
    socket.broadcast.emit(`stopTyping:${chatId}`);
  });
  socket.on("read", async ({ messageId, chatId }) => {
    try {
      const message = await Message.findOneAndUpdate(
        { id: messageId },
        { read: true },
        { new: true }
      );
      if (message) {
        io.emit(`chat:${chatId}`, message);
      }
    } catch (err) {
      console.error("Error marking message as read:", err.message);
    }
  });
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

app.use("/users", userRoutes);
app.use("/requests", requestRoutes);
app.use("/messages", messageRoutes);
app.use("/collaborations", collaborationRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Startup Platform API" });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));