import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const Input: React.FC<InputProps> = ({
  className = '',
  ...props
}) => {
  return (
    <input
      {...props}
      className={`w-full bg-white text-black border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#A4DAF6] focus:border-[#1E0A63] ${className}`}
    />
  );
};

export default Input;