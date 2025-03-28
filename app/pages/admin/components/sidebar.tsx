"use client";

import { JSX } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useRouter } from "next/navigation"; // Importar useRouter

interface SidebarLink {
  name: string;
  href: string;
  icon: JSX.Element;
  select: boolean;
}

interface SidebarProps {
  links: SidebarLink[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSelectLink: (href: string) => void; // Nuevo callback
}

export default function Sidebar({ links, isOpen, setIsOpen, onSelectLink }: SidebarProps) {
  const router = useRouter(); // Hook para navegar

  return (
    <div
      className={`
        bg-gray-900 text-white flex flex-col
        ${isOpen ? "w-40" : "w-28"}
        transition-all duration-300
        h-screen
        absolute
      `}
    >
      {/* Botón para colapsar/expandir el sidebar */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-white hover:bg-gray-700"
      >
        {isOpen ? <FiChevronLeft /> : <FiChevronRight />}
      </button>

      {/* Navegación */}
      <nav className="mt-4 flex flex-col gap-2">
        {links.map((link, index) => (
          <button
            key={index}
            onClick={() => {
              onSelectLink(link.href); // Actualiza el estado de selección
              router.push(link.href); // Navega a la ruta sin refrescar la página
            }}
            className={`flex items-center gap-2 p-2 rounded-md transition-colors duration-300 
              ${link.select ? "bg-blue-600 text-white font-semibold" : "hover:bg-gray-700 text-gray-300"}`}
          >
            {/* Icono */}
            <span>{link.icon}</span>

            {/* Texto (oculto si está colapsado) */}
            <span
              className={`whitespace-nowrap overflow-hidden transition-opacity duration-300 ${
                isOpen ? "opacity-100" : "opacity-0 w-0"
              }`}
            >
              {link.name}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
