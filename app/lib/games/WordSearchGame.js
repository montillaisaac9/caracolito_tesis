import React from 'react';
import { GameBase } from "./abstract/GameBase";

export class WordSearchGame extends GameBase {
  gameData = {
    grid: [],
    placedWords: [],
    words: []
  };
  
  gameState = {
    selectedCells: new Set(),
    foundWords: new Set(),
    disabledCells: new Set(),
    selectedLetters: '',
    selectionHistory: []
  };

  constructor(activity) {
    super(activity);
    this.gameCompleted = null;
  }

  initializeGame() {
    const config = this.activity.config;

    if (!config?.wordSearch) {
      console.error("Configuración de WordSearch inválida o faltante.");
      return;
    }
    
    this.gameData = this.generateWordSearchGrid(config);
  }

  render() {
    const { grid, words } = this.gameData;
    const { foundWords, selectedCells, selectedLetters, completed } = this.gameState;
    const foundWordsArray = Array.from(foundWords);
    const gridSize = grid.length;

    return (
      <div className="word-search-game flex flex-col md:flex-row gap-8 w-full p-6 bg-sky-50 rounded-lg shadow-md">
        <div className="flex-1 bg-white p-6 rounded-lg shadow-sm border border-sky-100">
          <h2 className="text-2xl font-bold text-sky-800 mb-4">Word Search: {this.activity.title}</h2>

          <div className="mb-6">
            <p className="text-sky-700 font-medium mb-2">Encuentra las siguientes palabras:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {words.map(word => {
                const isFound = foundWordsArray.includes(word.toLowerCase());
                return (
                  <li
                    key={word}
                    className={`px-3 py-1 rounded-md ${
                      isFound
                        ? 'bg-green-100 text-green-800 line-through'
                        : 'bg-sky-50 text-sky-800'
                    }`}
                  >
                    <span className="font-medium">{word}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="bg-sky-100 px-4 py-2 rounded-md flex flex-col gap-4">
              <span className="text-sm text-sky-600">Puntuación:</span>
              <span className="ml-2 text-xl font-bold text-sky-800">{this.gameState.score}</span>
              <span className="text-sm text-sky-600">Seleccionadas: {selectedLetters}</span>
            </div>

            {selectedCells.size > 0 && (
              <button
                onClick={() => this.handleAction({ type: 'CLEAR_SELECTION', payload: null })}
                className="px-4 py-2 bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200 transition-colors"
              >
                Restablecer selección
              </button>
            )}
          </div>

          {completed && (
            <div className="p-4 bg-green-100 text-green-800 rounded-md border border-green-200 animate-pulse">
              <p className="font-bold text-center">¡Juego Completado! 🎉</p>
            </div>
          )}
        </div>

        <div className="flex-1">
          <div
            className="word-search-grid inline-grid gap-1 p-4 bg-white rounded-lg shadow-sm border border-sky-200"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(30px, 1fr))`,
              aspectRatio: '1/1'
            }}
          >
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const cellId = `${rowIndex}-${colIndex}`;
                const isSelected = selectedCells.has(cellId);
                const isDisabled = this.gameState.disabledCells.has(cellId);

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
                      ${
                        isDisabled
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : isSelected
                            ? 'bg-sky-500 text-white cursor-pointer shadow-md'
                            : 'bg-sky-100 text-sky-800 hover:bg-sky-200 cursor-pointer'
                      }
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
    if (this.gameState.completed) {
      console.log("El juego ya ha sido completado.");
      return;
    }

    switch (action.type) {
      case 'CELL_CLICK':
        this.handleCellClick(action.payload.row, action.payload.col);
        break;
      case 'CLEAR_SELECTION':
        this.clearSelection();
        break;
      default:
        console.warn("Acción desconocida:", action);
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
      [0, 1],    // derecha
      [1, 0],    // abajo
      [1, 1],    // diagonal abajo-derecha
      [1, -1],   // diagonal abajo-izquierda
      [0, -1],   // izquierda
      [-1, 0],   // arriba
      [-1, -1],  // diagonal arriba-izquierda
      [-1, 1]    // diagonal arriba-derecha
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

    const sortedWords = [...words]
      .filter(word => typeof word === 'string' && word.length > 0)
      .map(word => word.replace(/[^a-zA-Z]/g, ''))
      .filter(word => word.length > 0)
      .sort((a, b) => b.length - a.length);

    for (const word of sortedWords) {
      let placed = false;
      let attempts = 0;
      const maxAttempts = 100;
      const shuffledDirections = [...allowedDirections].sort(() => Math.random() - 0.5);

      while (!placed && attempts < maxAttempts) {
        attempts++;
        
        for (const direction of shuffledDirections) {
          const [dRow, dCol] = direction;
          const startRow = Math.floor(Math.random() * gridSize);
          const startCol = Math.floor(Math.random() * gridSize);
          
          if (canPlaceWord(word, startRow, startCol, dRow, dCol)) {
            placeWord(word, startRow, startCol, dRow, dCol);
            placed = true;
            break;
          }
          
          if (dRow !== 0 || dCol !== 0) {
            if (canPlaceWord(word, startRow, startCol, -dRow, -dCol)) {
              placeWord(word, startRow, startCol, -dRow, -dCol);
              placed = true;
              break;
            }
          }
        }
      }
      
      if (!placed) {
        console.warn(`No se pudo colocar la palabra: ${word}`);
      }
    }

    // Rellenar celdas vacías con letras aleatorias
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

    if (this.gameState.disabledCells.has(cellId)) {
      return;
    }

    const selectedCells = new Set(this.gameState.selectedCells);
    let selectedLetters = '';

    if (selectedCells.has(cellId)) {
      selectedCells.clear();
    } else {
      selectedCells.add(cellId);
      selectedLetters = Array.from(selectedCells)
        .map(id => {
          const [r, c] = id.split('-').map(Number);
          return this.gameData.grid[r][c];
        })
        .join('');
    }

    this.updateGameState({
      selectedCells,
      selectedLetters
    });

    if (selectedCells.size > 1) {
      this.checkWordSelection(selectedLetters, selectedCells);
    }
  }

  checkWordSelection(selectedString, selectedCellsSet) {
    const potentialWord = selectedString.toLowerCase();
    const potentialWordReversed = selectedString.split('').reverse().join('').toLowerCase();

    const wordData = this.gameData.placedWords.find(placed => 
      (placed.word === potentialWord || placed.word === potentialWordReversed) &&
      !this.gameState.foundWords.has(placed.word)
    );

    if (!wordData) return false;

    const wordCoords = this.getCoordinatesForPlacedWord(wordData);
    const selectedCoords = Array.from(selectedCellsSet).map(id => {
      const [r, c] = id.split('-').map(Number);
      return [r, c];
    });

    if (!this.matchCoordinates(selectedCoords, wordCoords)) {
      return false;
    }

    const newFoundWords = new Set(this.gameState.foundWords).add(wordData.word);
    const newDisabledCells = new Set(this.gameState.disabledCells);
    
    wordCoords.forEach(([r, c]) => {
      newDisabledCells.add(`${r}-${c}`);
    });

    this.updateGameState({
      foundWords: newFoundWords,
      disabledCells: newDisabledCells,
      selectedCells: new Set(),
      selectedLetters: '',
    });

    const newScore = this.calculateScore();
    this.updateGameState({ score: newScore });

    if (newFoundWords.size === this.gameData.words.length) {
      this.completeGame();
      return true;
    }

    this.saveProgress();
    return false;
  }

  matchCoordinates(selectedCoords, wordCoords) {
    if (selectedCoords.length !== wordCoords.length) return false;

    const selectedSet = new Set(selectedCoords.map(([r, c]) => `${r}-${c}`));
    const wordSet = new Set(wordCoords.map(([r, c]) => `${r}-${c}`));

    if (selectedSet.size !== wordSet.size) return false;
    
    for (const coord of selectedSet) {
      if (!wordSet.has(coord)) return false;
    }

    return true;
  }

  getCoordinatesForPlacedWord(placedWord) {
    const coords = [];
    const { start, end } = placedWord;
    const dr = Math.sign(end.row - start.row);
    const dc = Math.sign(end.col - start.col);
    
    let r = start.row;
    let c = start.col;

    while (true) {
      coords.push([r, c]);
      if (r === end.row && c === end.col) break;
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
      selectedCells: new Set(),
      selectedLetters: '',
    });
  }

  calculateScore() {
    const wordsFound = this.gameState.foundWords.size;
    const totalWords = this.gameData.words.length;
    
    if (totalWords === 0) return 0;
    
    return Math.floor((wordsFound / totalWords) * this.activity.points);
  }
}