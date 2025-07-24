const socketIo = require("socket.io");
const roomModel = require("../model/roomModel");

module.exports.socketIo = (server) => {
  const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    let currentRoom = null;
    const userCounts = new Map();

    socket.on("join-room", async (roomId) => {
      currentRoom = roomId;
      socket.join(roomId);

      // Update user count
      const room = io.sockets.adapter.rooms.get(roomId);
      const count = room ? room.size : 0;
      io.to(roomId).emit("user-count", count);

      // Send existing drawing data
      const roomData = await roomModel.findOne({ roomId });
      if (roomData) {
        socket.emit("init-drawing", roomData.drawingData);
      }
    });

    socket.on("cursor-move", (data) => {
      socket.to(currentRoom).emit("cursor-move", {
        userId: socket.id,
        x: data.x,
        y: data.y,
        color: data.color,
      });
    });

    socket.on("draw-start", (data) => {
      socket.to(currentRoom).emit("draw-start", data);
    });

    socket.on("draw-move", (data) => {
      socket.to(currentRoom).emit("draw-move", data);
    });

    socket.on("draw-end", async (data) => {
      socket.to(currentRoom).emit("draw-end", data);

      // Save to database
      if (currentRoom) {
        await roomModel.updateOne(
          { roomId: currentRoom },
          {
            $push: {
              drawingData: { type: "stroke", data, timestamp: new Date() },
            },
            $set: { lastActivity: new Date() },
          },
          { upsert: true }
        );
      }
    });

    socket.on("clear-canvas", async () => {
      io.to(currentRoom).emit("clear-canvas");
      if (currentRoom) {
        await roomModel.updateOne({ roomId: currentRoom }, { drawingData: [] });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      if (currentRoom) {
        const room = io.sockets.adapter.rooms.get(currentRoom);
        const count = room ? room.size : 0;
        io.to(currentRoom).emit("user-count", count);
        socket.to(currentRoom).emit("user-disconnected", socket.id);
      }
    });
  });
};
