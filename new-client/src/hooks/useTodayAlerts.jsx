import { useState, useEffect } from "react";

export function useTodayAlerts () {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
  
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
  
    const getAlerts = async () => {
      try {
        //console.log(import.meta.env.VITE_BASE_APP_URL);
        const response = await fetch(
          `${import.meta.env.VITE_BASE_APP_URL}/alerts/update`,
          {
            body: JSON.stringify({ date: format(new Date()) }),
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // 'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        await sleep(3000);
        const data = await response.json();
        console.log(data);
        setAlerts(data);
        setLoading(false);
      } catch (err) {
        console.log("Error, could not fetch alerts.");
        setLoading(false);
        setError(true);
      }
    };

    useEffect(() => {
        getAlerts();
    }, []);

    return { alerts, loading, error };
}

