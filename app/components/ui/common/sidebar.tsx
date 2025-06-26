"use client";

import { JSX } from "react";
import { FiChevronLeft, FiChevronRight, FiLogOut } from "react-icons/fi";
import { useRouter } from "next/navigation";
import useUserStore from "@/app/stores/useUserStore";

interface SidebarLink {
  name: string;
  href: string;
  icon: JSX.Element;
  select: boolean;
  role?: string;
}

interface SidebarProps {
  links: SidebarLink[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSelectLink: (href: string) => void;
}

const colors = {
  primary: '#1E0A63',
  secondary: '#241476',
  accent: '#A4DAF6',
  lightSecondary: '#D3F0FF',
  background: '#F2FBFF',
  text: {
    primary: '#1F2937',
    secondary: '#4B5563',
    light: '#F9FAFB',
  },
} as const;

export default function Sidebar({ links, isOpen, setIsOpen, onSelectLink }: SidebarProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useUserStore();

  const handleLogout = () => {
    logout();
    router.push("/pages/auth/login");
  };

  return (
    <div
      className={`
        flex flex-col
        ${isOpen ? "w-64" : "w-20"}
        transition-all duration-300
        h-screen
        sticky top-0
      `}
      style={{ backgroundColor: colors.primary }}
    >
      {/* Logo */}
      <div className="p-4 border-b" style={{ borderColor: colors.secondary }}>
        <div className={`flex items-center justify-center ${isOpen ? 'h-16' : 'h-14'}`}>
          <img 
            src="/logo.png" 
            alt="Logo" 
            className={`transition-all duration-300 ${isOpen ? 'h-48 w-auto' : 'h-14 w-12 rounded-full object-cover'}`}
          />
        </div>
      </div>

      <div className="flex justify-end p-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full hover:bg-opacity-20 hover:bg-white"
          style={{ color: colors.accent }}
        >
          {isOpen ? <FiChevronLeft /> : <FiChevronRight />}
        </button>
      </div>

      {isAuthenticated && (
        <div className="mb-6 mt-2 px-3">
          <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: colors.secondary }}>
            <div
              className={`rounded-full w-10 h-10 flex items-center justify-center`}
              style={{ backgroundColor: colors.accent, color: colors.primary }}
            >
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div
              className={`transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}
            >
              <div className="font-medium truncate" style={{ color: colors.text.light }}>{user?.name || "Usuario"}</div>
              <div className="text-xs truncate" style={{ color: colors.accent }}>{user?.email}</div>
              <div 
                className="text-xs px-2 py-0.5 rounded mt-1 inline-block"
                style={{ 
                  backgroundColor: colors.accent,
                  color: colors.primary,
                  fontWeight: 500 
                }}
              >
                {user?.role === "TEACHER" && "Profesor"}
                {user?.role === "STUDENT" && "Estudiante"}
                {user?.role === "ADMIN" && "Administrador"}
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3">
        <div className="space-y-2">
          {links.map(
            (link, index) =>
              (!link.role || user?.role === link.role) && (
                <button
                  key={index}
                  onClick={() => {
                    onSelectLink(link.href);
                    router.push(link.href);
                  }}
                  className={`w-full flex cursor-pointer items-center rounded-lg transition-all duration-300 
                    ${isOpen ? 'py-3 px-4' : 'p-3 justify-center'}
                    ${link.select 
                      ? `text-white font-semibold` 
                      : `text-gray-300 hover:bg-opacity-20 hover:bg-white`}`}
                  style={{
                    backgroundColor: link.select ? colors.secondary : 'transparent',
                    minHeight: '48px',
                  }}
                >
                  <span 
                    className={`${isOpen ? 'text-xl' : 'text-2xl'}`} 
                    style={{ 
                      color: link.select ? colors.accent : 'currentColor',
                      minWidth: '24px',
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    {link.icon}
                  </span>
                  {isOpen && (
                    <span className="ml-3 text-base">
                      {link.name}
                    </span>
                  )}
                </button>
              )
          )}
        </div>
      </nav>

      <div className="p-4 border-t" style={{ borderColor: colors.secondary }}>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center cursor-pointer rounded-lg transition-colors duration-300 py-3 ${isOpen ? 'px-4' : 'justify-center'}`}
          style={{ 
            color: colors.accent,
            minHeight: '48px',
          }}
        >
          <FiLogOut className={`${isOpen ? 'text-xl' : 'text-2xl'}`} />
          {isOpen && (
            <span className="ml-3 text-base">
              Cerrar sesión
            </span>
          )}
        </button>
      </div>
    </div>
  );
}