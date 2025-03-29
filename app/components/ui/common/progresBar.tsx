import React from "react";

interface SpinnerProps {
  isLoading: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({ isLoading }) => {
  return (
    <div
      className={`fixed top-0 left-0 w-full h-full bg-gray-800/70 bg-opacity-50 flex items-center justify-center z-50 ${
        isLoading ? "block" : "hidden"
      }`}
    >
      <div className="border-t-4 border-green-500 border-solid w-16 h-16 rounded-full animate-spin"></div>
    </div>
  );
};

export default Spinner;
