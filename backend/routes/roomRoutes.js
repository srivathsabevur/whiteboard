const express = require("express");
const router = express.Router();
const roomModel = require("../model/roomModel");

router.get("/:id", async (req, res) => {
  const room = await roomModel.findOne({ roomId: req.params.roomId });
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

module.exports = router;
