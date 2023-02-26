import { useState, useEffect } from "react";

const Alert = ({ alert }) => {

  return (
    <div style={{ border: "5px solid green" }}>
        <h1>Zone: {alert.zone}</h1>
        <h3>vbucks: {alert.vbucks}</h3>
        <h3>date: {alert.date}</h3>
        <h3>Power Level: {alert.powerLevel}</h3>
    </div>
  );
}

export default Alert;