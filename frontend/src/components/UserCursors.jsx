import React from "react";

const UserCursors = ({ cursors }) => {
  return (
    <>
      {Object.entries(cursors).map(([userId, cursor]) => (
        <div
          key={userId}
          style={{
            position: "absolute",
            left: cursor.x - 8,
            top: cursor.y - 8,
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            backgroundColor: cursor.color,
            border: "2px solid white",
            boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
            pointerEvents: "none",
            zIndex: 999,
            transition: "all 0.1s ease-out",
            transform: "scale(1.2)",
          }}
        >
          {/* Cursor pointer tail */}
          <div
            style={{
              position: "absolute",
              top: "14px",
              left: "4px",
              width: "0",
              height: "0",
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderTop: `8px solid ${cursor.color}`,
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
            }}
          />

          {/* Optional: User ID label */}
          <div
            style={{
              position: "absolute",
              top: "-30px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: cursor.color,
              color: "white",
              padding: "2px 6px",
              borderRadius: "10px",
              fontSize: "10px",
              fontWeight: "bold",
              whiteSpace: "nowrap",
              opacity: "0.8",
            }}
          >
            {userId.substring(0, 6)}
          </div>
        </div>
      ))}
    </>
  );
};

export default UserCursors;
