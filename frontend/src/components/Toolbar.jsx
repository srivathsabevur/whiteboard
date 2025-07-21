import { CirclePicker } from "react-color";
import Slider from "@mui/material/Slider";

const Toolbar = ({
  showSlider,
  showColors,
  handleThicknessChange,
  handleColorChange,
  setShowSlider,
  handleClearCanvas,
  setShowColors,
}) => {
  return (
    <div className="absolute bg-white  bottom-5 left-1/2 transform -translate-x-1/2">
      <div
        className={`${
          !showColors && !showSlider ? "hidden" : "flex"
        }  flex-col p-3 gap-3 w-full mx-auto border border-gray-200 rounded-lg mb-3`}
      >
        {showSlider && (
          <Slider
            marks
            min={1}
            max={15}
            defaultValue={5}
            valueLabelDisplay="auto"
            onChange={handleThicknessChange}
          />
        )}
        {showColors && (
          <div className="flex justify-center items-center mx-auto w-full">
            <CirclePicker
              value="#00000"
              onChangeComplete={handleColorChange}
              colors={[
                "#f44336",
                "#e91e63",
                "#9c27b0",
                "#673ab7",
                "#3f51b5",
                "#2196f3",
                "#03a9f4",
                "#00bcd4",
                "#009688",
                "#4caf50",
                "#8bc34a",
                "#cddc39",
                "#ffeb3b",
                "#ffc107",
                "#ff9800",
                "#ff5722",
                "#795548",
                "#607d8b",
                "#000000",
              ]}
            />
          </div>
        )}
      </div>
      <div className="flex p-3 gap-3 border border-gray-300 hover:shadow-2xl rounded-full z-10 transition-all ease-in duration-150">
        <button
          onClick={() => setShowSlider(!showSlider)}
          className="bg-fuchsia-500 px-3 py-2 text-white rounded-full hover:scale-110 transition-all ease-in duration-150 cursor-pointer"
        >
          Change Thickenss
        </button>

        <button
          onClick={handleClearCanvas}
          className="bg-red-500 px-3 py-2 text-white rounded-full hover:scale-110 transition-all ease-in duration-150 cursor-pointer"
        >
          Reset
        </button>
        <button
          onClick={() => setShowColors(!showColors)}
          className="bg-fuchsia-500 px-3 py-2 text-white rounded-full hover:scale-110 transition-all ease-in duration-150 cursor-pointer"
        >
          Change Color
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
