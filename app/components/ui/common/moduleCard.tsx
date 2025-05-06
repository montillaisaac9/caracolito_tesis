import React from "react";

interface ModuleCardProps {
  title: string;
  description?: string;
  isActive?: boolean;
  updatedAt?: string;
  onClick?: () => void;
  progress?: number;
  showMenu?: boolean;
  className?: string;
  onMenuClick?: () => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  description,
  updatedAt,
  isActive = true,
  onClick,
  progress,
  showMenu = false,
  className = "",
  onMenuClick,
}) => {
  // Función para formatear fechas sin date-fns
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString; // Si hay error, devolver el string original
    }
  };

  const formattedDate = updatedAt ? formatDate(updatedAt) : null;

  const handleCardClick = (e: React.MouseEvent) => {
    onClick?.();
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMenuClick?.();
  };

  // Iconos como componentes SVG simples
  const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4 12 14.01l-3-3" />
    </svg>
  );

  const ClockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );

  const MoreVerticalIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );

  return (
    <div 
      className={`
        relative bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 
        border border-gray-200 dark:border-gray-700 
        hover:shadow-md transition-all duration-200
        ${!isActive ? "opacity-70" : ""}
        ${onClick ? "cursor-pointer hover:border-primary" : ""}
        ${className}
      `}
      onClick={handleCardClick}
    >
      {/* Status indicator */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center flex-wrap gap-2">
          {isActive ? (
            <span className="text-green-500"><CheckIcon /></span>
          ) : (
            <span className="text-yellow-500"><ClockIcon /></span>
          )}
          <span className={`px-2 py-1 rounded-full text-xs  ${
            isActive 
              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-bold" 
              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 font-bold"
          }`}>
            {isActive ? "Activo" : "Inactivo"}
          </span>
        </div>
        
        {showMenu && (
          <button 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={handleMenuClick}
          >
            <MoreVerticalIcon />
          </button>
        )}
      </div>

      <div className="ws-full flex flex-col justify-between h-full">
        <h3 className="font-semibold text-lg text-gray-800 dark:text-white line-clamp-2">
          {title}
        </h3>
        
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
            {description}
          </p>
        )}
      </div>

      <div className="mt-4 flex justify-between items-center">
        {formattedDate && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Actualizado: {formattedDate}
          </span>
        )}
        
      
      </div>
    </div>
  );
};

export default ModuleCard;