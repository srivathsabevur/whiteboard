import { useParams } from "react-router-dom";
import DrawingCanvas from "./DrawingCanvas";

const Whiteboard = () => {
  const { roomId } = useParams();
  console.log(roomId);

  return (
    <div className="relative w-full">
      <DrawingCanvas roomId={roomId} />
    </div>
  );
};

export default Whiteboard;
