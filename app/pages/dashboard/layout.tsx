"use client";

import { useState } from "react";
import { FiHome, FiBook, FiUser, FiMenu, FiBell } from "react-icons/fi";
import Sidebar from "@/app/components/ui/common/sidebar";
import useUserStore from "@/app/stores/useUserStore";

const colors = {
  primary: '#1E0A63',
  secondary: '#241476',
  accent: '#A4DAF6',
  lightSecondary: '#D3F0FF',
  background: '#F2FBFF',
} as const;

const initialLinks = [
  { name: "Dashboard", href: "/pages/dashboard", icon: <FiHome />, select: true , role: "ADMIN" },
  { name: "Dashboard", href: "/pages/dashboard", icon: <FiHome />, select: true , role: "TEACHER" },
  { name: "Módulos", href: "/pages/dashboard/module", icon: <FiBook />, select: false },
  { name: "Perfiles", href: "/pages/dashboard/perfil", icon: <FiUser />, select: false, role: "ADMIN" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedLink, setSelectedLink] = useState("");
  const { user } = useUserStore();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleSelectLink = (href: string) => {
    setSelectedLink(href);
  };

  // Filter links based on user role
  const filteredLinks = initialLinks.filter((link) => {
    if (!link.role) return true;
    return link.role === user?.role;
  });

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(/background.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(5px)',
          WebkitFilter: 'blur(5px)',
        }}
      />
      <div className="fixed inset-0 bg-black/50 z-0" />
      
      {/* Sidebar */}
      <Sidebar 
        links={filteredLinks} 
        isOpen={isOpen} 
        setIsOpen={setIsOpen} 
        onSelectLink={handleSelectLink} 
      />
      
      {/* Main Content */}
      <div 
        className="flex-1 flex flex-col overflow-hidden relative z-10"
      >
        {/* Top Bar */}
        <header 
          className="bg-white/90 backdrop-blur-sm shadow-sm p-4 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${colors.lightSecondary}` }}
        >
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full hover:bg-opacity-10 hover:bg-gray-300 cursor-pointer mr-2"
              style={{ color: colors.primary }}
            >
              <FiMenu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold" style={{ color: colors.primary }}>
              {filteredLinks.find((link) => link.href === selectedLink)?.name || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              className="p-2 rounded-full hover:bg-opacity-10 hover:bg-gray-300 cursor-pointer"
              style={{ color: colors.primary }}
            >
            </button>
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full flex items-center justify-center mr-2"
                style={{ backgroundColor: colors.accent, color: colors.primary }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="font-medium" style={{ color: colors.primary }}>
                {user?.name || 'Usuario'}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main 
          className="flex-1 overflow-y-auto p-4 md:p-6"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
        >
          {children}
        </main>
        
        {/* Footer */}
        <footer 
          className="py-4 px-6 text-center text-sm"
          style={{ color: colors.primary, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
        >
          <p> {new Date().getFullYear()} Entorno de Aprendizaje Interactivo - UNERG</p>
        </footer>
      </div>
    </div>
  );
}
