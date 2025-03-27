import React from 'react';
import { FaArrowLeft, FaTimes } from 'react-icons/fa';

interface ModalProps {
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ children }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="relative mb-4">
          <FaArrowLeft className="absolute left-0 top-0 text-white cursor-pointer hover:text-gray-300" />
          <h2 className="text-center text-white text-xl font-bold">Crear una cuenta</h2>
          <FaTimes className="absolute right-0 top-0 text-white cursor-pointer hover:text-gray-300" />
        </div>
        <p className="text-center text-white text-sm mb-4">Información personal</p>
        {children}
      </div>
    </div>
  );
};

export default Modal;