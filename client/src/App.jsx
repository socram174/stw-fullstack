import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import "./App.css";
import CssBaseline from "@mui/material/CssBaseline";
import HomePage from "./scenes/homePage/index.jsx";
import AlertHistory from "./scenes/alertHistory/index.jsx";
import NavBar from "./scenes/navbar/index.jsx";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <CssBaseline />
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/history" element={<AlertHistory />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
