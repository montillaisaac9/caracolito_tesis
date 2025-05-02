import React from 'react';

interface GridCellProps {
  letter: string;
  isSelected: boolean;
  isDisabled: boolean;
  isHinted: boolean;
  onCellClick: () => void;
  onMouseDown: () => void;
  onMouseEnter: () => void;
  onMouseUp: () => void;
  className?: string;
}

const GridCell: React.FC<GridCellProps> = ({
  letter,
  isSelected,
  isDisabled,
  isHinted,
  onCellClick,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
  className = '',
}) => {
  // Colores coherentes con el tema del componente principal
  const baseStyles = `
    w-full h-full flex items-center justify-center 
    text-xl font-bold rounded-lg transition-all duration-200
    border-2
  `;

  const getStateStyles = () => {
    if (isDisabled) {
      return `bg-green-50 text-green-700 border-green-200 cursor-default`;
    }
    if (isSelected) {
      return `bg-blue-100 text-blue-800 border-blue-400 shadow-md`;
    }
    if (isHinted) {
      return `bg-yellow-50 text-yellow-800 border-yellow-400 animate-pulse`;
    }
    return `bg-white text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer`;
  };

  return (
    <div
      className={`${baseStyles} ${getStateStyles()} ${className}`}
      onClick={onCellClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseUp={onMouseUp}
      aria-label={`Celda ${letter} ${isSelected ? 'seleccionada' : ''} ${
        isHinted ? 'con pista' : ''
      }`}
    >
      <span className="select-none">{letter}</span>
    </div>
  );
};

export default GridCell;