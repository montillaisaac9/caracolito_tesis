// /app/components/activities/WordSearch.tsx
'use client';
import { useState, useEffect, useRef, useCallback, memo } from 'react';

interface WordSearchGame {
  grid: string[][];
  words: string[];
  placedWords: {
    word: string;
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
    backwards: boolean;
  }[];
}

interface WordSearchProps {
  gameData: WordSearchGame;
  activityId: string;
  onComplete: () => void;
}

// Helper para crear IDs de celda
const cellId = (row: number, col: number): string => `${row}-${col}`;

// Componente Cell memoizado
const Cell = memo(({ 
  value, 
  row, 
  col,
  isSelected,
  isDisabled,
  gameCompleted, 
  onSelect 
}: { 
  value: string;
  row: number;
  col: number;
  isSelected: boolean;
  isDisabled: boolean;
  gameCompleted: boolean;
  onSelect: (row: number, col: number) => void;
}) => {
  const handleClick = useCallback(() => {
    onSelect(row, col);
  }, [row, col, onSelect]);
  
  return (
    <button
      className={`w-10 h-10 flex items-center justify-center border border-gray-300 text-lg font-medium 
        ${isDisabled 
          ? "bg-green-200 text-green-800" 
          : isSelected 
            ? "bg-blue-400 text-white" 
            : "bg-white hover:bg-gray-100"}`}
      onClick={handleClick}
      disabled={isDisabled || gameCompleted}
    >
      {value}
    </button>
  );
});
Cell.displayName = 'Cell';

// Componente WordGrid memoizado
const WordGrid = memo(({ 
  grid,
  selectedCells,
  disabledCells, 
  gameCompleted, 
  onCellClick 
}: { 
  grid: string[][];
  selectedCells: [number, number][];
  disabledCells: Record<string, boolean>;
  gameCompleted: boolean;
  onCellClick: (row: number, col: number) => void;
}) => {
  const isCellSelected = useCallback((row: number, col: number): boolean => {
    return selectedCells.some(([r, c]) => r === row && c === col);
  }, [selectedCells]);

  const isCellDisabled = useCallback((row: number, col: number): boolean => {
    return !!disabledCells[cellId(row, col)];
  }, [disabledCells]);

  return (
    <div className="grid-container mb-6">
      {grid.map((row, rowIndex) => (
        <div key={rowIndex} className="flex">
          {row.map((cell, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              value={cell}
              row={rowIndex}
              col={colIndex}
              isSelected={isCellSelected(rowIndex, colIndex)}
              isDisabled={isCellDisabled(rowIndex, colIndex)}
              gameCompleted={gameCompleted}
              onSelect={onCellClick}
            />
          ))}
        </div>
      ))}
    </div>
  );
});
WordGrid.displayName = 'WordGrid';

// Componente WordsList
const WordsList = memo(({ 
  words, 
  foundWords 
}: { 
  words: string[];
  foundWords: string[];
}) => {
  return (
    <div className="mb-4">
      <h3 className="font-semibold text-lg mb-2">Palabras a encontrar:</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {words.map((word, index) => (
          <span 
            key={index}
            className={`px-3 py-1 rounded-full text-sm ${
              foundWords.includes(word) 
                ? "bg-green-200 text-green-800 line-through" 
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
});
WordsList.displayName = 'WordsList';

// Componente SelectedLetters
const SelectedLetters = memo(({ 
  letters, 
  onClear 
}: { 
  letters: string[];
  onClear: () => void;
}) => {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg mb-2">Letras seleccionadas:</h3>
        {letters.length > 0 && (
          <button 
            onClick={onClear}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Limpiar
          </button>
        )}
      </div>
      <div className="p-3 bg-gray-100 rounded min-h-12 mb-2">
        {letters.length > 0 ? letters.join('') : 'Ninguna letra seleccionada'}
      </div>
    </div>
  );
});
SelectedLetters.displayName = 'SelectedLetters';

// Componente SelectionHistory
const SelectionHistoryComponent = memo(({ 
  history 
}: { 
  history: { letters: string[]; timestamp: number }[];
}) => {
  return (
    <div className="mb-4">
      <h3 className="font-semibold text-lg mb-2">Historial de selecciones:</h3>
      <div className="p-3 bg-gray-100 rounded min-h-24 max-h-48 overflow-y-auto">
        {history.length > 0 ? (
          <ul className="space-y-2">
            {history.map((item, index) => (
              <li key={`${item.timestamp}-${index}`} className="border-b border-gray-200 pb-1 last:border-0">
                {item.letters.join('')}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-500">No hay historial de selecciones</div>)}
      </div>
    </div>
  );
});
SelectionHistoryComponent.displayName = 'SelectionHistory';

// Componente GameStatus
const GameStatus = memo(({ 
  foundCount, 
  totalCount 
}: { 
  foundCount: number;
  totalCount: number;
}) => (
  <div className="mb-4">
    <div className="p-3 bg-gray-100 rounded font-semibold">
      Encontradas: {foundCount} de {totalCount}
    </div>
  </div>
));
GameStatus.displayName = 'GameStatus';

// Componente principal con estado local
const WordSearch: React.FC<WordSearchProps> = ({ gameData, activityId, onComplete }) => {
  // Referencias
  const onCompleteCalledRef = useRef(false);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Estado local (reemplazando el estado de Zustand)
  const [selectedCells, setSelectedCells] = useState<[number, number][]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [disabledCells, setDisabledCells] = useState<Record<string, boolean>>({});
  const [temporaryLetters, setTemporaryLetters] = useState<string[]>([]);
  const [selectionHistory, setSelectionHistory] = useState<{ letters: string[]; timestamp: number }[]>([]);
  const [gameCompleted, setGameCompleted] = useState(false);
  
  // Llamar a onComplete cuando el juego esté completado
  useEffect(() => {
    if (gameCompleted && !onCompleteCalledRef.current) {
      onCompleteCalledRef.current = true;
      onComplete();
    }
  }, [gameCompleted, onComplete]);
  
  // Restablecer bandera de finalización si cambia la actividad
  useEffect(() => {
    return () => {
      onCompleteCalledRef.current = false;
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [activityId]);
  
  // Agregar al historial de selección
  const addToSelectionHistory = useCallback((letters: string[]) => {
    if (letters.length === 0) return;
    
    const joinedLetters = letters.join('');
    
    // Evitar agregar duplicados consecutivos
    if (selectionHistory.length > 0 && 
        selectionHistory[0].letters.join('') === joinedLetters) {
      return;
    }
    
    setSelectionHistory(prev => [
      {
        letters: [...letters],
        timestamp: Date.now()
      },
      ...prev.slice(0, 9) // Mantener solo los 10 más recientes
    ]);
  }, [selectionHistory]);
  
  // Limpiar selección
  const clearSelection = useCallback(() => {
    setSelectedCells([]);
    setTemporaryLetters([]);
  }, []);
  
  // Manejar limpieza de selección
  const handleClearSelection = useCallback(() => {
    if (temporaryLetters.length > 0) {
      addToSelectionHistory([...temporaryLetters]);
    }
    clearSelection();
  }, [temporaryLetters, addToSelectionHistory, clearSelection]);
  
  // Agregar una celda a las celdas deshabilitadas
  const addDisabledCell = useCallback((row: number, col: number) => {
    const id = cellId(row, col);
    
    setDisabledCells(prev => {
      // Omitir si ya está deshabilitada
      if (prev[id]) return prev;
      
      return {
        ...prev,
        [id]: true
      };
    });
  }, []);
  
  // Agregar una palabra encontrada
  const addFoundWord = useCallback((word: string) => {
    setFoundWords(prev => {
      // Evitar agregar duplicados
      if (prev.includes(word)) return prev;
      
      const newFoundWords = [...prev, word];
      
      // Verificar si el juego está completo
      if (newFoundWords.length === gameData.words.length) {
        setGameCompleted(true);
      }
      
      return newFoundWords;
    });
  }, [gameData.words.length]);
  
  // Manejar selección de celda
  const selectCell = useCallback((row: number, col: number) => {
    if (gameCompleted || disabledCells[cellId(row, col)]) return;
    setSelectedCells(prev => {
      let newSelectedCells: [number, number][];
      const isCellSelected = prev.some(([r, c]) => r === row && c === col);
      if (isCellSelected) {
        newSelectedCells = prev.filter(([r, c]) => !(r === row && c === col));
      } else {
        newSelectedCells = [...prev, [row, col]];
      }
      const newLetters = newSelectedCells.map(([r, c]) => gameData.grid[r][c] || '');
      setTemporaryLetters(newLetters);
      
      // Verificar si se ha formado una palabra
      if (newSelectedCells.length >= 2) {
        const selectedWord = newLetters.join('').toUpperCase();
        const reversedWord = selectedWord.split('').reverse().join('');
        
        // Verificar si la selección forma una palabra
        const wordFound = gameData.words.find(word => {
          const upperWord = word.toUpperCase();
          return upperWord === selectedWord || upperWord === reversedWord;
        });
        
        if (wordFound && !foundWords.includes(wordFound)) {
          // Agregar al historial antes de marcar como encontrada
          addToSelectionHistory([...newLetters]);
          
          // Agregar la palabra encontrada
          addFoundWord(wordFound);
          
          // Marcar celdas como deshabilitadas
          newSelectedCells.forEach(([r, c]) => {
            addDisabledCell(r, c);
          });
        
          return [];
        }
      }
      
      return newSelectedCells;
    });
    
    // Reiniciar temporizador de inactividad
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Establecer nuevo temporizador
    inactivityTimerRef.current = setTimeout(() => {
      if (temporaryLetters.length > 0) {
        addToSelectionHistory([...temporaryLetters]);
        clearSelection();
      }
    }, 20000); // 20 segundos de inactividad
    
  }, [
    gameData.grid, 
    gameData.words, 
    gameCompleted, 
    disabledCells, 
    foundWords, 
    temporaryLetters,
    addToSelectionHistory,
    addFoundWord,
    addDisabledCell,
    clearSelection
  ]);
  
  // Manejar clic en celda - evitar recreaciones
  const handleCellClick = useCallback((row: number, col: number) => {
    selectCell(row, col);
  }, [selectCell]);
  
  return (
    <div className="word-search-game flex flex-col md:flex-row gap-8">
      <WordGrid 
        grid={gameData.grid} 
        selectedCells={selectedCells}
        disabledCells={disabledCells}
        gameCompleted={gameCompleted} 
        onCellClick={handleCellClick} 
      />
      
      <div className="w-full md:w-64">
        <WordsList 
          words={gameData.words} 
          foundWords={foundWords} 
        />
        
        <SelectedLetters 
          letters={temporaryLetters} 
          onClear={handleClearSelection} 
        />
        
        <SelectionHistoryComponent 
          history={selectionHistory} 
        />
        
        <GameStatus 
          foundCount={foundWords.length} 
          totalCount={gameData.words.length} 
        />
      </div>
    </div>
  );
};

export default memo(WordSearch);