import React from 'react';
import { GameBase } from "./abstract/GameBase";
import GridCell from './components/WordSearchGridCell';

export class WordSearchGame extends GameBase {
  // Aseguramos que gameData y gameState se inicialicen en el constructor o initializeGame
  // para evitar redefinir propiedades que ya están en GameBase.
  // Si necesitas datos iniciales específicos, defínelos en initializeGame.

  constructor(activity) {
    super(activity);
    // Puedes inicializar gameData y gameState aquí si no dependen de activity.config
    // Si dependen de config, es mejor hacerlo en initializeGame como ya lo haces.
    // this.gameData = ...;
    // this.gameState = { ... };

    // La propiedad gameCompleted ya existe en GameBase y se inicializa a false.
    // No necesitas redefinirla aquí a null a menos que tengas una razón específica.
    // Si quieres indicar un estado inicial diferente antes de initializeGame, podrías usar una bandera adicional.
    // Por ahora, mantendremos la inicialización de GameBase.
    // this.gameCompleted = null; // Comentado para usar la de GameBase
  }

  initializeGame() {
    // Llama al initializeGame de la clase base si necesitas lógica común
    // super.initializeGame(); // Opcional, si GameBase.initializeGame tuviera implementación

    const config = this.activity.config;

    if (!config?.wordSearch) {
      console.error("Configuración de WordSearch inválida o faltante.");
      // Establecer un estado de error o terminar la inicialización
      this.gameData = { grid: [], placedWords: [], words: [] }; // Evitar errores de renderizado con datos vacíos
      return;
    }

    try {
      this.gameData = this.generateWordSearchGrid(config);
      // Inicializar el estado del juego con valores por defecto después de generar la cuadrícula
      this.gameState = {
        score: 0,
        completed: false,
        gameCompleted: false, // Este parece redundante con 'completed' y gameCompleted de la instancia. Considera usar solo 'completed'
        timeRemaining: this.activity.timeLimit ?? null, // Inicializar tiempo si existe en la actividad
        selectedCells: new Set(),
        foundWords: new Set(),
        disabledCells: new Set(),
        selectedLetters: '',
        selectionHistory: [] // Si no usas history, considera quitarlo
      };
       // Asegurarse de que gameCompleted de la instancia esté sincronizado si usas gameState.gameCompleted
       this.gameCompleted = this.gameState.completed;

    } catch (error) {
      console.error("Error al generar la cuadrícula de búsqueda de palabras:", error);
      // Manejar el error, quizás mostrando un mensaje en la UI
      this.gameData = { grid: [], placedWords: [], words: [] }; // Asegurar datos vacíos
      this.gameState = {
        score: 0, completed: false, gameCompleted: false, timeRemaining: null,
        selectedCells: new Set(), foundWords: new Set(), disabledCells: new Set(), selectedLetters: '', selectionHistory: []
      };
       this.gameCompleted = false;
    }
  }


  render() {
    // Asegurarse de que gameData y gameState estén inicializados antes de renderizar
    if (!this.gameData || !this.gameState) {
        // Puedes retornar un indicador de carga o un mensaje de error si la inicialización falló
        return <div>Cargando juego...</div>;
    }

    const { grid, words } = this.gameData;
    const { foundWords, selectedCells, selectedLetters, completed } = this.gameState;

    const gridSize = grid.length;

    return (
      <div className="word-search-game flex flex-col md:flex-row gap-8 w-full p-6 bg-sky-50 rounded-lg shadow-md">
        <div className="flex-1 bg-white p-6 rounded-lg shadow-sm border border-sky-100">
          <h2 className="text-2xl font-bold text-sky-800 mb-4">Word Search: {this.activity.title}</h2>

          <div className="mb-6">
            <p className="text-sky-700 font-medium mb-2">Encuentra las siguientes palabras:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {words.map(word => {
                // Optimization: Use Set.has()
                const isFound = foundWords.has(word.toLowerCase());
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
                onClick={() => this.handleAction({ type: 'CLEAR_SELECTION' })} // Payload no es necesario aquí
                className="px-4 py-2 bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200 transition-colors"
              >
                Restablecer selección
              </button>
            )}
          </div>

          {/* Usar this.isCompleted() para mayor consistencia con la base */}
          {this.isCompleted() && (
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
                  <GridCell // Usamos el componente memorizado aquí
                    key={cellId}
                    letter={cell}
                    isSelected={isSelected}
                    isDisabled={isDisabled}
                    onCellClick={() => this.handleAction({ // Pasamos la función de acción
                      type: 'CELL_CLICK',
                      payload: { row: rowIndex, col: colIndex }
                    })}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  handleAction(action) {
    // Usar this.isCompleted() para verificar si el juego ya terminó
    if (this.isCompleted()) {
      return;
    }

    // Corrección: Usar '===' para comparar el tipo de acción
    if (action.type === 'CELL_CLICK') {
      this.handleCellClick(action.payload.row, action.payload.col);
    } else if (action.type === "CLEAR_SELECTION") { // Corrección aquí
      this.clearSelection();
    } else {
      console.log("Tipo de acción desconocido:", action.type);
    }
  }

  // ... (El método generateWordSearchGrid queda igual)
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

          // Try original directions first
          for (const direction of shuffledDirections) {
            const [dRow, dCol] = direction;
            const startRow = Math.floor(Math.random() * gridSize);
            const startCol = Math.floor(Math.random() * gridSize);

            if (canPlaceWord(word, startRow, startCol, dRow, dCol)) {
              placeWord(word, startRow, startCol, dRow, dCol);
              placed = true;
              break;
            }
          }

           // If not placed, try reversed directions (if allowed and not already a non-directional word)
           if (!placed && allowBackwards) {
             const shuffledReverseDirections = shuffledDirections
               .map(([dr, dc]) => [-dr, -dc])
               .filter(([dr, dc]) => dr !== 0 || dc !== 0) // Ensure not trying reverse for [0,0] (which isn't in allDirections anyway)
               .sort(() => Math.random() - 0.5);

             for (const direction of shuffledReverseDirections) {
                const [dRow, dCol] = direction;
                const startRow = Math.floor(Math.random() * gridSize);
                const startCol = Math.floor(Math.random() * gridSize);

                 if (canPlaceWord(word, startRow, startCol, dRow, dCol)) {
                   placeWord(word, startRow, startCol, dRow, dCol);
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

    // Rellenar celdas vacías con letras aleatorias (solo minúsculas para consistencia)
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (grid[r][c] === '') {
           grid[r][c] = letters.charAt(Math.floor(Math.random() * letters.length));
        }
      }
    }

    // Convertir palabras encontradas a mayúsculas si la visualización lo requiere,
    // pero mantener lowercase en gameData.placedWords para comparación.
    // Opcional: podrías guardar las palabras originales (mayúsculas/minúsculas) y
    // normalizar a minúsculas solo para la comparación.
    const wordsForDisplay = sortedWords.map(word => word.toUpperCase());


    return {
      grid,
      placedWords, // Palabras en minúsculas aquí
      words: wordsForDisplay // Palabras en mayúsculas para mostrar en la lista
    };
  }


  handleCellClick(row, col) {
    const cellId = `${row}-${col}`;

    if (this.gameState.disabledCells.has(cellId)) {
      return;
    }

    const selectedCells = new Set(this.gameState.selectedCells);
    let selectedLetters = '';

    // If the clicked cell is already selected and it's the ONLY selected cell, clear.
    // If it's not the only one, it might be part of a new selection path.
    // Let's simplify: if the clicked cell is already in the set, clear the selection.
    if (selectedCells.has(cellId)) {
       // Clear only if it was the last selected cell OR
       // if clicking it again means de-selecting (common UI pattern)
       selectedCells.clear();
       selectedLetters = '';
    } else {
       // Add the clicked cell
       selectedCells.add(cellId);

       // Rebuild selectedLetters from the potentially new set of cells
       // Sorting the cellIds ensures letters are in a consistent order for checkWordSelection
       // Only sort if there's more than one cell selected, as sorting is costly
       if (selectedCells.size > 1) {
           const sortedCellIds = Array.from(selectedCells).sort((a, b) => {
             const [r1, c1] = a.split('-').map(Number);
             const [r2, c2] = b.split('-').map(Number);
             if (r1 !== r2) return r1 - r2;
             return c1 - c2;
           });

           selectedLetters = sortedCellIds
             .map(id => {
               const [r, c] = id.split('-').map(Number);
               return this.gameData.grid[r][c];
             })
             .join('');
       } else {
           // If only one cell selected, the letter is just that cell's letter
           const [r, c] = cellId.split('-').map(Number);
           selectedLetters = this.gameData.grid[r][c];
       }
    }

    // Update state *before* checking for a word
    this.updateGameState({
      selectedCells,
      selectedLetters
    });

    // Check for a word only if there are multiple cells selected
    if (selectedCells.size > 1) {
      this.checkWordSelection(selectedLetters, selectedCells);
    }
  }

  checkWordSelection(selectedString, selectedCellsSet) {
    const potentialWord = selectedString.toLowerCase();
    // Consider if reversed words are allowed based on config, don't always check reversed
    // const potentialWordReversed = this.activity.config?.wordSearch?.allowBackwards
    //   ? selectedString.split('').reverse().join('').toLowerCase()
    //   : null;

    // Find the placed word that matches the potential selection
    let wordData = this.gameData.placedWords.find(placed =>
      (placed.word === potentialWord /* || (potentialWordReversed && placed.word === potentialWordReversed) */) &&
      !this.gameState.foundWords.has(placed.word) // Ensure the word hasn't been found yet
    );

    if (!wordData) {
        // If no word found, check if the reversed selection matches a placed word
        const potentialWordReversed = selectedString.split('').reverse().join('').toLowerCase();
        const reversedWordData = this.activity.config?.wordSearch?.allowBackwards ?
           this.gameData.placedWords.find(placed =>
              placed.word === potentialWordReversed && !this.gameState.foundWords.has(placed.word)
           ) : null;

        if (!reversedWordData) {
             // No matching placed word found in either direction
             // Consider clearing selection here if the selected string cannot form any word
             // Or let the user continue selecting. Current logic lets them continue.
             return false;
        } else {
            wordData = reversedWordData; // Use the reversed word data
        }
    }


    // Get the coordinates for the matched placed word
    const wordCoords = this.getCoordinatesForPlacedWord(wordData);

    // Check if the selected cells match the exact word placement coordinates
    const selectedCoords = Array.from(selectedCellsSet).map(id => {
      const [r, c] = id.split('-').map(Number);
      return [r, c];
    });

    if (!this.matchCoordinates(selectedCoords, wordCoords)) {
      // The selected cells don't match the exact word placement coordinates
      // Consider providing feedback or clearing selection here
       // This means the user selected letters that form a word, but not along a straight line
       // that matches a placed word. Clear selection might be a good UX.
       // this.clearSelection(); // Optional: Clear selection if it's not a valid path
       return false;
    }

    // Word found! Update state
    const newFoundWords = new Set(this.gameState.foundWords).add(wordData.word);
    const newDisabledCells = new Set(this.gameState.disabledCells);

    // Disable the cells of the found word
    wordCoords.forEach(([r, c]) => {
      newDisabledCells.add(`${r}-${c}`);
    });

    // Calculate new score BEFORE updating state
    const newScore = this.calculateScore(newFoundWords); // Pasamos el nuevo set de palabras encontradas

    // Consolidar las actualizaciones de estado en una sola llamada
    this.updateGameState({
      foundWords: newFoundWords,
      disabledCells: newDisabledCells,
      selectedCells: new Set(), // Clear selection
      selectedLetters: '', // Clear selected letters
      score: newScore, // Actualizar score
    });

    // Check for game completion
    if (newFoundWords.size === this.gameData.words.length) {
      this.completeGame(); // completeGame llama a saveProgress y onGameComplete
      // No necesitamos llamar a saveProgress aquí si completeGame ya lo hace
    } else {
       // Si el juego no ha terminado, guardar progreso después de encontrar una palabra
       // Puedes decidir si guardar progreso en cada palabra encontrada o solo al final
       // this.saveProgress(); // Opcional: guardar progreso en cada palabra encontrada
    }


    return true; // Word was found and matched
  }

  // Optimization 2: Optimized coordinate matching (ya estaba en tu código, la mantenemos)
  matchCoordinates(selectedCoords, wordCoords) {
    if (selectedCoords.length !== wordCoords.length) return false;

    // Sort both coordinate arrays for reliable comparison
    const sortCoords = (coords) => coords.sort((a, b) => {
      if (a[0] !== b[0]) return a[0] - b[0]; // Sort by row
      return a[1] - b[1]; // Then by column
    });

    const sortedSelected = sortCoords([...selectedCoords]);
    const sortedWord = sortCoords([...wordCoords]);

    // Compare sorted arrays element by element
    for (let i = 0; i < sortedSelected.length; i++) {
      if (sortedSelected[i][0] !== sortedWord[i][0] || sortedSelected[i][1] !== sortedWord[i][1]) {
        return false; // Coordinates don't match at this position
      }
    }

    return true; // All coordinates matched in order
  }

  // ... (El método getCoordinatesForPlacedWord queda igual)
  getCoordinatesForPlacedWord(placedWord) {
    const coords = [];
    const { start, end } = placedWord;
    // Aseguramos que dr y dc sean 0, 1 o -1
    const dr = end.row === start.row ? 0 : Math.sign(end.row - start.row);
    const dc = end.col === start.col ? 0 : Math.sign(end.col - start.col);

    let r = start.row;
    let c = start.col;

    while (true) {
      coords.push([r, c]);
      // Usamos una tolerancia pequeña para flotantes si Math.sign generara algo inesperado,
      // pero con enteros no debería ser un problema.
      // La condición r === end.row && c === end.col es suficiente si dr y dc son -1, 0, o 1.
      if (r === end.row && c === end.col) break;

      r += dr;
      c += dc;

      // Safety break para evitar bucles infinitos en caso de lógica incorrecta
      // Se puede ajustar el límite, por ejemplo, al número total de celdas + 1
      if (coords.length > this.gameData.grid.length * this.gameData.grid[0].length + 1) {
        console.error("Error determining coordinates for", placedWord, " - Potential infinite loop.");
        // Limpiar la selección actual o lanzar un error podría ser necesario
        this.clearSelection(); // Intentar limpiar la selección para recuperarse
        return []; // Retornar array vacío para evitar más errores
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

  // Modificamos calculateScore para recibir el set de palabras encontradas
  calculateScore(foundWordsSet = this.gameState.foundWords) {
    const wordsFound = foundWordsSet.size;
    const totalWords = this.gameData.words.length; // Usamos gameData.words que contiene todas las palabras

    if (totalWords === 0) return 0;

    // Aseguramos que la puntuación sea un número entero
    return Math.floor((wordsFound / totalWords) * this.activity.points);
  }

  // Sobrescribimos saveProgress para que la WordSearchGame tenga su propia implementación si es necesario
  // Aunque la implementación en GameBase llama al API, puedes añadir lógica específica aquí si la necesitas.
   async saveProgress() {
     console.log("Guardando progreso de WordSearchGame:", this.gameState);
     // Aquí podrías añadir lógica específica antes o después de llamar a super.saveProgress()
     // super.saveProgress(); // Llama a la implementación de GameBase si deseas usarla
   }

   // Sobrescribimos completeGame para asegurar que la sincronización de estados sea correcta
   completeGame() {
       // Primero, aseguramos que el estado interno refleje completado
       this.gameState.completed = true;
       this.gameState.score = this.calculateScore(); // Aseguramos que el score final esté calculado

       // Luego, llamamos al método de la base que actualiza la bandera gameCompleted de la instancia
       // y llama al callback onGameComplete y saveProgress.
       super.completeGame();
   }


}