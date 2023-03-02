import { useState, useEffect } from "react";
import "./App.css";
import CssBaseline from '@mui/material/CssBaseline';
import HomePage from './scenes/homePage/index.jsx';
import NavBar from "./scenes/navbar/index.jsx";

function App() {

  return (
    <div className="App">
      <CssBaseline />
      <NavBar />
      <HomePage />
    </div>
  );
}

export default App;
