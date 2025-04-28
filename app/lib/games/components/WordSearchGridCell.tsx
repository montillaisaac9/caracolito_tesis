import React from 'react';

interface GridCellProps {
  letter: string;
  isSelected: boolean;
  isDisabled: boolean;
  onCellClick: () => void;
}

const GridCell = React.memo(({ letter, isSelected, isDisabled, onCellClick }: GridCellProps) => {

  const cellClass = `
    flex items-center justify-center
    text-lg font-medium
    rounded-sm transition-colors
    ${
      isDisabled
        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
        : isSelected
          ? 'bg-sky-500 text-white cursor-pointer shadow-md'
          : 'bg-sky-100 text-sky-800 hover:bg-sky-200 cursor-pointer'
    }
  `;

  return (
    <div
      onClick={!isDisabled ? onCellClick : undefined} // Pasa la función onCellClick
      className={cellClass}
    >
      {letter}
    </div>
  );
});

export default GridCell;