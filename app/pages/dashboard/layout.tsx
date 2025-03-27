// app/dashboard/layout.tsx
"use client";

import Sidebar from "@/app/components/ui/dashboard/sidebar";
import { useState } from "react";
import { FiHome, FiBook, FiUser } from "react-icons/fi";

const dashboardLinks = [
  { name: "Dashboard", href: "/dashboard", icon: <FiHome /> },
  { name: "Módulos", href: "/dashboard/modulos", icon: <FiBook /> },
  { name: "Perfil", href: "/dashboard/perfil", icon: <FiUser /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar colapsable */}
      <Sidebar
        links={dashboardLinks}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
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
