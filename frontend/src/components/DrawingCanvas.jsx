import React, { useEffect, useState, useCallback, useRef } from "react";
import Toolbar from "./Toolbar";
import UserCursors from "./UserCursors";
import io from "socket.io-client";

const DrawingCanvas = ({ roomId }) => {
  const canvasRef = useRef(null);
  const cursorThrottleRef = useRef(null);

  const [drawing, setDrawing] = useState(false);
  const [socket, setSocket] = useState(null);
  const [thickness, setThickness] = useState(5);
  const [color, setColor] = useState("black");
  const [showSlider, setShowSlider] = useState(false);
  const [showColors, setShowColors] = useState(false);

  // States for cursor tracking and user presence
  const [otherCursors, setOtherCursors] = useState({});
  const [activeUsers, setActiveUsers] = useState(0);
  const [currentPath, setCurrentPath] = useState([]);

  const handleStopDrawing = () => {
    if (!drawing) return;
    setDrawing(false);
    const ctx = canvasRef.current.getContext("2d");
    ctx.closePath();

    if (socket && currentPath.length > 0) {
      socket.emit("draw-end", {
        path: currentPath,
        color: color,
        width: thickness,
        roomId: roomId,
      });
      setCurrentPath([]);
    }
  };

  const handleStartDrawing = (e) => {
    const ctx = canvasRef.current.getContext("2d");
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDrawing(true);
    setCurrentPath([{ x, y }]);

    ctx.lineWidth = thickness;
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);

    if (socket) {
      socket.emit("draw-start", {
        x: x,
        y: y,
        color: color,
        width: thickness,
        roomId: roomId,
      });
    }
  };

  const handleDraw = (e) => {
    if (!drawing) return;

    const ctx = canvasRef.current.getContext("2d");
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();

    const newPath = [...currentPath, { x, y }];
    setCurrentPath(newPath);

    if (socket) {
      socket.emit("draw-move", {
        roomId: roomId,
        x: x,
        y: y,
      });
    }
  };

  // Handle cursor movement for real-time tracking
  const handleMouseMove = useCallback(
    (e) => {
      // Handle drawing if currently drawing
      if (drawing) {
        handleDraw(e);
      }

      // Handle cursor tracking
      if (socket && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Throttle cursor updates to ~60fps
        if (cursorThrottleRef.current) {
          clearTimeout(cursorThrottleRef.current);
        }

        cursorThrottleRef.current = setTimeout(() => {
          socket.emit("cursor-move", {
            roomId: roomId,
            x: x,
            y: y,
            userId: socket.id,
            color: getCursorColor(socket.id),
          });
        }, 16); // ~60fps
      }
    },
    [drawing, socket, roomId, color, thickness]
  );

  const handleMouseLeave = () => {
    if (socket) {
      socket.emit("cursor-leave", {
        roomId: roomId,
        userId: socket.id,
      });
    }
  };

  const handleThicknessChange = (e) => {
    setThickness(e.target.value);
  };

  const handleClearCanvas = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (socket) {
      socket.emit("clear-canvas", { roomId });
    }
  };

  const handleColorChange = (selectedColor) => {
    setColor(selectedColor.hex);
  };

  // Generate cursor color based on user ID
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
    const index =
      userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors.length;
    return colors[index];
  };

  // Draw path helper function
  const drawPath = (path, strokeColor, lineWidth) => {
    if (!path || path.length < 2) return;

    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);

    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.closePath();
  };

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(`http://localhost:5000`); // Changed port to match project overview

    newSocket.on("connect", () => {
      console.log(`Connected with ID: ${newSocket.id}`);
    });

    setSocket(newSocket);

    // Join room using the specified event name
    newSocket.emit("join-room", roomId);

    // Initialize canvas
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Socket event listeners as per project overview

    // Load initial drawing data
    newSocket.on("init-drawing", (drawingData) => {
      if (drawingData && drawingData.length > 0) {
        drawingData.forEach((command) => {
          if (command.type === "stroke") {
            drawPath(command.data.path, command.data.color, command.data.width);
          } else if (command.type === "clear") {
            context.clearRect(0, 0, canvas.width, canvas.height);
          }
        });
      }
    });

    // Handle drawing events from other users
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
      const ctx = canvasRef.current.getContext("2d");
      ctx.closePath();
      // Optionally redraw the entire path for consistency
      // if (data.path) {
      //   drawPath(data.path, data.color, data.width);
      // }
    });

    // Handle cursor tracking
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

    // Handle canvas clearing
    newSocket.on("clear-canvas", () => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // Handle user count updates
    newSocket.on("user-count", (count) => {
      setActiveUsers(count);
    });

    // Handle user disconnection
    newSocket.on("user-disconnected", (userId) => {
      setOtherCursors((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    });

    // Cleanup old cursors periodically
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setOtherCursors((prev) => {
        const updated = {};
        Object.entries(prev).forEach(([userId, cursor]) => {
          if (now - cursor.lastSeen < 3000) {
            updated[userId] = cursor;
          }
        });
        return updated;
      });
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (cursorThrottleRef.current) {
        clearTimeout(cursorThrottleRef.current);
      }
      newSocket.emit("leave-room", roomId);
      newSocket.disconnect();
      clearInterval(cleanupInterval);
    };
  }, [roomId]);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      {/* User Presence Indicator */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 1000,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          color: "white",
          padding: "10px 15px",
          borderRadius: "25px",
          fontSize: "14px",
          fontFamily: "Arial, sans-serif",
          fontWeight: "bold",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        }}
      >
        👥 {activeUsers} user{activeUsers !== 1 ? "s" : ""} online
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

      {/* Render other users' cursors */}
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
