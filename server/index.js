const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

// Initialize Socket.io with CORS allowed for React
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // When a user draws, broadcast the data (coords + color) to everyone else
  socket.on("send_drawing", (data) => {
    socket.broadcast.emit("receive_drawing", data);
  });

  // Handle the clear canvas event
  socket.on("clear_canvas", () => {
    socket.broadcast.emit("clear_canvas");
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});