import { Box, useMediaQuery } from "@mui/material";
import AlertComp from "../../components/Alert";
import { useState, useEffect } from "react";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Stack from '@mui/material/Stack';


function HomePage(){
  const [datos, setDatos] = useState([]);
  const [totalVbucks, setTotalVbucks] = useState(0);
  const current = new Date();
  const today = format(new Date());
  const [loading, setLoading] = useState(true);

  const noMissions = datos.length == 1 && datos[0].vbucks == 0;

  const updateVbucks = () => {
    let total = 0;
    datos.forEach((dato) => {
      total += dato.vbucks;
    });
    setTotalVbucks(total);
  };

  function format(inputDate) {
    //Para formatear la fecha a MM/DD/YYYY para que coincida con la base de datos y poder hacer la consulta de las alerts de hoy
    let date, month, year;

    date = inputDate.getDate();
    month = inputDate.getMonth() + 1;
    year = inputDate.getFullYear();

    date = date.toString().padStart(2, "0");

    month = month.toString().padStart(2, "0");

    return `${month}/${date}/${year}`;
  }

  //console.log(today);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BASE_APP_URL}/alerts/update`, {
      body: JSON.stringify({ date: today }),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setDatos(data);
        setLoading(false);
      });
  }, []);
  useEffect(() => {
    updateVbucks();
  }, [datos]);

  return (
    <div style={{maxWidth:"1280px", margin:"auto"}}>
      {loading ? (
        <h1>Loading...</h1>
      ): (
        noMissions ? (
          <div>
            <Alert variant="outlined" severity="info">
              <AlertTitle><strong>Info</strong></AlertTitle>
              No vbucks missions for today.
            </Alert>
          </div>
        ) : (
          <div style={{padding: "2rem", color:"white"}}>
            <h1>Vbucks alerts for today: {datos.length}</h1>
            <h2>{today}</h2>
            <div >
            <Stack spacing={2}>
            {datos.map((dato) => {
                return <AlertComp alert={dato} />;
              })}
        </Stack>
            </div>
            <h1>Total vbucks: {totalVbucks}</h1>
          </div>
        )
      )}
      <h6>V 0.0.2 - 2023</h6>
    </div>
  );
};
export default HomePage;
