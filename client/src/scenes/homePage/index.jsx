import { Box, useMediaQuery,Typography,Card } from "@mui/material";
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
  const isNonMobileScreens = useMediaQuery("(min-width: 1200px)");

  const noMissions = datos.length == 1 && datos[0].vbucks == 0;

  var stoneArray = [];
  var plankArray = [];
  var cannyArray = [];
  var twineArray = [];

  datos.map((dato) => {
    if (dato.zone.name == "Stonewood") {
      stoneArray.push(dato);
    } else if (dato.zone.name == "Plankerton") {
      plankArray.push(dato);
    } else if (dato.zone.name == "Canny Valley") {
      cannyArray.push(dato);
    } else if (dato.zone.name == "Twine Peaks") {
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
        <Box sx={{display:"flex",height:"100vh",justifyContent:"center",alignItems:"center"}}>
          <h1>Loading...</h1>
        </Box>
      ): (
        noMissions ? (
          <Box sx={{display:"flex",height:"100vh",justifyContent:"center",alignItems:"center"}}>
            <Alert variant="outlined" severity="info">
              <AlertTitle><strong>Info</strong></AlertTitle>
              No vbucks missions for today.
            </Alert>
          </Box>
        ) : (
         isNonMobileScreens ? (
          <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <Box
            sx={{
              border: '1px solid #2E4F4F',
              p: '10px',
              borderRadius: '10px',
              backgroundColor: '#F8F8F8',
              display: 'flex',
              justifyContent: 'center',
              maxWidth: '1000px',
              gap: '10px',
            }}
          >
            <Box
              sx={{
                width: '15rem',
                border: '1px solid green',
                p: '15px',
                borderRadius: '8px',
              }}
            >
              <Typography variant="h4" component="div" sx={{ textAlign: 'center' }}>
                Stonewood
              </Typography>
              {stoneArray.map((dato) => <AlertComp alert={dato} />)}
            </Box>
            <Box
              sx={{
                width: '15rem',
                border: '1px solid green',
                p: '15px',
                borderRadius: '8px',
              }}
            >
              <Typography variant="h4" component="div">
                Plankerton
              </Typography>
              {plankArray.map((dato) => <AlertComp alert={dato} />)}

            </Box>
            <Box
              sx={{
                width: '15rem',
                border: '1px solid green',
                p: '15px',
                borderRadius: '8px',
              }}
            >
              <Typography variant="h4" component="div">
                Canny Valley
              </Typography>
              {cannyArray.map((dato) => <AlertComp alert={dato} />)}
            </Box>
            <Box
              sx={{
                width: '15rem',
                border: '1px solid green',
                p: '15px',
                borderRadius: '8px',
              }}
            >
              <Typography variant="h4" component="div">
                Twine Peaks
              </Typography>
              {twineArray.map((dato) => <AlertComp alert={dato} />)}


            </Box>
          </Box>
        </Box>
         ):(
          <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <Box
            sx={{
              border: '1px solid #2E4F4F',
              p: '10px',
              borderRadius: '10px',
              backgroundColor: '#F8F8F8',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              maxWidth: '1000px',
              gap: '10px',
            }}
          >
            <Box
              sx={{
                width: '15rem',
                border: '1px solid green',
                p: '15px',
                borderRadius: '8px',
              }}
            >
              <Typography variant="h4" component="div" sx={{ textAlign: 'center' }}>
                Stonewood
              </Typography>
              {stoneArray.map((dato) => <AlertComp alert={dato} />)}
            </Box>
            <Box
              sx={{
                width: '15rem',
                border: '1px solid green',
                p: '15px',
                borderRadius: '8px',
              }}
            >
              <Typography variant="h4" component="div">
                Plankerton
              </Typography>
              {plankArray.map((dato) => <AlertComp alert={dato} />)}

            </Box>
            <Box
              sx={{
                width: '15rem',
                border: '1px solid green',
                p: '15px',
                borderRadius: '8px',
              }}
            >
              <Typography variant="h4" component="div">
                Canny Valley
              </Typography>
              {cannyArray.map((dato) => <AlertComp alert={dato} />)}
            </Box>
            <Box
              sx={{
                width: '15rem',
                border: '1px solid green',
                p: '15px',
                borderRadius: '8px',
              }}
            >
              <Typography variant="h4" component="div">
                Twine Peaks
              </Typography>
              {twineArray.map((dato) => <AlertComp alert={dato} />)}


            </Box>
          </Box>
        </Box>
         )
        )
      )}
      <h6>V 0.1.0 - 2023</h6>
    </div>
  );
};
export default HomePage;
