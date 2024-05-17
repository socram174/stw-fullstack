import { useEffect, useState } from "react";

const Home = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const getAlerts = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_APP_URL}/alerts`
      );
      const data = await response.json();
      console.log(data);
      console.log(response);
      setLoading(false);
    } catch (err) {
      console.log("Error, could not fetch alerts.");
      setLoading(false);
      setError(true);
    }
  };

  useEffect(() => {
    //getAlerts();
  }, []);
  return (
    <>
      <section
        id="initial"
        className="flex justify-center items-center h-full flex-col"
      >
        <h1 className="font-bold sm:text-8xl text-7xl selection:text-white selection:bg-green-400">
          Daily
        </h1>
        <h1 className="font-bold sm:text-9xl text-8xl text-green-400 selection:text-white selection:bg-green-400">
          vbucks
        </h1>
        <h1 className="font-bold sm:text-8xl text-7xl selection:text-white selection:bg-green-400">
          alerts!
        </h1>

        <a href="#alerts">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-12 h-12 animate-bounce mt-52"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
            />
          </svg>
        </a>
      </section>
      <section
        id="alerts"
        className="h-full flex justify-center items-center flex-col"
      >
        <h1 className="text-4xl font-bold">ALERTS</h1>
        {loading && (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 animate-spin"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
            <h3>Loading Alerts</h3>
          </>
        )}
        {error && (
          <div className="max-w-[90%]  border-2 border-red-700 rounded-md p-4 flex flex-col items-center gap-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-28 h-28 text-red-400 rounded-full bg-red-200 p-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>

            <h3 className="text-red-400 font-bold text-xl">
              Could not fetch the alerts.
            </h3>
          </div>
        )}
      </section>
      <section
        id="notifications-footer"
        className="flex justify-center items-center h-full flex-col gap-4"
      >
        <div id="notifications" className="h-1/2 flex justify-center items-center w-[90%] bg-green-400 rounded-md">
          <h1 className="text-4xl font-bold text-white">NOTIFICATIONS</h1>
        </div>

        <div id="footer" className="h-1/2 flex justify-center items-center flex-col bg-[#242424] w-full">
          <h1 className="text-4xl  text-white">
            Made by{" "}
            <span className="text-green-400 font-bold">Marcos Silva</span>
          </h1>
          <h3 className="text-4xl font-bold text-white">
            {new Date().getFullYear()}
          </h3>
        </div>
      </section>
    </>
  );
};

export default Home;
