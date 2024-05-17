const Navbar = () => {
  return (
    <>
      <header className="fixed p-2 bg-white w-full rounded-md">
        <nav>
          <ul className="flex gap-4 p-2 font-bold">
            <li>
              <a href="/">Home</a>
            </li>
            <li>
              <a href="/history">History</a>
            </li>
          </ul>
        </nav>
      </header>
    </>
  );
};

export default Navbar;
