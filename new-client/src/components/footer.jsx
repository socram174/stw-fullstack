const Footer = () => {
  return (
    <div
      id="footer"
      className="h-1/2 flex justify-center items-center flex-col bg-[#242424] w-full"
    >
      <h1 className="text-3xl text-white text-center">
        Made by <span className="text-green-400 font-bold">Marcos Silva</span>
      </h1>
      <h3 className="text-4xl font-bold text-white">
        {new Date().getFullYear()}
      </h3>
    </div>
  );
};

export default Footer;
