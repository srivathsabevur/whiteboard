const express = require("express");
const router = express.Router();
const roomModel = require("../model/roomModel");
const drawingModel = require("../model/drawingModel");

router.get("/:roomId", async (req, res) => {
  const room = await roomModel.findOne({ roomId: req.params.roomId });
  if (!room) {
    const newRoom = await roomModel.create({ roomId: req.params.roomId });
    return res.json(newRoom);
  }

  res.json(room || { error: "Room not found" });
});

router.post("/join", async (req, res) => {
  const { roomId } = req.body;
  let room = await roomModel.findOne({ roomId });

  if (!room) {
    room = new roomModel({ roomId, drawingData: [] });
    await room.save();
  }

  res.json({ success: true, roomId });
});

router.post("/:roomId/draw", async (req, res) => {
  try {
    const drawing = await drawingModel.findOne({ roomId: req.params.roomId });
    if (!drawing) {
      const newDrawing = await drawingModel.create({
        roomId: req.params.roomId,
        type: req.body.type,
        data: req.body.data,
        timestamp: req.body.timestamp,
      });
      return res.json(newDrawing);
    }
    drawing.type = req.body.type;
    drawing.data = req.body.data;
    drawing.timestamp = req.body.timestamp;

    await drawing.save();
    return res.json(drawing);
  } catch (error) {
    console.log(error);
  }
});

router.post("/:roomId/clear", async (req, res) => {
  try {
    const drawing = await drawingModel.findOne({ roomId: req.params.roomId });
    if (!drawing) {
      const newDrawing = await drawingModel.create({
        roomId: req.params.roomId,
        type: req.body.type,
        data: req.body.data,
        timestamp: req.body.timestamp,
      });
      return res.json(newDrawing);
    }
    drawing.type = req.body.type;
    drawing.data = req.body.data;
    drawing.timestamp = req.body.timestamp;

    await drawing.save();
    return res.json(drawing);
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
