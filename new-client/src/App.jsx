import "./App.css";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import History from "./pages/history";
import Navbar from "./components/navbar";

function App() {
  return (
    <>
      <Navbar />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
