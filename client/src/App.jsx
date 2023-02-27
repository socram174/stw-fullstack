import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
import Alert from "./widgets/Alert";

function App() {
  const [count, setCount] = useState(0);
  const [datos, setDatos] = useState([]);
  const [totalVbucks, setTotalVbucks] = useState(0);
  const current = new Date();
  const today = format(new Date());

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
      });
  }, []);
  useEffect(() => {
    updateVbucks();
  }, [datos]);

  return (
    <div className="App">
      {noMissions ? (
        <div
          style={{
            backgroundColor: "lightcyan",
            color: "black",
            padding: "10px",
          }}
        >
          No vbucks missions for today :(
        </div>
      ) : (
        <div>
          <h1>Vbucks alerts for today: {datos.length}</h1>
          <h2>{today}</h2>
          <div style={{ backgroundColor: "lightcyan", color: "black" }}>
            {datos.map((dato) => {
              return <Alert alert={dato} />;
            })}
          </div>
          <h1>Total vbucks: {totalVbucks}</h1>
          <h6>V 0.0.1 - 2023</h6>
        </div>
      )}
    </div>
  );
}

export default App;
