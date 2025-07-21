//config env
require("dotenv").config({ quiet: true });
const express = require("express");
const http = require("http");
const cors = require("cors");
const app = express();
const server = http.createServer(app);

// Simple Socket.io setup
const { socketIo } = require("./socket/socket");
socketIo(server);

// Basic middleware
app.use(cors());
app.use(express.json());

//importing routes
const roomRoutes = require("./routes/roomRoutes");

// Simple API Routes
app.use("/api/rooms", roomRoutes);

// Connect to MongoDB
const connectToDB = require("./db/dbConnection");
connectToDB();

// Start server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
