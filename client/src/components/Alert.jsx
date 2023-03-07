import { useState, useEffect } from "react";
import {Bolt} from '@mui/icons-material';
import { Box } from "@mui/system";

const AlertComp = ({ alert }) => {

  return (
    <Box sx={{ border: "5px solid green",backgroundColor: "#8a817c", color: "black", borderRadius:"15px" }}>
        <h1 style={{color: "#660708"}}>Zone: {alert.zone}</h1>
        <h3 style={{color: "#3c6e71"}}>vbucks: {alert.vbucks}</h3>
        <h3>date: {alert.date}</h3>
        <h3>Power Level: <Bolt style={{color: "yellow"}} />{alert.powerLevel}</h3>
    </Box>
  );
}

export default AlertComp;