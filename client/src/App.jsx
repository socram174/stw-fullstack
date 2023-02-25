import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [datos, setDatos] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/alerts/update', {body: JSON.stringify({date: "02/23/2023"}), method: "POST",headers: {'Content-Type': 'application/json'
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
      <div>
        <h1>{datos.map((dato)=> {
          return (
            <div>
            <h1>Zone: {dato.zone}</h1>
            <h3>vbucks: {dato.vbucks}</h3>
            <h3>date: {dato.date}</h3>
            <h3>Power Level: {dato.powerLevel}</h3>

            </div>
          )
        })}</h1>
      </div>
    </div>
  )
}

export default App
