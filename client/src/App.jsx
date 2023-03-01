import { useState, useEffect } from "react";
import "./App.css";
import CssBaseline from '@mui/material/CssBaseline';
import HomePage from './scenes/HomePage';
import NavBar from "./scenes/navbar";

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
