import React from 'react';

interface InputProps {
  type: string;
  placeholder: string;
  name: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  required?: boolean; // Cambiado de string a boolean
  minLength?: number; // Agregado minLength como número opcional
}

const Input: React.FC<InputProps> = ({
  type,
  placeholder,
  name,
  value,
  onChange,
  className,
  required,
  minLength
}) => {
  return (
    <input
      id={name}
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-gray-500 ${className}`}
      required={required}
      minLength={minLength}
    />
  );
};

export default Input;