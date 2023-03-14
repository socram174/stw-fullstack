import { Box, Typography, useMediaQuery } from "@mui/material";
import AlertComp from "../../components/Alert";
import { useState, useEffect } from "react";


function AlertHistory(){

  const [datos, setDatos] = useState([]);
  const [totalVbucks, setTotalVbucks] = useState(0);
  const current = new Date();
  const [loading, setLoading] = useState(true);
  const isNonMobileScreens = useMediaQuery("(min-width: 1200px)");
  var stone = 0;

  const noMissions = datos.length == 1 && datos[0].vbucks == 0;

  var stoneArray = [];
  var plankArray = [];
  var cannyArray = [];
  var twineArray = [];

  datos.map((dato) => {
    if(dato.zone.name == "Stonewood"){
      stone += 1;
      stoneArray.push(dato);
    }
    else if(dato.zone.name == "Plankerton"){
      plankArray.push(dato);
    }
    else if(dato.zone.name == "Canny Valley"){
      cannyArray.push(dato);
    }
    else if(dato.zone.name == "Twine Peaks"){
      twineArray.push(dato);
    }
  });

  const updateVbucks = () => {
    let total = 0;
    datos.forEach((dato) => {
      total += dato.vbucks;
    });
    setTotalVbucks(total);
  };


  useEffect(() => {
    fetch(`${import.meta.env.VITE_BASE_APP_URL}/alerts`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setDatos(data);
      });
  }, []);
  useEffect(() => {
    updateVbucks();
  }, [datos]);


  return (

    <div>
      {isNonMobileScreens ? (    <div style={{height:"100vh",marginTop:"100px", color:"orangered", width:"1280px", margin:"0 auto", padding:"2rem"}}>
        <h1>Alert History</h1>
        <h6>Alerts: {datos.length}</h6>
        <div style={{display:"flex", gap:"15px", justifyContent:"center"}}>
          <Box style={{border:"5px solid black", width:"200px", height:"200px"}}><Typography>Stonewood/{stone}</Typography></Box>
          <div style={{border:"5px solid red", width:"200px", height:"200px"}}><Typography>Plankerton</Typography></div>
          <div style={{border:"5px solid yellow", width:"200px", height:"200px"}}><Typography>Canny Valley</Typography></div>
          <div style={{border:"5px solid red", width:"200px", height:"200px"}}><Typography>Twine Peaks</Typography></div>
        </div>

        <h1>Total vbcuks since 11/27/22: {totalVbucks}</h1>

    </div>):(
          <div style={{height:"100vh",marginTop:"100px", color:"orangered",margin:"0 auto", padding:"2rem"}}>
          <h1>Alert History</h1>
          <h6>Alerts: {datos.length}</h6>
          <div style={{display:"flex", gap:"15px", flexDirection:"column",alignItems:"center"}}>
            <Box style={{border:"5px solid black", width:"200px", height:"200px"}}><Typography>Stonewood/{stone}</Typography></Box>
            <div style={{border:"5px solid red", width:"200px", height:"200px"}}><Typography>Plankerton</Typography></div>
            <div style={{border:"5px solid yellow", width:"200px", height:"200px"}}><Typography>Canny Valley</Typography></div>
            <div style={{border:"5px solid red", width:"200px", height:"200px"}}><Typography>Twine Peaks</Typography></div>
          </div>
  
          <h1>Total vbcuks since 11/27/22: {totalVbucks}</h1>
  
      </div>
    )}
    </div>
  )
};
export default AlertHistory;