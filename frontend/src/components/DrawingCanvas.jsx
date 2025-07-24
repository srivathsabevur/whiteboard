import React, { useRef, useState, useEffect, useCallback } from "react";
import io from "socket.io-client";
import axios from "axios";
import Toolbar from "./Toolbar";
import UserCursors from "./UserCursors";
import { Users } from "lucide-react";

const DrawingCanvas = ({ roomId }) => {
  const BASE_URL = "http://localhost:5000";
  const canvasRef = useRef(null);

  const [socket, setSocket] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [thickness, setThickness] = useState(5);
  const [color, setColor] = useState("black");
  const [showSlider, setShowSlider] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [otherCursors, setOtherCursors] = useState({});
  const [activeUsers, setActiveUsers] = useState(0);

  // Handle drawing start
  const handleStartDrawing = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.nativeEvent.clientX - rect.left;
    const y = e.nativeEvent.clientY - rect.top;
    setDrawing(true);
    setCurrentPath([{ x, y }]);

    if (socket) {
      socket.emit("draw-start", {
        roomId,
        x,
        y,
        color,
        width: thickness,
      });
    }
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  // Handle drawing move
  const handleDraw = (e) => {
    if (!drawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.nativeEvent.clientX - rect.left;
    const y = e.nativeEvent.clientY - rect.top;

    setCurrentPath((prev) => [...prev, { x, y }]);
    if (socket) {
      socket.emit("draw-move", {
        roomId,
        x,
        y,
      });
    }
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // Handle drawing end and store in DB using Axios
  const handleStopDrawing = async () => {
    setDrawing(false);

    if (currentPath.length > 1) {
      try {
        await axios.post(`${BASE_URL}/api/rooms/${roomId}/draw`, {
          type: "stroke",
          data: {
            path: currentPath,
            color,
            width: thickness,
          },
          timestamp: new Date(),
        });

        // Notify peers for instant drawing (no storage)
        if (socket) {
          socket.emit("draw-end", {
            roomId,
            path: currentPath,
            color,
            width: thickness,
          });
        }
      } catch (error) {
        console.error("Failed to save drawing:", error);
      }
    }

    setCurrentPath([]);
    const ctx = canvasRef.current.getContext("2d");
    ctx.closePath();
  };

  // Handle clear event and persist using Axios
  const handleClearCanvas = async () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    try {
      await axios.post(`${BASE_URL}/api/rooms/${roomId}/clear`, {
        type: "clear",
        data: {},
        timestamp: new Date(),
      });
      if (socket) socket.emit("clear-canvas", { roomId });
    } catch (error) {
      console.error("Failed to clear canvas:", error);
    }
  };

  const handleColorChange = (colorObj) => {
    setColor(colorObj.hex || colorObj);
  };

  const handleThicknessChange = (e) => {
    setThickness(Number(e.target.value));
  };

  // Cursor tracking
  const handleMouseMove = useCallback(
    (e) => {
      if (drawing) handleDraw(e);

      if (socket && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.nativeEvent.clientX - rect.left;
        const y = e.nativeEvent.clientY - rect.top;
        socket.emit("cursor-move", {
          roomId,
          x,
          y,
          color: getCursorColor(socket.id),
          userId: socket.id,
        });
      }
    },
    [drawing, socket, roomId, thickness, color]
  );

  const handleMouseLeave = () => {
    if (socket) {
      socket.emit("cursor-leave", { roomId, userId: socket.id });
    }
  };

  // Assign deterministic color to user
  const getCursorColor = (userId) => {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
    ];
    if (!userId) return "#000";
    const index =
      userId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
      colors.length;
    return colors[index];
  };

  // Draw path given array of points
  const drawPath = (path, c, w) => {
    if (!path || path.length < 2) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.closePath();
  };

  // Load full drawing history from backend via Axios
  useEffect(() => {
    const fetchDrawingData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/rooms/${roomId}`);
        const drawingData = res.data?.drawingData || [];
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        drawingData.forEach((cmd) => {
          if (cmd.type === "stroke") {
            drawPath(cmd.data.path, cmd.data.color, cmd.data.width);
          } else if (cmd.type === "clear") {
            ctx.clearRect(
              0,
              0,
              canvasRef.current.width,
              canvasRef.current.height
            );
          }
        });
      } catch (err) {
        console.error("Failed to fetch initial drawing data:", err);
      }
    };

    fetchDrawingData();
  }, [roomId]);

  // Socket setup: for real-time sync, not for fetch/store
  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.emit("join-room", roomId);

    newSocket.on("draw-start", (data) => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(data.x, data.y);
      ctx.strokeStyle = data.color;
      ctx.lineWidth = data.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    });

    newSocket.on("draw-move", (data) => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.lineTo(data.x, data.y);
      ctx.stroke();
    });

    newSocket.on("draw-end", (data) => {
      if (data.path) drawPath(data.path, data.color, data.width);
      const ctx = canvasRef.current.getContext("2d");
      ctx.closePath();
    });

    newSocket.on("clear-canvas", () => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    });

    // Cursor tracking & presence
    newSocket.on("cursor-move", (data) => {
      if (data.userId !== newSocket.id) {
        setOtherCursors((prev) => ({
          ...prev,
          [data.userId]: {
            x: data.x,
            y: data.y,
            color: data.color,
            lastSeen: Date.now(),
          },
        }));
      }
    });

    newSocket.on("cursor-leave", (data) => {
      setOtherCursors((prev) => {
        const updated = { ...prev };
        delete updated[data.userId];
        return updated;
      });
    });

    newSocket.on("user-count", (count) => setActiveUsers(count));

    newSocket.on("user-disconnected", (userId) => {
      setOtherCursors((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    });

    const cleanup = setInterval(() => {
      const now = Date.now();
      setOtherCursors((prev) => {
        const updated = {};
        Object.entries(prev).forEach(([uid, cur]) => {
          if (now - cur.lastSeen < 3000) updated[uid] = cur;
        });
        return updated;
      });
    }, 1000);

    return () => {
      newSocket.emit("leave-room", roomId);
      newSocket.disconnect();
      clearInterval(cleanup);
    };
  }, [roomId]);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <div className="absolute flex justify-items-center gap-2 top-[20px] right-[20px] z-10 border font-semibold border-gray-200 font-xl px-4 py-2 rounded-full">
        <Users /> {activeUsers} User{activeUsers !== 1 ? "s" : ""} online
      </div>

      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleStartDrawing}
        onMouseMove={handleMouseMove}
        onMouseUp={handleStopDrawing}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor: "crosshair",
          display: "block",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />

      <UserCursors cursors={otherCursors} />

      <Toolbar
        showColors={showColors}
        showSlider={showSlider}
        setShowColors={setShowColors}
        setShowSlider={setShowSlider}
        handleClearCanvas={handleClearCanvas}
        handleColorChange={handleColorChange}
        handleThicknessChange={handleThicknessChange}
        thickness={thickness}
        color={color}
      />
    </div>
  );
};

export default DrawingCanvas;
