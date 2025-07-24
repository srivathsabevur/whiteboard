const mongoose = require("mongoose");

const drawingSchema = new mongoose.Schema({
  type: String, // 'stroke', 'clear'
  data: Object, // Contains path data, color, width, etc.
  timestamp: Date,
  roomId: {
    type: String,
    ref: "Room",
  },
});

const drawingModel = mongoose.model("drawing", drawingSchema);

module.exports = drawingModel;
