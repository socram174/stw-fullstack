import "./App.css";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import History from "./pages/history";
import Navbar from "./components/navbar";
import Notifications from "./components/notifications";
import Footer from "./components/footer";
import ScrollToTop from "./components/scroll";

function App() {
  return (
    <>
      <BrowserRouter>
        <Navbar />
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<History />} />

          <Route path="*" element={<Navigate to='/' />} />
        </Routes>

        <section
          id="notifications-footer"
          className="flex justify-center items-center h-full flex-col gap-4"
        >
          <Notifications />
          <Footer />
        </section>
      </BrowserRouter>
    </>
  );
}

export default App;
