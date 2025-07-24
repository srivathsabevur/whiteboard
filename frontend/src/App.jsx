import React from "react";
import Whiteboard from "./components/Whiteboard";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoomJoin from "./components/Roomjoin";
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoomJoin />} />
        <Route path="/:roomId" element={<Whiteboard />} />
      </Routes>
    </Router>
  );
};

export default App;
