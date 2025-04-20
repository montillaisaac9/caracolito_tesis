'use client'

import { ActivityType, DifficultyLevel } from "@prisma/client";
import api from "@/app/utils/api";
import useUserStore from "@/app/stores/useUserStore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import Spinner from "@/app/components/ui/common/progresBar";

interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  difficulty: DifficultyLevel;
  config: any;
  points: number;
  timeLimit: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  topicId: string;
  createdById: string;
} // Ensure this closing brace matches the corresponding opening block

interface WordSearchConfig {
  wordSearch: {
    words: string[];
    gridSize: number;
    allowDiagonal: boolean;
    allowBackwards: boolean;
  };
  instructions: string;
}

interface WordSearchGameData {
  grid: string[][];
  placedWords: {
    word: string;
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
    backwards: boolean;
  }[];
  words: string[];
}

interface MatchingConfig {
  matching: {
    pairs: {
      left: string;
      right: string;
    }[];
    shuffle: boolean;
  };
  instructions: string;
}

interface MatchingGameData {
  leftItems: {
    id: string;
    content: string;
    originalIndex: number;
  }[];
  rightItems: {
    id: string;
    content: string;
    originalIndex: number;
  }[];
  pairs: {
    left: string;
    right: string;
  }[];
}

export interface ProgressCreate {
  studentId: string;
  activityId: string;
  score?: number;          // Default: 0 si no se envía
  completed?: boolean;     // Default: false si no se envía
  timeSpent?: number;      // Optional
  attempts?: number;       // Default: 0 si no se envía
  lastAttempt?: Date;      // Optional
  feedback?: string;       // Optional, max 500 chars
}


export default function Activities() {
  const params = useParams();
  const router = useRouter();
  const activityId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const { user } = useUserStore();
  
  const [gameData, setGameData] = useState<WordSearchGameData | MatchingGameData | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [progressId, setProgressId] = useState<string | null>(null);
  
  // Refs for persisting state between renders
  const gameCompletedRef = useRef(false);
  const gameStateRef = useRef({
    selectedCells: [] as [number, number][],
    foundWords: [] as string[],
    disabledCells: [] as string[],
    selectedLetters: '',
    matches: {} as Record<number, number>
  });
  
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get(`/activities?id=${activityId}`);
        if (response.status === 200 && response.data.data) {
          setActivity(response.data.data);
          
          if (response.data.data.timeLimit) {
            setTimeRemaining(response.data.data.timeLimit);
          }
        } else {
          console.log(response);
          setError("No se encontró la actividad solicitada");
        }
      } catch (error) {
        console.error("Error obteniendo la actividad:", error);
        setError("Error al cargar los datos de la actividad");
      } finally {
        setLoading(false);
      }
    };
    
    if (activityId) {
      fetchActivity();
    }
  }, [activityId]);
  
  useEffect(() => {
    // Set up timer if game has started and there's a time limit
    let timer: NodeJS.Timeout | null = null;
    
    if (gameStarted && timeRemaining !== null && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer as NodeJS.Timeout);
            setGameCompleted(true);
            gameCompletedRef.current = true;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [gameStarted, timeRemaining]);
  
  // Function to generate word search grid
  const generateWordSearchGrid = (config: WordSearchConfig): WordSearchGameData => {
    const { wordSearch } = config;
    const { words, gridSize, allowDiagonal, allowBackwards } = wordSearch;
    
    // Initialize empty grid
    const grid = Array.from({ length: gridSize }, () => 
      Array.from({ length: gridSize }, () => "")
    );
    
    // Fill grid with random letters
    const fillRandomLetters = () => {
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          if (!grid[i][j]) {
            const randomChar = String.fromCharCode(
              Math.floor(Math.random() * 26) + 65
            );
            grid[i][j] = randomChar;
          }
        }
      }
    };
    
    // Place words in the grid
    const placedWords: {
      word: string;
      startRow: number;
      startCol: number;
      endRow: number;
      endCol: number;
      backwards: boolean;
    }[] = [];
    
    const directions = [
      [0, 1],   // right
      [1, 0],   // down
      [1, 1],   // diagonal down-right
      [-1, 1],  // diagonal up-right
    ];
    
    // Filter directions based on options
    const validDirections = directions.filter((dir, index) => {
      if (index >= 2 && !allowDiagonal) return false;
      return true;
    });
    
    // Function to check if a word can be placed at a position in a direction
    const canPlaceWord = (word: string, row: number, col: number, dRow: number, dCol: number, backwards: boolean) => {
      const actualWord = backwards ? word.split('').reverse().join('') : word;
      
      for (let i = 0; i < actualWord.length; i++) {
        const newRow = row + i * dRow;
        const newCol = col + i * dCol;
        
        if (
          newRow < 0 || 
          newRow >= gridSize || 
          newCol < 0 || 
          newCol >= gridSize
        ) {
          return false;
        }
        
        if (grid[newRow][newCol] && grid[newRow][newCol] !== actualWord[i]) {
          return false;
        }
      }
      
      return true;
    };
    
    // Place the word in the grid
    const placeWord = (word: string, row: number, col: number, dRow: number, dCol: number, backwards: boolean) => {
      const actualWord = backwards ? word.split('').reverse().join('') : word;
      
      for (let i = 0; i < actualWord.length; i++) {
        const newRow = row + i * dRow;
        const newCol = col + i * dCol;
        grid[newRow][newCol] = actualWord[i];
      }
      
      placedWords.push({
        word,
        startRow: row,
        startCol: col,
        endRow: row + (actualWord.length - 1) * dRow,
        endCol: col + (actualWord.length - 1) * dCol,
        backwards
      });
    };
    
    // Try to place each word
    for (const word of words) {
      let placed = false;
      const attempts = 100; // Limit attempts to prevent infinite loops
      
      for (let attempt = 0; attempt < attempts && !placed; attempt++) {
        // Get random position and direction
        const row = Math.floor(Math.random() * gridSize);
        const col = Math.floor(Math.random() * gridSize);
        const dirIndex = Math.floor(Math.random() * validDirections.length);
        const [dRow, dCol] = validDirections[dirIndex];
        const backwards = allowBackwards ? Math.random() > 0.5 : false;
        
        if (canPlaceWord(word, row, col, dRow, dCol, backwards)) {
          placeWord(word, row, col, dRow, dCol, backwards);
          placed = true;
        }
      }
      
      if (!placed) {
        console.warn(`Could not place word: ${word}`);
      }
    }
    
    fillRandomLetters();
    
    return {
      grid,
      placedWords,
      words
    };
  };
  
  // Function to generate matching game
  const generateMatchingGame = (config: MatchingConfig): MatchingGameData => {
    const { matching } = config;
    let { pairs, shuffle } = matching;
    
    if (shuffle) {
      // Create a shuffled copy of the pairs
      const shuffledPairs = [...pairs];
      for (let i = shuffledPairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPairs[i], shuffledPairs[j]] = [shuffledPairs[j], shuffledPairs[i]];
      }
      pairs = shuffledPairs;
    }
    
    // Create left and right sides (shuffled independently)
    const leftItems = pairs.map((pair, index) => ({
      id: `left-${index}`,
      content: pair.left,
      originalIndex: index
    }));
    
    const rightItems = pairs.map((pair, index) => ({
      id: `right-${index}`,
      content: pair.right,
      originalIndex: index
    }));
    
    // Shuffle right items
    for (let i = rightItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rightItems[i], rightItems[j]] = [rightItems[j], rightItems[i]];
    }
    
    return {
      leftItems,
      rightItems,
      pairs
    };
  };
  
  // Function to save progress
  const saveProgress = async () => {
    if (!activity || !user?.id) return;

    try {
      const progressData: ProgressCreate = {
        studentId: user.id,
        activityId: activity.id,
        score: score,
        completed: gameCompleted,
        timeSpent: activity.timeLimit ? (activity.timeLimit - (timeRemaining || 0)) : undefined,
        attempts: 1,
        lastAttempt: new Date(),
        feedback: JSON.stringify({
          gameState: gameStateRef.current,
          gameData: gameData
        })
      };

      if (progressId) {
       
       console.log(progressData)
        // await api.post(`/progress`, progressData);
    
      }
    } catch (error) {
      console.log(error)
      alert("Error al guardar el progreso. Por favor, inténtelo de nuevo.");
      console.error("Error saving progress:", error);
    }
  };

  // Update game state ref
  useEffect(() => {
    if (gameData) {
      gameStateRef.current = {
        ...gameStateRef.current,
        gameData
      };
    }
  }, [gameData]);

  // Save progress when game is completed or time runs out
  useEffect(() => {
    if (gameCompleted || (timeRemaining === 0 && gameStarted)) {
      saveProgress();
    }
  }, [gameCompleted, timeRemaining, gameStarted]);
  
  const startGame = () => {
    if (!activity) return;
    
    let generatedGameData;
    
    switch (activity.type) {
      case 'WORD_SEARCH':
        const wordSearchConfig = activity.config as unknown as WordSearchConfig;
        generatedGameData = generateWordSearchGrid(wordSearchConfig);
        break;
      case 'MATCHING':
        const matchingConfig = activity.config as unknown as MatchingConfig;
        generatedGameData = generateMatchingGame(matchingConfig);
        break;
      default:
        setError(`Tipo de actividad no soportado: ${activity.type}`);
        return;
    }
    
    setGameData(generatedGameData);
    setGameStarted(true);
    setGameCompleted(false);
    gameCompletedRef.current = false;
    setScore(0);
    setProgressId(null);
  };
  
  const completeGame = () => {
    // Avoid completing the game multiple times
    if (gameCompletedRef.current) return;
    
    // Calculate score based on activity and game state
    let finalScore = 0;
    
    if (activity && gameData) {
      switch (activity.type) {
        case 'WORD_SEARCH':
          // For simplicity, award full points if game is completed
          finalScore = activity.points;
          break;
        case 'MATCHING':
          // Award points based on correct matches
          finalScore = activity.points;
          break;
      }
    }
    
    setScore(finalScore);
    setGameCompleted(true);
    gameCompletedRef.current = true;
    
    // Save final progress
    saveProgress();
  };

  const WordSearchGame = () => {
    const [selectedCells, setSelectedCells] = useState<[number, number][]>([]);
    const [foundWords, setFoundWords] = useState<string[]>([]);
    const [disabledCells, setDisabledCells] = useState<string[]>([]);
    const [selectedLetters, setSelectedLetters] = useState<string>('');
    const [lastSelectionTime, setLastSelectionTime] = useState<number>(Date.now());
    const [temporaryLetters, setTemporaryLetters] = useState<string[]>([]);
    const [selectionHistory, setSelectionHistory] = useState<Array<{
      letters: string[];
      timestamp: number;
    }>>([]);
    
    // Referencia para el grid actual
    const gridRef = useRef<string[][]>([]);
    
    if (!gameData || activity?.type !== 'WORD_SEARCH') return null;
    
    const wordSearchData = gameData as WordSearchGameData;
    const { grid, words } = wordSearchData;
    
    // Actualizar la referencia del grid
    gridRef.current = grid;
  
    // Helper function to create a unique cell identifier
    const cellId = (row: number, col: number): string => `${row}-${col}`;
  
    // Save state function
    const saveStateToLocalStorage = useCallback(() => {
      if (!activity) return; // Ensure activity exists before proceeding
      try {
        const gameId = activity.id || 'default-word-search';
        const stateToSave = {
          foundWords,
          disabledCells,
          selectionHistory,
          selectedCells,
          temporaryLetters,
          lastUpdate: Date.now()
        };
        localStorage.setItem(`wordSearch_${gameId}`, JSON.stringify(stateToSave));
        console.log("Estado guardado:", stateToSave);
      } catch (err) {
        console.error("Error al guardar estado:", err);
      }
    }, [activity, foundWords, disabledCells, selectionHistory, selectedCells, temporaryLetters]);

    // Load saved state on mount
    useEffect(() => {
      if (!activity) return; // Ensure the hook logic executes only if activity exists

      try {
        const gameId = activity?.id || 'default-word-search';
        const savedState = localStorage.getItem(`wordSearch_${gameId}`);
        
        if (savedState) {
          const parsed = JSON.parse(savedState);
          console.log("Estado cargado:", parsed);
          
          if (parsed.foundWords) setFoundWords(parsed.foundWords);
          if (parsed.disabledCells) setDisabledCells(parsed.disabledCells);
          if (parsed.selectionHistory) setSelectionHistory(parsed.selectionHistory);
          
          // Solo restaurar selecciones temporales si no han pasado más de 5 minutos
          const fiveMinutes = 5 * 60 * 1000;
          const timeSinceLastUpdate = Date.now() - (parsed.lastUpdate || 0);
          
          if (timeSinceLastUpdate < fiveMinutes) {
            if (parsed.selectedCells) setSelectedCells(parsed.selectedCells);
            if (parsed.temporaryLetters) setTemporaryLetters(parsed.temporaryLetters);
            
            // Reconstruir selectedLetters si tenemos grid y celdas
            if (parsed.selectedCells && parsed.selectedCells.length > 0 && grid) {
              const letters = parsed.selectedCells
                .map(([row, col]: [number, number]) => {
                  if (grid[row] && grid[row][col]) return grid[row][col];
                  return '';
                })
                .join('');
              setSelectedLetters(letters);
            }
          }
        }
      } catch (err) {
        console.error("Error al cargar estado:", err);
      }
    }, [activity]);
  
    // Save state when important data changes
    useEffect(() => {
      if (foundWords.length > 0 || disabledCells.length > 0 || selectionHistory.length > 0) {
        saveStateToLocalStorage();
      }
    }, [foundWords, disabledCells, selectionHistory, saveStateToLocalStorage]);
  
    // También guardar estado cuando cambian selecciones temporales
    useEffect(() => {
      if (selectedCells.length > 0) {
        saveStateToLocalStorage();
      }
    }, [selectedCells, saveStateToLocalStorage]);
  
    // Update game state ref
    useEffect(() => {
      if (gameStateRef && gameStateRef.current) {
        gameStateRef.current = {
          ...gameStateRef.current,
          selectedCells,
          foundWords,
          disabledCells,
          selectedLetters
        };
      }
    }, [selectedCells, foundWords, disabledCells, selectedLetters]);
  
    // Clear temporary letters after inactivity
    useEffect(() => {
      let timer: ReturnType<typeof setTimeout>;
      
      if (temporaryLetters.length > 0) {
        timer = setTimeout(() => {
          if (Date.now() - lastSelectionTime >= 20000) {
            // Add to history before clearing
            addToSelectionHistory(temporaryLetters);
            clearSelection();
          }
        }, 20000);
      }
  
      return () => {
        if (timer) clearTimeout(timer);
      };
    }, [temporaryLetters, lastSelectionTime]);
  
    // Check if a cell is disabled
    const isCellDisabled = (row: number, col: number): boolean => {
      return disabledCells.includes(cellId(row, col));
    };
  
    // Get letters from selected cells
    const getSelectedLetters = (cells: [number, number][]): string => {
      return cells
        .map(([row, col]) => {
          if (grid[row] && grid[row][col]) return grid[row][col];
          return '';
        })
        .join('');
    };
    
    // Add to selection history
    const addToSelectionHistory = (letters: string[]) => {
      if (letters.length === 0) return;
      
      const joinedLetters = letters.join('');
      // Avoid adding duplicates consecutively
      if (selectionHistory.length > 0 && selectionHistory[0].letters.join('') === joinedLetters) {
        return;
      }
      
      setSelectionHistory(prev => [{
        letters: [...letters],
        timestamp: Date.now()
      }, ...prev.slice(0, 9)]); // Keep only 10 most recent
    };
  
    // Clear selection completely
    const clearSelection = () => {
      setSelectedCells([]);
      setSelectedLetters('');
      setTemporaryLetters([]);
    };
    
    // Handle clearing current selection with history saving
    const handleClearSelection = () => {
      if (temporaryLetters.length > 0) {
        addToSelectionHistory([...temporaryLetters]);
      }
      clearSelection();
    };
    
    const handleCellClick = (row: number, col: number) => {
      if (gameCompletedRef?.current || isCellDisabled(row, col)) return;
      
      // Toggle cell selection
      const cellIdStr = cellId(row, col);
      const isCellSelected = selectedCells.some(
        ([r, c]) => r === row && c === col
      );
      
      let newSelectedCells: [number, number][];
      
      if (isCellSelected) {
        // Remove cell if already selected
        newSelectedCells = selectedCells.filter(
          ([r, c]) => !(r === row && c === col)
        );
      } else {
        // Add cell to selection
        newSelectedCells = [...selectedCells, [row, col]];
      }
      
      // Update selected cells
      setSelectedCells(newSelectedCells);
      
      // Update letters based on new selection
      const newLetters = newSelectedCells.map(([r, c]) => grid[r][c]);
      setSelectedLetters(newLetters.join(''));
      setTemporaryLetters(newLetters);
      
      // Update last selection time
      setLastSelectionTime(Date.now());
      
      // Check if a word is formed
      if (newSelectedCells.length >= 2) {
        checkWordFormation(newSelectedCells);
      }
    };
    
    // Function to check if the current selection forms a word
    const checkWordFormation = (cells: [number, number][]) => {
      if (!cells || cells.length < 2) return;
      
      const selectedWord = getSelectedLetters(cells).toUpperCase();
      const reversedWord = selectedWord.split('').reverse().join('');
      
      // Check if the selection forms a word
      const wordFound = words.find(word => {
        const upperWord = word.toUpperCase();
        return upperWord === selectedWord || upperWord === reversedWord;
      });
      
      if (wordFound && !foundWords.includes(wordFound)) {
        console.log(`Found word: ${wordFound}`);
        
        // Add to history before marking as found
        addToSelectionHistory([...temporaryLetters]);
        
        // Add found word
        const newFoundWords = [...foundWords, wordFound];
        setFoundWords(newFoundWords);
        
        // Mark cells as disabled
        const newDisabledCells = [...disabledCells];
        cells.forEach(([r, c]) => {
          newDisabledCells.push(cellId(r, c));
        });
        setDisabledCells(newDisabledCells);
        
        // Clear selection
        clearSelection();
        
        // Save progress
        if (typeof saveProgress === 'function') {
          saveProgress();
        }
        
        // Check if game is complete
        if (newFoundWords.length === words.length && gameCompletedRef?.current !== undefined) {
          gameCompletedRef.current = true;
          if (typeof completeGame === 'function') {
            completeGame();
          }
        }
      }
    };
    
    return (
      <div className="word-search-game flex flex-col md:flex-row gap-8">
        <div className="grid-container mb-6">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((cell, colIndex) => {
                const isSelected = selectedCells.some(
                  ([r, c]) => r === rowIndex && c === colIndex
                );
                const isDisabled = isCellDisabled(rowIndex, colIndex);
                
                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    className={`w-10 h-10 flex items-center justify-center border border-gray-300 text-lg font-medium 
                      ${isDisabled 
                        ? "bg-green-200 text-green-800" 
                        : isSelected 
                          ? "bg-blue-400 text-white" 
                          : "bg-white hover:bg-gray-100"}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    disabled={isDisabled || (gameCompletedRef?.current === true)}
                  >
                    {cell}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
  
        <div className="w-full md:w-64">
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
  
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg mb-2">Letras seleccionadas:</h3>
              {temporaryLetters.length > 0 && (
                <button 
                  onClick={handleClearSelection}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Limpiar
                </button>
              )}
            </div>
            <div className="p-3 bg-gray-100 rounded min-h-12 mb-2">
              {temporaryLetters.length > 0 ? temporaryLetters.join('') : 'Ninguna letra seleccionada'}
            </div>
          </div>
  
          <div className="mb-4">
            <h3 className="font-semibold text-lg mb-2">Historial de selecciones:</h3>
            <div className="p-3 bg-gray-100 rounded min-h-24 max-h-48 overflow-y-auto">
              {selectionHistory.length > 0 ? (
                <ul className="space-y-2">
                  {selectionHistory.map((item, index) => (
                    <li key={index} className="border-b border-gray-200 pb-1 last:border-0">
                      {item.letters.join('')}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No hay selecciones recientes</p>
              )}
            </div>
          </div>
  
          <div className="mb-4">
            <div className="p-3 bg-gray-100 rounded font-semibold">
              Encontradas: {foundWords.length} de {words.length}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const MatchingGame = () => {
    const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
    const [selectedRight, setSelectedRight] = useState<number | null>(null);
    const [matches, setMatches] = useState<Record<number, number>>({});

    // Update game state ref
    useEffect(() => {
      gameStateRef.current = {
        ...gameStateRef.current,
        matches
      };
    }, [matches]);
    
    if (!gameData || activity?.type !== 'MATCHING') return null;
    
    const matchingData = gameData as MatchingGameData;
    const { leftItems, rightItems, pairs } = matchingData;

    const handleLeftSelection = (index: number) => {
      if (gameCompletedRef.current || index.toString() in gameStateRef.current.matches) return;
      
      setSelectedLeft(index);
      
      // Check for match if right item is already selected
      if (selectedRight !== null) {
        checkForMatch(index, selectedRight);
      }
    };
    
    const handleRightSelection = (index: number) => {
      if (gameCompletedRef.current || Object.values(gameStateRef.current.matches).includes(index)) return;
      
      setSelectedRight(index);
      
      // Check for match if left item is already selected
      if (selectedLeft !== null) {
        checkForMatch(selectedLeft, index);
      }
    };
    
    const checkForMatch = (leftIndex: number, rightIndex: number) => {
      const leftItem = leftItems[leftIndex];
      const rightItem = rightItems[rightIndex];
      
      // Check if the indices match in the original pairs
      if (leftItem.originalIndex === rightItem.originalIndex) {
        // Correct match!
        const newMatches = { ...gameStateRef.current.matches, [leftIndex]: rightIndex };
        setMatches(newMatches);
        gameStateRef.current.matches = newMatches;
        
        // Save progress after correct match
        saveProgress();
        
        // Check if all pairs are matched
        if (Object.keys(newMatches).length === pairs.length && !gameCompletedRef.current) {
          // Use setTimeout to ensure state updates before completing
          setTimeout(() => {
            completeGame();
          }, 300);
        }
      } else {
        // Reset selections if match is incorrect
        setSelectedLeft(null);
        setSelectedRight(null);
      }
    };
    
    return (
      <div className="matching-game">
        <h2 className="text-2xl font-bold mb-4">Juego de Emparejamiento</h2>
        <p className="mb-6">{activity?.config?.instructions}</p>
        
        <div className="flex space-x-8 mb-6">
          <div className="w-1/2">
            <h3 className="font-semibold text-lg mb-2">Columna A</h3>
            {leftItems.map((item, index) => {
              const isMatched = index.toString() in gameStateRef.current.matches;
              const isSelected = selectedLeft === index;
              
              return (
                <button
                  key={item.id}
                  className={`block w-full text-left p-3 mb-2 rounded border ${
                    isMatched
                      ? "bg-green-200 border-green-500"
                      : isSelected
                        ? "bg-blue-200 border-blue-500"
                        : "bg-white border-gray-300 hover:bg-gray-100"
                  }`}
                  onClick={() => handleLeftSelection(index)}
                  disabled={isMatched || gameCompletedRef.current}
                >
                  {item.content}
                </button>
              );
            })}
          </div>
          
          <div className="w-1/2">
            <h3 className="font-semibold text-lg mb-2">Columna B</h3>
            {rightItems.map((item, index) => {
              const isMatched = Object.values(gameStateRef.current.matches).includes(index);
              const isSelected = selectedRight === index;
              
              return (
                <button
                  key={item.id}
                  className={`block w-full text-left p-3 mb-2 rounded border ${
                    isMatched
                      ? "bg-green-200 border-green-500"
                      : isSelected
                        ? "bg-blue-200 border-blue-500"
                        : "bg-white border-gray-300 hover:bg-gray-100"
                  }`}
                  onClick={() => handleRightSelection(index)}
                  disabled={isMatched || gameCompletedRef.current}
                >
                  {item.content}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="mb-4">
          <div className="p-3 bg-gray-100 rounded">
            Emparejados: {Object.keys(gameStateRef.current.matches).length} de {pairs.length}
          </div>
        </div>
      </div>
    );
  };
  
  const renderActivityGame = () => {
    if (!activity) return null;
    
    switch (activity.type) {
      case 'WORD_SEARCH':
        return <WordSearchGame />;
      case 'MATCHING':
        return <MatchingGame />;
      default:
        return (
          <div className="p-4 bg-red-100 text-red-700 rounded">
            <div className="font-semibold">
              Tipo de actividad no soportado: {activity.type}
            </div>
          </div>
        );
    }
  };
  
  const renderActivityDetails = () => {
    if (!activity) return null;
    
    return (
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{activity.title}</h1>
        
        <div className="p-4 bg-gray-100 rounded-lg mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Tipo:</strong> {activity.type}</p>
              <p><strong>Dificultad:</strong> {activity.difficulty}</p>
              <p><strong>Puntos:</strong> {activity.points}</p>
              {activity.timeLimit && (
                <p><strong>Tiempo límite:</strong> {activity.timeLimit} segundos</p>
              )}
            </div>
            <div>
              <p><strong>Activo:</strong> {activity.isActive ? 'Sí' : 'No'}</p>
              <p><strong>Creado:</strong> {new Date(activity.createdAt).toLocaleDateString()}</p>
              <p><strong>Actualizado:</strong> {new Date(activity.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        
        {user?.role === 'STUDENT' && activity.isActive && !gameStarted && (
          <div className="mb-4">
            <button 
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              onClick={startGame}
            >
              Comenzar Actividad
            </button>
          </div>
        )}
        
        {gameCompleted && (
          <div className="p-6 bg-green-100 text-green-800 rounded-lg mb-4">
            <h2 className="text-2xl font-bold mb-2">¡Actividad Completada!</h2>
            <p className="text-xl mb-4"><strong>Puntuación:</strong> {score} puntos</p>
            <button 
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={() => router.push('/activities')}
            >
              Volver a Actividades
            </button>
          </div>
        )}
      </div>
    );
  };
  
  if (loading && !activity) {
    return (
      <div className="flex justify-center p-8">
        <Spinner isLoading={false} />
      </div>
    );
  }
  
  if (error && !activity) {
    return (
      <div className="p-8 bg-red-100 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      {renderActivityDetails()}
      
      {user?.role === 'STUDENT' && gameStarted && !gameCompleted && (
        <div className="mb-8">
          {timeRemaining !== null && (
            <div className="mb-4">
              <div className="p-3 bg-blue-100 text-blue-800 rounded flex items-center justify-center text-lg font-semibold">
                Tiempo restante: {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
              </div>
              <div className="w-full mt-2">
                <div 
                  className="h-2 bg-blue-500 rounded-full" 
                  style={{ width: `${(timeRemaining / (activity?.timeLimit || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {renderActivityGame()}
        </div>
      )}
    </div>
  );
}