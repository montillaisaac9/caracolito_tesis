import React from 'react';
import { GameBase } from "./abstract/GameBase";


export class WordSearchGame extends GameBase {
  gameData = {
    grid: [],
    placedWords: [],
    words: []
  };
  gameState;

  constructor(activity) {
    super(activity);


    this.gameState = {
      ...this.gameState,
      selectedCells: [],
      foundWords: [],
      disabledCells: [],
      selectedLetters: '',
      selectionHistory: []
    };
  }

  initializeGame() {

    const config = this.activity.config;

    if (!config || !config.wordSearch) {
      console.error("Configuración de WordSearch inválida o faltante.");
      return;
    }
    this.gameData = this.generateWordSearchGrid(config);
  }

  render() {
    return (
      <div className="word-search-game flex flex-col md:flex-row gap-8 w-full p-6 bg-sky-50 rounded-lg shadow-md">
        <div className="flex-1 bg-white p-6 rounded-lg shadow-sm border border-sky-100">
          <h2 className="text-2xl font-bold text-sky-800 mb-4">Word Search: {this.activity.title}</h2>

          <div className="mb-6">
            <p className="text-sky-700 font-medium mb-2">Encuentra las siguientes palabras:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {this.gameData.words.map(word => (
                <li
                  key={word}
                  className={`px-3 py-1 rounded-md ${this.gameState.foundWords.includes(word)
                    ? 'bg-green-100 text-green-800 line-through'
                    : 'bg-sky-50 text-sky-800'}`}
                >
                  <span className="font-medium">{word}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="bg-sky-100 px-4 py-2 rounded-md flex flex-col gap-4">
              <span className="text-sm text-sky-600">Puntuación:</span>
              <span className="ml-2 text-xl font-bold text-sky-800">{this.gameState.score}</span>
              <span className="text-sm text-sky-600">Seleccionadas: {this.gameState.selectedLetters}</span>
            </div>

            {this.gameState.selectedCells.length > 0 && (
              <button
                onClick={() => this.handleAction({ type: 'CLEAR_SELECTION', payload: null })}
                className="px-4 py-2 bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200 transition-colors"
              >
                Restablecer selección
              </button>
            )}
          </div>

          {this.gameState.completed && (
            <div className="p-4 bg-green-100 text-green-800 rounded-md border border-green-200 animate-pulse">
              <p className="font-bold text-center">¡Juego Completado! 🎉</p>
            </div>
          )}
        </div>

        <div className="flex-1">
          <div
            className="word-search-grid inline-grid gap-1 p-4 bg-white rounded-lg shadow-sm border border-sky-200"
            style={{
              gridTemplateColumns: `repeat(${this.gameData.grid.length}, minmax(30px, 1fr))`,
              aspectRatio: '1/1'
            }}
          >
            {this.gameData.grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const cellId = `${rowIndex}-${colIndex}`;
                const isSelected = this.gameState.selectedCells.some(([r, c]) => r === rowIndex && c === colIndex);
                const isDisabled = this.gameState.disabledCells.includes(cellId);

                return (
                  <div
                    key={cellId}
                    onClick={() => !isDisabled && this.handleAction({
                      type: 'CELL_CLICK',
                      payload: { row: rowIndex, col: colIndex }
                    })}
                    className={`
                flex items-center justify-center 
                text-lg font-medium 
                rounded-sm transition-colors
                ${isDisabled
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : isSelected
                          ? 'bg-sky-500 text-white cursor-pointer shadow-md'
                          : 'bg-sky-100 text-sky-800 hover:bg-sky-200 cursor-pointer'}
              `}
                  >
                    {cell}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  handleAction(action) {


    const typedAction = action;

    if (this.gameState.completed) {
      console.log("El juego ya ha sido completado.");
      return;
    }

    switch (typedAction.type) {
      case 'CELL_CLICK':
        this.handleCellClick(typedAction.payload.row, typedAction.payload.col);
        break;
      case 'CLEAR_SELECTION':
        this.clearSelection();
      default:
        console.warn("Acción desconocida:", typedAction);
    }
  }

  generateWordSearchGrid(config) {
    const { words, gridSize, allowDiagonal, allowBackwards } = config.wordSearch;
    

    if (!words || words.length === 0) {
        throw new Error("Debe proporcionar al menos una palabra");
    }
    
    const maxWordLength = Math.max(...words.map(word => word.length));
    if (maxWordLength > gridSize) {
        throw new Error(`El tamaño del grid (${gridSize}) es menor que la palabra más larga (${maxWordLength})`);
    }

    const grid = Array.from({ length: gridSize }, () => 
        Array.from({ length: gridSize }, () => '')
    );
    const placedWords = [];

    const allDirections = [
        [0, 1],    
        [1, 0],   
        [1, 1],     
        [1, -1],    
        [0, -1],    
        [-1, 0],    
        [-1, -1],   
        [-1, 1]     
    ];

    const allowedDirections = allDirections.filter((dir, index) => {
        if (index < 4) return true;
        return allowBackwards;
    }).filter((dir, index) => {
        if (index === 2 || index === 3 || index === 6 || index === 7) {
            return allowDiagonal;
        }
        return true;
    });

    const canPlaceWord = (word, row, col, dRow, dCol) => {
        const length = word.length;
        
        const endRow = row + (length - 1) * dRow;
        const endCol = col + (length - 1) * dCol;
        
        if (endRow < 0 || endRow >= gridSize || endCol < 0 || endCol >= gridSize) {
            return false;
        }
        
        for (let i = 0; i < length; i++) {
            const currentRow = row + i * dRow;
            const currentCol = col + i * dCol;
            const currentCell = grid[currentRow][currentCol];
            
            if (currentCell !== '' && currentCell !== word[i].toLowerCase()) {
                return false;
            }
        }
        
        return true;
    };

    const placeWord = (word, row, col, dRow, dCol) => {
        const upperWord = word.toLowerCase();
        for (let i = 0; i < upperWord.length; i++) {
            const currentRow = row + i * dRow;
            const currentCol = col + i * dCol;
            grid[currentRow][currentCol] = upperWord[i];
        }
        
        placedWords.push({
            word: upperWord,
            start: { row, col },
            end: {
                row: row + (upperWord.length - 1) * dRow,
                col: col + (upperWord.length - 1) * dCol
            },
            direction: [dRow, dCol]
        });
    };

    const sortedWords = [...words].sort((a, b) => b.length - a.length);

    for (const word of sortedWords) {
        if (typeof word !== 'string' || word.length === 0) {
            console.warn(`Palabra inválida: ${word}`);
            continue;
        }

        const cleanWord = word.replace(/[^a-zA-Z]/g, ''); 
        if (cleanWord.length === 0) {
            console.warn(`Palabra vacía después de limpieza: ${word}`);
            continue;
        }

        let placed = false;
        let attempts = 0;
        const maxAttempts = 100; 

        const shuffledDirections = [...allowedDirections].sort(() => Math.random() - 0.5);

        while (!placed && attempts < maxAttempts) {
            attempts++;
            
            for (const direction of shuffledDirections) {
                let [dRow, dCol] = direction;
                
                const startRow = Math.floor(Math.random() * gridSize);
                const startCol = Math.floor(Math.random() * gridSize);
                
                if (canPlaceWord(cleanWord, startRow, startCol, dRow, dCol)) {
                    placeWord(cleanWord, startRow, startCol, dRow, dCol);
                    placed = true;
                    break;
                }
                
                // Intentar también en dirección inversa (si no es la misma)
                if (dRow !== 0 || dCol !== 0) {
                    if (canPlaceWord(cleanWord, startRow, startCol, -dRow, -dCol)) {
                        placeWord(cleanWord, startRow, startCol, -dRow, -dCol);
                        placed = true;
                        break;
                    }
                }
            }
        }
        
        if (!placed) {
            console.warn(`No se pudo colocar la palabra: ${cleanWord}`);
        }
    }

    const vowels = 'AEIOU';
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (grid[r][c] === '') {
                grid[r][c] = Math.random() < 0.4 
                    ? vowels.charAt(Math.floor(Math.random() * vowels.length))
                    : String.fromCharCode(65 + Math.floor(Math.random() * 26));
            }
        }
    }

    return {
        grid,
        placedWords,
        words: sortedWords.map(word => word.toUpperCase())
    };
}

  handleCellClick(row, col) {
    const cellId = `${row}-${col}`;

    // Evitar seleccionar celdas ya deshabilitadas
    if (this.gameState.disabledCells.includes(cellId)) {
      return;
    }

    const currentSelection = this.gameState.selectedCells;
    const alreadySelected = currentSelection.some(([r, c]) => r === row && c === col);

    let newSelection;
    let newSelectedLetters = '';

    if (alreadySelected) {
      newSelection = [];
      newSelectedLetters = '';
    } else {
      newSelection = [...currentSelection, [row, col]];
    }

    newSelectedLetters = newSelection.map(([r, c]) => this.gameData.grid[r][c]).join('');
    

    this.updateGameState({
      selectedCells: newSelection,
      selectedLetters: newSelectedLetters,
    });



    this.checkWordSelection(newSelectedLetters, newSelection);
  }


  checkWordSelection(selectedString, selectionCoords) { 
    
    const potentialWord = selectedString;
    const potentialWordReversed = selectedString.split('').reverse().join('');

    const wordData = this.gameData.placedWords.find(placed =>
      (placed.word === potentialWord || placed.word === potentialWordReversed) &&
      !this.gameState.foundWords.includes(placed.word)
    );

    

    if (wordData) {
      const newFoundWords = [...this.gameState.foundWords, wordData.word];
      const newDisabledCells = [
        ...this.gameState.disabledCells,
        ...this.getCoordinatesForPlacedWord(wordData).map(([r, c]) => `${r}-${c}`)
      ];

      this.updateGameState({
        foundWords: newFoundWords,
        disabledCells: newDisabledCells,
        selectedCells: [],
        selectedLetters: '',
      });

      const newScore = this.calculateScore(); 
      this.updateGameState({ score: newScore });

      

      if (newFoundWords.length === this.gameData.words.length) {
        console.log("¡Todas las palabras encontradas!");
        this.completeGame(); 
        return true; 

      } else {
        this.saveProgress(); 
        return false; 

      }
    }
  }

  matchCoordinates(selectedCoords, placedWord) { 
    const placedCoords = this.getCoordinatesForPlacedWord(placedWord);

    if (selectedCoords.length !== placedCoords.length) {
      return false;
    }
    const selectedSet = new Set(selectedCoords.map(([r, c]) => `${r}-${c}`));
    const placedSet = new Set(placedCoords.map(([r, c]) => `${r}-${c}`));

    if (selectedSet.size !== placedSet.size) return false;
    for (const coord of selectedSet) {
      if (!placedSet.has(coord)) return false;
    }

    return true;
  }

  getCoordinatesForPlacedWord(placedWord) {
    const coords = []; 
    const { startRow, startCol, endRow, endCol } = placedWord;
    const dr = Math.sign(endRow - startRow);
    const dc = Math.sign(endCol - startCol);
    let r = startRow;
    let c = startCol;

    while (true) {
      coords.push([r, c]);
      if (r === endRow && c === endCol) break;
      r += dr;
      c += dc;
      if (coords.length > this.gameData.grid.length * 2) {
        console.error("Error determinando coordenadas para", placedWord);
        return [];
      }
    }
    return coords; 
  }



  clearSelection() {
    this.updateGameState({
      selectedCells: [],
      selectedLetters: '',
    });
    console.log("Selección limpiada.");
  }

  calculateScore() {
    const wordsFound = this.gameState.foundWords.length;
    const totalWords = this.gameData.words.length;
    if (totalWords === 0) {
      return 0;
    }
    const score = Math.floor((wordsFound / totalWords) * this.activity.points);
    return score; 
  }

}