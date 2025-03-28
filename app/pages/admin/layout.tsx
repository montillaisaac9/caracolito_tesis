"use client";

import { useState } from "react";
import { FiHome, FiBook, FiUser } from "react-icons/fi";
import Sidebar from "./components/sidebar";

const initialLinks = [
  { name: "Dashboard", href: "/pages/admin", icon: <FiHome />, select: true },
  { name: "Módulos", href: "/pages/admin/module", icon: <FiBook />, select: false },
  { name: "Perfil", href: "/pages/admin/perfil", icon: <FiUser />, select: false },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [links, setLinks] = useState(initialLinks);

  // Función para actualizar la selección de links
  const handleSelectLink = (selectedHref: string) => {
    setLinks(prevLinks =>
      prevLinks.map(link => ({
        ...link,
        select: link.href === selectedHref
      }))
    );
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar colapsable */}
      <Sidebar
        links={links}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onSelectLink={handleSelectLink} // Pasamos la función
      />

      {/* Contenido principal */}
      <main
        className={`
          flex-1 overflow-auto bg-gray-100 p-6
          transition-all duration-300
          ${isSidebarOpen ? "ml-64" : "ml-16"}
        `}
      >
        {children}
      </main>
    </div>
  );
}
