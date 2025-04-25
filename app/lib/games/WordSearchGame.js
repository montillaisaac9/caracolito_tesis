import React from 'react'; // Necesario para JSX
// Asume que GameBase está en esta ruta y es una clase exportada
import { GameBase } from "./abstract/GameBase";

// Se eliminan las importaciones de tipos
// import { Activity, GameState, WordSearchConfig } from "./types";

// Se eliminan todas las definiciones de tipos personalizadas
// type WordSearchGameData = { ... };
// type WordSearchState = { ... };
// type FullWordSearchState = GameState & WordSearchState;


// Se elimina 'export class WordSearchGame extends GameBase' como estaba en TS,
// y los modificadores de acceso 'protected' en la declaración de clase.
export class WordSearchGame extends GameBase {
  // Se elimina la anotación de tipo ': WordSearchGameData' y 'protected'.
  // La inicialización se mantiene.
  gameData = {
    grid: [],
    placedWords: [],
    words: []
  };

  // Se elimina la anotación de tipo ': FullWordSearchState' y 'protected'.
  // La inicialización se completará en el constructor.
  gameState; // Declarada pero su inicialización principal ocurre después de super()

  // Se elimina la anotación de tipo del parámetro 'activity: Activity'
  constructor(activity) {
    // Llama al constructor de GameBase.
    // GameBase inicializa this.activity, this.gameState (base: { score: 0, completed: false }),
    // y this.gameData a null.
    super(activity);

    // Inicializa/Completa gameState con las propiedades específicas de WordSearch.
    // El '...this.gameState' trae las propiedades base de GameBase.
    this.gameState = {
      ...this.gameState, // Mantiene score y completed de GameBase
      selectedCells: [],
      foundWords: [],
      disabledCells: [],
      selectedLetters: '',
      selectionHistory: []
    };

    // Nota: this.gameData ya fue inicializado en la declaración de la propiedad arriba
    // con el objeto { grid: [], ... }. Esta inicialización en la clase hija
    // sobrescribe el `this.gameData = null;` que ocurre en el constructor de GameBase
    // para esta instancia específica, que es el comportamiento deseado aquí.
  }

  // --- Implementación de Métodos Abstractos de GameBase ---

  /**
   * Inicializa la configuración del juego, generando el grid.
   */
  // Se elimina la anotación de tipo ': void'
  initializeGame() {
    // Se elimina la aserción de tipo 'as WordSearchConfig'.
    // En JS, accedes directamente a las propiedades.
    const config = this.activity.config; // config puede ser undefined o un objeto

    if (!config || !config.wordSearch) {
        console.error("Configuración de WordSearch inválida o faltante.");
        return;
    }      
    // Se asume que config es el objeto esperado por generateWordSearchGrid
    this.gameData = this.generateWordSearchGrid(config);
  }

  /**
   * Renderiza la interfaz de usuario del juego.
   * Debe devolver JSX o un nodo React válido.
   */
  // Se elimina la anotación de tipo ': React.ReactNode'
  render() {
    // El código JSX se mantiene tal cual
    return (
      <div className="word-search-game">
        <h2>Word Search: {this.activity.title}</h2>
        <p>Encuentra las siguientes palabras:</p>
        <ul>
          {this.gameData.words.map(word => (
            <li key={word} style={{ textDecoration: this.gameState.foundWords.includes(word) ? 'line-through' : 'none' }}>
              {word}
            </li>
          ))}
        </ul>
        <div className="word-search-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${this.gameData.grid.length}, 30px)` }}>
            {/* Lógica para renderizar el grid */}
            {this.gameData.grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                    const cellId = `${rowIndex}-${colIndex}`;
                    // La lógica de selección y deshabilitación se mantiene
                    const isSelected = this.gameState.selectedCells.some(([r, c]) => r === rowIndex && c === colIndex);
                    const isDisabled = this.gameState.disabledCells.includes(cellId);
                    return (
                        <div
                            key={cellId}
                            // Se elimina la anotación de tipo 'action: any' en handleAction llamada desde onClick
                            onClick={() => !isDisabled && this.handleAction({ type: 'CELL_CLICK', payload: { row: rowIndex, col: colIndex } })}
                            style={{
                                border: '1px solid #ccc',
                                width: '30px',
                                height: '30px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: isDisabled ? '#a3a3a3' : isSelected ? '#a5d6a7' : '#fff',
                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                userSelect: 'none'
                            }}
                        >
                            {cell}
                        </div>
                    );
                })
            )}
        </div>
         {/* Botón opcional para limpiar selección */}
         {this.gameState.selectedCells.length > 0 && (
            <button onClick={() => this.handleAction({ type: 'CLEAR_SELECTION', payload: null })}>
              Limpiar Selección
            </button>
          )}
        <p>Puntuación: {this.gameState.score}</p>
        {this.gameState.completed && <p>¡Juego Completado!</p>}
      </div>
    );
  }

  /**
   * Maneja las acciones del usuario (clicks en celdas, etc.).
   */
  // Se elimina la anotación de tipo 'action: any' y ': void'
  handleAction(action) {
      // Se eliminan las definiciones de tipos locales y la aserción de tipo
      // type CellClickPayload = { row: number; col: number };
      // type WordSearchGameAction = ...;
      // const typedAction = action as WordSearchGameAction;

      // Usar 'action' directamente
      const typedAction = action; // Solo por claridad, es el mismo objeto

      // No procesar acciones si el juego ya está completado
      if (this.gameState.completed) {
          console.log("El juego ya ha sido completado.");
          return;
      }

      switch(typedAction.type) {
        case 'CELL_CLICK':
          // Se eliminan las anotaciones de tipo de los parámetros de handleCellClick
          this.handleCellClick(typedAction.payload.row, typedAction.payload.col);
          break;
        case 'CLEAR_SELECTION':
          this.clearSelection(); // Se elimina la anotación de tipo de clearSelection
          break;
        default:
          console.warn("Acción desconocida:", typedAction);
      }
  }

  // --- Métodos Específicos de WordSearchGame ---

  /**
   * Genera la estructura de datos del juego (grid, palabras colocadas).
   * ¡ESTA IMPLEMENTACIÓN ES UN ESQUELETO! Necesitas añadir la lógica real.
   */
  // Se elimina la anotación de tipo del parámetro 'config: WordSearchConfig' y del retorno ': WordSearchGameData'
  generateWordSearchGrid(config) {
    // Acceso directo a las propiedades sin type assertion
    const { words, gridSize, allowDiagonal, allowBackwards } = config.wordSearch;
    const grid = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => "")
    );
    const placedWords = []; // Corresponde a WordSearchGameData['placedWords']

    // ---------------------------------------------------------------------
    // !! INICIO: LÓGICA DE GENERACIÓN DE GRID (NECESITA IMPLEMENTACIÓN) !!
    // ---------------------------------------------------------------------
    // (La lógica comentada dentro se mantiene como comentario para referencia)
    // ---------------------------------------------------------------------
    // !! FIN: LÓGICA DE GENERACIÓN DE GRID !!
    // ---------------------------------------------------------------------

    // Ejemplo básico (solo para que compile, NO FUNCIONAL):
     for (let r = 0; r < gridSize; r++) {
       for (let c = 0; c < gridSize; c++) {
         if (grid[r][c] === "") {
           grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // Letra aleatoria A-Z
         }
       }
     }

    console.log("Grid generado (esqueleto):", grid);
    console.log("Palabras a colocar:", words);

    return {
      grid,
      placedWords,
      words
    };
  }

  /**
   * Maneja el click en una celda del grid.
   * ¡NECESITA IMPLEMENTACIÓN!
   */
  // Se elimina la anotación de tipo de los parámetros 'row: number, col: number' y del retorno ': void'
  handleCellClick(row, col) {
    console.log(`Celda clickeada: [${row}, ${col}]`);
    const cellId = `${row}-${col}`;

    // Evitar seleccionar celdas ya deshabilitadas
    if (this.gameState.disabledCells.includes(cellId)) {
        return;
    }

    const currentSelection = this.gameState.selectedCells;
    const alreadySelected = currentSelection.some(([r, c]) => r === row && c === col);

    let newSelection; // Se elimina la anotación de tipo '[number, number][]'
    let newSelectedLetters = '';

    if (alreadySelected) {
        newSelection = [];
        newSelectedLetters = '';
    } else {
        newSelection = [...currentSelection, [row, col]];
    }

    // Actualizar las letras seleccionadas (¡necesita lógica de orden!)
    newSelectedLetters = newSelection.map(([r, c]) => this.gameData.grid[r][c]).join('');

    // Se elimina la anotación de tipo 'updates: Partial<GameState>' de updateGameState llamada aquí
    this.updateGameState({
        selectedCells: newSelection,
        selectedLetters: newSelectedLetters,
    });

    // Se eliminan las anotaciones de tipo de checkWordSelection
    this.checkWordSelection(newSelectedLetters, newSelection);
  }

    /**
    * Comprueba si la selección actual coincide con una palabra de la lista.
    * ¡NECESITA IMPLEMENTACIÓN!
    */
    // Se eliminan las anotaciones de tipo de los parámetros y del retorno ': void'
    checkWordSelection(selectedString, selectionCoords) { // selectedString: string, selectionCoords: [number, number][]
    const potentialWord = selectedString;
    const potentialWordReversed = selectedString.split('').reverse().join('');

    // Se elimina la anotación de tipo de placedWords[0] en find y en matchCoordinates
    const wordData = this.gameData.placedWords.find(placed =>
        (placed.word === potentialWord || placed.word === potentialWordReversed) &&
        !this.gameState.foundWords.includes(placed.word) &&
        this.matchCoordinates(selectionCoords, placed)
    );

    if (wordData) {
        console.log(`Palabra encontrada: ${wordData.word}`);
        const newFoundWords = [...this.gameState.foundWords, wordData.word];
        const newDisabledCells = [
            ...this.gameState.disabledCells,
            // Se elimina la anotación de tipo de placedWord[0] en getCoordinatesForPlacedWord
            ...this.getCoordinatesForPlacedWord(wordData).map(([r, c]) => `${r}-${c}`)
        ];

        // Se elimina la anotación de tipo 'updates: Partial<GameState>'
        this.updateGameState({
            foundWords: newFoundWords,
            disabledCells: newDisabledCells,
            selectedCells: [],
            selectedLetters: '',
        });

        // Calcula nuevo score y comprueba si el juego terminó
        const newScore = this.calculateScore(); // calculateScore ya no tiene anotación de retorno
        // Se elimina la anotación de tipo 'updates: Partial<GameState>'
        this.updateGameState({ score: newScore });

        if (newFoundWords.length === this.gameData.words.length) {
            console.log("¡Todas las palabras encontradas!");
            this.completeGame(); // Llama al método de GameBase (sin anotación de tipo)
        } else {
            // Guardar progreso después de encontrar una palabra (opcional)
             this.saveProgress(); // saveProgress ya no tiene anotación de retorno
        }
    }
  }

  /**
   * Helper para verificar si las coordenadas seleccionadas coinciden con una palabra colocada.
   * ¡NECESITA IMPLEMENTACIÓN! (Más robusta)
   */
  // Se eliminan las anotaciones de tipo de los parámetros y del retorno ': boolean'
  matchCoordinates(selectedCoords, placedWord) { // selectedCoords: [number, number][], placedWord: WordSearchGameData['placedWords'][0]
      // Se elimina la anotación de tipo de placedWord[0] en getCoordinatesForPlacedWord
      const placedCoords = this.getCoordinatesForPlacedWord(placedWord);

      if (selectedCoords.length !== placedCoords.length) {
          return false;
      }

      // Comprobar si ambos conjuntos de coordenadas son iguales (ignorando el orden)
      // La lógica de Sets con strings "row-col" se mantiene, es válido JS
      const selectedSet = new Set(selectedCoords.map(([r, c]) => `${r}-${c}`));
      const placedSet = new Set(placedCoords.map(([r, c]) => `${r}-${c}`));

      if (selectedSet.size !== placedSet.size) return false;
      for (const coord of selectedSet) {
          if (!placedSet.has(coord)) return false;
      }

      // Opcional: Verificar también el orden/dirección si es necesario por las reglas.
      return true; // Devuelve boolean como en TS
  }

  /**
   * Helper para obtener todas las coordenadas [r, c] de una palabra colocada.
   * ¡NECESITA IMPLEMENTACIÓN!
   */
  // Se eliminan las anotaciones de tipo del parámetro 'placedWord: WordSearchGameData['placedWords'][0]' y del retorno ':[number, number][]'
  getCoordinatesForPlacedWord(placedWord) {
      const coords = []; // Corresponde a [number, number][]
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
          // Medida de seguridad se mantiene
          if (coords.length > this.gameData.grid.length * 2) {
              console.error("Error determinando coordenadas para", placedWord);
              return [];
          }
      }
      return coords; // Devuelve array de arrays como en TS
  }


  /**
   * Limpia la selección actual de celdas.
   */
  // Se elimina la anotación de tipo ': void'
  clearSelection() {
    // Se elimina la anotación de tipo 'updates: Partial<GameState>'
    this.updateGameState({
        selectedCells: [],
        selectedLetters: '',
    });
    console.log("Selección limpiada.");
  }

  /**
   * Calcula la puntuación basada en las palabras encontradas.
   * Sobrescribe el método base.
   */
  // Se elimina la anotación de tipo ': number'
  calculateScore() {
    const wordsFound = this.gameState.foundWords.length;
    const totalWords = this.gameData.words.length;
    if (totalWords === 0) {
      return 0;
    }
    // La lógica de cálculo se mantiene
    const score = Math.floor((wordsFound / totalWords) * this.activity.points);
    return score; // Devuelve number como en TS (aunque no esté anotado)
  }

  // Hereda y puede usar:
  // this.activity (datos de la actividad)
  // this.getGameState() (obtiene el estado actual)
  // this.updateGameState(updates) (actualiza parcialmente el estado)
  // this.completeGame() (marca el juego como completado y guarda)
  // this.saveProgress() (guarda el progreso)
}