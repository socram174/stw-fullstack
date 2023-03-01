import { useState, useEffect } from "react";
import {Bolt} from '@mui/icons-material';

const AlertComp = ({ alert }) => {

  return (
    <div style={{ border: "5px solid green",backgroundColor: "lightcyan", color: "black", borderRadius:"15px" }}>
        <h1>Zone: {alert.zone}</h1>
        <h3>vbucks: {alert.vbucks}</h3>
        <h3>date: {alert.date}</h3>
        <h3>Power Level: <Bolt style={{color: "yellow"}} />{alert.powerLevel}</h3>
    </div>
  );
}

export default AlertComp;