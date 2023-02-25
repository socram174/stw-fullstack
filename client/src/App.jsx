import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [datos, setDatos] = useState([]);
  const current = new Date();
  const today = `${current.getDate()}/${current.getMonth()+1}/${current.getFullYear()}`;

  useEffect(() => {
    fetch('http://localhost:3001/alerts/update', {body: JSON.stringify({date: "02/17/2023"}), method: "POST",headers: {'Content-Type': 'application/json'
      // 'Content-Type': 'application/x-www-form-urlencoded',
},})
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setDatos(data);
      });
  }, []);


  return (
    <div className="App">
      <h1>Vbucks alerts for today: {datos.length}</h1>
      <h2>{today}</h2>
      <div style={{backgroundColor: "lightcyan" ,color:"black"}}>
        {datos.map((dato)=> {
          return (
            <div style={{border:"5px solid green"}}>
            <h1>Zone: {dato.zone}</h1>
            <h3>vbucks: {dato.vbucks}</h3>
            <h3>date: {dato.date}</h3>
            <h3>Power Level: {dato.powerLevel}</h3>
            </div>
          )
          
          
        })}
      </div>
    </div>
  )
}

export default App
