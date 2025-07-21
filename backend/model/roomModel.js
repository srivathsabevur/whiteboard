const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomId: String,
  drawingData: Array,
  lastActivity: { type: Date, default: Date.now },
});

const roomModel = mongoose.model("room", roomSchema);

module.exports = roomModel;
