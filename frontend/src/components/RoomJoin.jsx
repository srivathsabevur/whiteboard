import { useState } from "react";
import { useNavigate } from "react-router-dom";

const RoomJoin = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");

  const generateRoomIdCode = (length) => {
    return Math.random()
      .toString(36)
      .substring(2, 2 + length);
  };

  const generateNewRoom = () => {
    const newRoomId = generateRoomIdCode(6);
    navigate(`/${newRoomId}`);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    alert(roomId);
    navigate(`/${roomId}`);
  };
  return (
    <div className="flex justify-center items-center h-[70vh]">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col p-6 text-white bg-fuchsia-500 rounded-lg shadow-2xl md:w-1/6 w-1/3"
      >
        <div className="flex flex-col w-full mb-2">
          <label for="roomId" className="text-2xl font-semibold mb-3">
            Room ID
          </label>
          <input
            className="px-1 py-2 focus:outline-none border rounded-lg"
            id="roomId"
            type="text"
            placeholder="Enter room id"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
        </div>
        {roomId && (
          <button
            type="submit"
            className="px-4 py-2 text-base font-semibold bg-white text-black mt-3 rounded-full"
          >
            Join Room
          </button>
        )}
        <label className="text-center mt-2">Or generate a new room</label>
        <button
          type="button"
          onClick={generateNewRoom}
          className="px-4 py-2 text-base font-semibold bg-white text-black mt-3 rounded-full"
        >
          Generate Room
        </button>
      </form>
    </div>
  );
};

export default RoomJoin;
