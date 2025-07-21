const mongoose = require("mongoose");

const drawingSchema = new mongoose.Schema({
  type: String, // 'stroke', 'clear'
  data: Object, // Contains path data, color, width, etc.
  timestamp: Date,
});

const drawingModel = mongoose.model("drawing", drawingSchema);

module.exports = drawingModel;
