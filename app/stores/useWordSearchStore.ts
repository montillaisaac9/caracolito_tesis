// /app/stores/useWordSearchStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { useShallow } from 'zustand/react/shallow';

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

interface WordSearchState {
  // Game data
  gameData: WordSearchGame | null;
  activityId: string | null;
  lastInitTime: number; // Timestamp of last initialization
  
  // Game state
  selectedCells: [number, number][];
  foundWords: string[];
  disabledCells: Record<string, boolean>; // Cambiado a objeto para búsquedas O(1)
  selectedLetters: string;
  temporaryLetters: string[];
  selectionHistory: { letters: string[]; timestamp: number }[];
  lastSelectionTime: number;
  gameCompleted: boolean;
  
  // Actions
  initialize: (gameData: WordSearchGame, activityId: string) => void;
  selectCell: (row: number, col: number) => void;
  clearSelection: () => void;
  addFoundWord: (word: string) => void;
  addDisabledCell: (row: number, col: number) => void;
  addToSelectionHistory: (letters: string[]) => void;
  setGameCompleted: (completed: boolean) => void;
  resetGame: () => void;
  
  // Getters
  getSelectedWord: () => string;
  isCellDisabled: (row: number, col: number) => boolean;
  isCellSelected: (row: number, col: number) => boolean;
  isGameComplete: () => boolean;
}

// Helper function to create a unique ID for each cell
const cellId = (row: number, col: number): string => `${row}-${col}`;

const useWordSearchStore = create<WordSearchState>()(
  persist(
    (set, get) => ({
      // Initial state
      gameData: null,
      activityId: null,
      lastInitTime: 0,
      selectedCells: [],
      foundWords: [],
      disabledCells: {},
      selectedLetters: '',
      temporaryLetters: [],
      selectionHistory: [],
      lastSelectionTime: Date.now(),
      gameCompleted: false,
      
      // Actions
      initialize: (gameData, activityId) => {
        const state = get();
        const now = Date.now();
        
        // Prevent multiple initializations in a short time period
        if (state.activityId === activityId && now - state.lastInitTime < 2000) {
          return; // Skip initialization if within 2 seconds of last init
        }
        
        // Don't reset game state if same activity
        if (state.activityId === activityId) {
          set({ 
            gameData,
            lastInitTime: now
          });
        } else {
          // New activity or first load
          set({ 
            gameData, 
            activityId,
            selectedCells: [],
            foundWords: [],
            disabledCells: {},
            selectedLetters: '',
            temporaryLetters: [],
            selectionHistory: [],
            lastSelectionTime: now,
            lastInitTime: now,
            gameCompleted: false
          });
        }
      },
      
      selectCell: (row, col) => {
        const state = get();
        
        // Don't allow selection if game is completed or cell is disabled
        if (state.gameCompleted || state.isCellDisabled(row, col)) return;
        
        let newSelectedCells: [number, number][];
        
        // Check if cell is already selected
        const isCellSelected = state.isCellSelected(row, col);
        
        if (isCellSelected) {
          // Remove cell if already selected
          newSelectedCells = state.selectedCells.filter(
            ([r, c]) => !(r === row && c === col)
          );
        } else {
          // Add cell to selection
          newSelectedCells = [...state.selectedCells, [row, col]];
        }
        
        // Get letters based on new selection
        const newLetters = state.gameData ? 
          newSelectedCells.map(([r, c]) => state.gameData?.grid[r][c] || '') : 
          [];
        
        set({
          selectedCells: newSelectedCells,
          selectedLetters: newLetters.join(''),
          temporaryLetters: newLetters,
          lastSelectionTime: Date.now()
        });
        
        // Check if a word has been formed
        if (newSelectedCells.length >= 2 && state.gameData) {
          const selectedWord = newSelectedCells
            .map(([r, c]) => state.gameData?.grid[r][c] || '')
            .join('')
            .toUpperCase();
          
          const reversedWord = selectedWord.split('').reverse().join('');
          
          if (state.gameData.words) {
            // Check if selection forms a word
            const wordFound = state.gameData.words.find(word => {
              const upperWord = word.toUpperCase();
              return upperWord === selectedWord || upperWord === reversedWord;
            });
            
            if (wordFound && !state.foundWords.includes(wordFound)) {
              // Add to history before marking as found
              state.addToSelectionHistory([...state.temporaryLetters]);
              
              // Add the found word
              state.addFoundWord(wordFound);
              
              // Mark cells as disabled
              newSelectedCells.forEach(([r, c]) => {
                state.addDisabledCell(r, c);
              });
              
              // Clear selection
              state.clearSelection();
              
              // Check if game is complete
              const updatedFoundWords = [...state.foundWords, wordFound];
              if (updatedFoundWords.length === state.gameData.words.length) {
                set({ gameCompleted: true });
              }
            }
          }
        }
      },
      
      clearSelection: () => set({
        selectedCells: [],
        selectedLetters: '',
        temporaryLetters: []
      }),
      
      addFoundWord: (word) => set(state => {
        // Prevent adding duplicates
        if (state.foundWords.includes(word)) {
          return state;
        }
        return {
          foundWords: [...state.foundWords, word]
        };
      }),
      
      addDisabledCell: (row, col) => set(state => {
        const id = cellId(row, col);
        
        // Skip if already disabled
        if (state.disabledCells[id]) {
          return state;
        }
        
        return {
          disabledCells: { 
            ...state.disabledCells, 
            [id]: true 
          }
        };
      }),
      
      addToSelectionHistory: (letters) => {
        if (letters.length === 0) return;
        
        const joinedLetters = letters.join('');
        const state = get();
        
        // Avoid adding consecutive duplicates
        if (state.selectionHistory.length > 0 && 
            state.selectionHistory[0].letters.join('') === joinedLetters) {
          return;
        }
        
        set(state => ({
          selectionHistory: [
            {
              letters: [...letters],
              timestamp: Date.now()
            },
            ...state.selectionHistory.slice(0, 9) // Keep only the 10 most recent
          ]
        }));
      },
      
      setGameCompleted: (completed) => set({ gameCompleted: completed }),
      
      resetGame: () => set(state => ({
        selectedCells: [],
        foundWords: [],
        disabledCells: {},
        selectedLetters: '',
        temporaryLetters: [],
        selectionHistory: [],
        lastSelectionTime: Date.now(),
        gameCompleted: false
      })),
      
      // Getters
      getSelectedWord: () => {
        const state = get();
        if (!state.gameData) return '';
        
        return state.selectedCells.map(([r, c]) => 
          state.gameData?.grid[r][c] || ''
        ).join('');
      },
      
      isCellDisabled: (row, col) => {
        const state = get();
        return !!state.disabledCells[cellId(row, col)];
      },
      
      isCellSelected: (row, col) => {
        const state = get();
        return state.selectedCells.some(([r, c]) => r === row && c === col);
      },
      
      isGameComplete: () => {
        const state = get();
        if (!state.gameData) return false;
        return state.gameCompleted || state.foundWords.length === state.gameData.words.length;
      }
    }),
    {
      name: 'word-search-storage',
      partialize: (state) => ({
        activityId: state.activityId,
        foundWords: state.foundWords,
        disabledCells: state.disabledCells,
        selectionHistory: state.selectionHistory,
        gameCompleted: state.gameCompleted
      }),
      // No merge option to prevent hydration bugs
    }
  )
);

// Single selector for game view props - reduce multiple subscriptions
export const useGameViewProps = () => useWordSearchStore(
  useShallow(state => ({
    gameData: state.gameData,
    activityId: state.activityId,
    foundWords: state.foundWords,
    temporaryLetters: state.temporaryLetters,
    selectionHistory: state.selectionHistory,
    gameCompleted: state.gameCompleted || 
      (state.gameData ? state.foundWords.length === state.gameData.words.length : false)
  }))
);

// Cell state selector
export const useCellState = (row: number, col: number) => useWordSearchStore(
  useShallow(state => ({
    isSelected: state.isCellSelected(row, col),
    isDisabled: state.isCellDisabled(row, col)
  }))
);

// Actions selector
export const useWordSearchActions = () => useWordSearchStore(
  useShallow(state => ({
    selectCell: state.selectCell,
    clearSelection: state.clearSelection,
    addToSelectionHistory: state.addToSelectionHistory,
    initialize: state.initialize
  }))
);

export default useWordSearchStore;