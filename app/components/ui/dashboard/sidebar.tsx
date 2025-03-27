// components/ui/sidebar/Sidebar.tsx
"use client";

import { JSX } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface SidebarLink {
  name: string;
  href: string;
  icon: JSX.Element;
}

interface SidebarProps {
  links: SidebarLink[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ links, isOpen, setIsOpen }: SidebarProps) {
  return (
    <div
      className={`
        bg-gray-900 text-white flex flex-col
        ${isOpen ? "w-64" : "w-16"}
        transition-all duration-300
        h-screen
      `}
    >
      {/* Botón para colapsar/expandir el sidebar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-white hover:bg-gray-700"
      >
        {isOpen ? <FiChevronLeft /> : <FiChevronRight />}
      </button>

      {/* Navegación */}
      <nav className="mt-4 flex flex-col gap-2">
        {links.map((link, index) => (
          <a
            key={index}
            href={link.href}
            className="flex items-center gap-2 p-2 hover:bg-gray-700"
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
          </a>
        ))}
      </nav>
    </div>
  );
}

