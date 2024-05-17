import { NavLink } from "react-router-dom";

const Navbar = () => {
  return (
    <>
      <header className="fixed p-2 bg-white w-full rounded-md">
        <nav>
          <ul className="flex gap-4 p-2 font-bold">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive ? "bg-green-500 text-white p-2 rounded-md" : "p-2 rounded-md"
                }
              >
                Home
              </NavLink>
            </li>
            <h3 className="text-green-500">|</h3>
            <li>
              <NavLink
                to="/history"
                className={({ isActive }) =>
                  isActive ? "bg-green-500 text-white p-2 rounded-md" : "p-2 rounded-md"
                }
              >
                History
              </NavLink>
            </li>
          </ul>
        </nav>
      </header>
    </>
  );
};

export default Navbar;
