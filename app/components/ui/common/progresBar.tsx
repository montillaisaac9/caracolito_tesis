import React from "react";

interface SpinnerProps {
  isLoading: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({ isLoading }) => {
  return (
    <div
      className={`fixed top-0 left-0 w-full h-full bg-gray-800 bg-opacity-50 flex items-center justify-center z-50 ${
        isLoading ? "block" : "hidden"
      }`}
    >
      {/* Fondo de la pantalla pero permite la visibilidad del contenido */}
      <div className="absolute inset-0 bg-gray-800 bg-opacity-50 z-40"></div>

      {/* El spinner */}
      <div className="w-16 h-16 border-4 border-t-4 border-green-500 border-solid rounded-full animate-spin z-50"></div>
    </div>
  );
};

export default Spinner;
