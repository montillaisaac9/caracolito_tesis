import React from "react";
import { GameBase } from "./abstract/GameBase";
import GridCell from "./components/GridCell";
// import sountrack from "/public/sountrack.mp3";

export class WordSearchGame extends GameBase {
  constructor(activity) {
    super(activity);
    this.gameState = {
      ...this.gameState,
      selectedCells: [],
      foundWords: [],
      hint: null,
      started: false,
      lastError: false,
      isDragging: false,
      isPlaying: false,
    };
    this.sountrackRef = React.createRef();
    this.jumpRef = React.createRef();
    this.validationRef = React.createRef();
    this.notValidation = React.createRef();
  }

  initializeGame() {
    const config = this.activity.config;
    if (
      !config?.wordSearch ||
      !Array.isArray(config.wordSearch.words) ||
      config.wordSearch.words.length === 0
    ) {
      throw new Error(
        "La configuración del juego de sopa de letras es inválida o está ausente."
      );
    }

    try {
      this.gameData = this.generateWordSearchGrid(config);
      this.updateGameState({
        score: 0,
        completed: false,
        selectedCells: [],
        foundWords: [],
        hint: null,
        lastError: false,
        isDragging: false,
      });
    } catch (error) {
      console.error(
        "Error al generar la cuadrícula de búsqueda de palabras:",
        error
      );
      this.gameData = { grid: [], placedWords: [], words: [] };
      this.updateGameState({
        score: 0,
        completed: false,
        selectedCells: [],
        foundWords: [],
        hint: null,
        lastError: false,
        isDragging: false,
      });
    }
  }

  generateWordSearchGrid(config) {
    const { words, gridSize } = config.wordSearch;

    if (!words || words.length === 0) {
      throw new Error("Debe proporcionar al menos una palabra.");
    }

    if (!gridSize || gridSize <= 0) {
      throw new Error("El tamaño de la cuadrícula es inválido.");
    }

    const grid = Array.from({ length: gridSize }, () =>
      Array(gridSize).fill("")
    );
    const placedWords = [];

    words.forEach((word) => {
      const wordUpper = word.toUpperCase();
      const directions = [
        { rowInc: 0, colInc: 1 }, // Horizontal derecha
        { rowInc: 1, colInc: 0 }, // Vertical abajo
        { rowInc: 1, colInc: 1 }, // Diagonal abajo-derecha
        { rowInc: -1, colInc: 1 }, // Diagonal arriba-derecha
      ];

      let placed = false;

      for (let attempts = 0; attempts < 100 && !placed; attempts++) {
        const direction =
          directions[Math.floor(Math.random() * directions.length)];
        const startRow = Math.floor(Math.random() * gridSize);
        const startCol = Math.floor(Math.random() * gridSize);

        if (
          this.canPlaceWord(
            grid,
            wordUpper,
            startRow,
            startCol,
            direction.rowInc,
            direction.colInc
          )
        ) {
          this.placeWord(
            grid,
            wordUpper,
            startRow,
            startCol,
            direction.rowInc,
            direction.colInc
          );
          placedWords.push({ word: wordUpper, startRow, startCol, direction });
          placed = true;
        }
      }

      if (!placed) {
        console.warn(`No se pudo colocar la palabra: ${wordUpper}`);
      }
    });

    // Rellenar espacios vacíos con letras aleatorias
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (grid[row][col] === "") {
          grid[row][col] = String.fromCharCode(
            65 + Math.floor(Math.random() * 26)
          );
        }
      }
    }

    return { grid, placedWords, words };
  }

  canPlaceWord(grid, word, row, col, rowInc, colInc) {
    for (let i = 0; i < word.length; i++) {
      const newRow = row + i * rowInc;
      const newCol = col + i * colInc;

      if (
        newRow < 0 ||
        newRow >= grid.length ||
        newCol < 0 ||
        newCol >= grid[0].length ||
        (grid[newRow][newCol] !== "" && grid[newRow][newCol] !== word[i])
      ) {
        return false;
      }
    }
    return true;
  }

  placeWord(grid, word, row, col, rowInc, colInc) {
    for (let i = 0; i < word.length; i++) {
      const newRow = row + i * rowInc;
      const newCol = col + i * colInc;
      grid[newRow][newCol] = word[i];
    }
  }

  handleMouseDown(row, col) {
    const cellId = `${row}-${col}`;

    // Verificar si ya está seleccionada para limpiar
    const isAlreadySelected = this.gameState.selectedCells.some(
      (cell) => cell.row === row && cell.col === col
    );

    this.updateGameState({
      selectedCells: isAlreadySelected ? [] : [{ row, col }],
      isDragging: !isAlreadySelected,
      lastError: false,
      hint: null,
    });

    if (this.jumpRef.current) {
      this.jumpRef.current.volume = 1;
      this.jumpRef.current.currentTime = 0;
      this.jumpRef.current.play().catch(() => {});
    }
  }

  handleMouseEnter(row, col) {
    if (!this.gameState.isDragging) return;

    const { selectedCells } = this.gameState;
    const lastCell = selectedCells[selectedCells.length - 1];

    if (
      !lastCell ||
      (Math.abs(row - lastCell.row) <= 1 &&
        Math.abs(col - lastCell.col) <= 1 &&
        !selectedCells.some((c) => c.row === row && c.col === col))
    ) {
      this.updateGameState({
        selectedCells: [...selectedCells, { row, col }],
      });

      if (this.jumpRef.current) {
        this.jumpRef.current.volume = 1;
        this.jumpRef.current.currentTime = 0;
        this.jumpRef.current.play().catch(() => {});
      }
    }
  }

  handleMouseUp() {
    this.updateGameState({ isDragging: false });
  }

  validateSelection() {
    const { selectedCells } = this.gameState;
    const { grid, placedWords } = this.gameData;

    if (selectedCells.length < 2) {
      this.updateGameState({ selectedCells: [], lastError: true });
      // Sonido de no validación
      if (this.notValidation.current) {
        this.notValidation.current.volume = 0.7;
        this.notValidation.current.currentTime = 0;
        this.notValidation.current.play().catch(() => {});
      }
      return;
    }

    const selectedLetters = selectedCells
      .map(({ row, col }) => grid[row][col])
      .join("");

    const foundWord = placedWords.find(
      (word) =>
        word.word === selectedLetters ||
        word.word === selectedLetters.split("").reverse().join("")
    );

    if (
      foundWord &&
      !this.gameState.foundWords.some((word) => word.word === foundWord.word)
    ) {
      const wordScore = Math.floor(
        (foundWord.word.length / this.gameData.words.join("").length) *
          this.activity.points
      );
      const newScore = this.gameState.score + wordScore;

      const newFoundWords = [
        ...this.gameState.foundWords,
        { word: foundWord.word, cells: selectedCells },
      ];

      this.updateGameState({
        foundWords: newFoundWords,
        selectedCells: [],
        score: newScore,
        lastError: false,
        hint: null, // Limpiar pista al encontrar palabra
      });

      if (this.validationRef.current) {
        this.validationRef.current.volume = 0.7;
        this.validationRef.current.currentTime = 0;
        this.validationRef.current.play().catch(() => {});
      }

      if (this.allWordsFound()) {
        this.completeGame();
      }
    } else {
      if (this.notValidation.current) {
        this.notValidation.current.volume = 0.7;
        this.notValidation.current.currentTime = 0;
        this.notValidation.current.play().catch(() => {});
      }
      setTimeout(() => {
        if (this.notValidation.current) {
          this.notValidation.current.pause();
          this.notValidation.current.currentTime = 0;
        }
      }, 2000);
      this.updateGameState({ lastError: true });
      setTimeout(() => {
        this.updateGameState({ selectedCells: [], lastError: false });
      }, 1000);
    }
  }

  giveHint() {
    const { placedWords } = this.gameData;
    const { foundWords } = this.gameState;

    // Encontrar una palabra no descubierta
    const hiddenWord = placedWords.find(
      (placed) => !foundWords.some((found) => found.word === placed.word)
    );

    if (!hiddenWord) {
      console.log("Todas las palabras han sido encontradas");
      return;
    }

    // Generar las celdas para la palabra oculta
    const cells = [];
    for (let i = 0; i < hiddenWord.word.length; i++) {
      const row = hiddenWord.startRow + i * hiddenWord.direction.rowInc;
      const col = hiddenWord.startCol + i * hiddenWord.direction.colInc;
      cells.push({ row, col });
    }

    this.updateGameState({
      hint: {
        word: hiddenWord.word,
        cells: cells,
      },
    });

    // Limpiar la pista después de 3 segundos
    setTimeout(() => {
      this.updateGameState({ hint: null });
    }, 3000);
  }

  handleAction(action) {
    switch (action.type) {
      case "START_GAME":
        this.updateGameState({ started: true });
        break;

      case "CELL_CLICK":
        const { row, col } = action.payload;
        this.handleMouseDown(row, col);

        break;

      case "CLEAR_SELECTION":
        this.clearSelection();
        break;

      case "VALIDATE_SELECTION":
        this.validateSelection();
        break;

      case "RESET_GAME":
        this.resetGame();
        break;

      case "GIVE_HINT":
        this.giveHint();
        break;

      default:
        console.warn(`Acción desconocida: ${action.type}`);
    }
  }

  allWordsFound() {
    return this.gameData.words.every((word) =>
      this.gameState.foundWords.some(
        (found) => found.word === word.toUpperCase()
      )
    );
  }

  resetGame() {
    this.initializeGame();
    this.updateGameState({
      selectedCells: [],
      foundWords: [],
      score: 0,
      completed: false,
      lastError: false,
      isDragging: false,
      hint: null,
    });
  }
  render() {
    const { grid, words } = this.gameData;
    const { foundWords, selectedCells, lastError, hint, started } =
      this.gameState;
    const gridSize = grid.length;

    if (!started) {
      return (
        <div className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-blue-600 mb-6">
              {this.activity.title}
            </h2>
            <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Instrucciones
              </h3>
              <p className="text-gray-600 mb-4">
                Encuentra todas las palabras en la sopa de letras arrastrando el
                mouse.
              </p>
              <ul className="text-left space-y-2 text-gray-700">
                <li>
                  👉 Haz clic en una celda y arrastra para seleccionar letras.
                </li>
                <li>👉 Suelta el mouse para finalizar la selección.</li>
                <li>
                  👉 Presiona "Validar" para comprobar si la palabra es
                  correcta.
                </li>
                <li>
                  👉 Usa "Pista" si necesitas ayuda para encontrar una palabra.
                </li>
              </ul>
            </div>
            <button
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105"
              onClick={() => this.handleAction({ type: "START_GAME" })}
            >
              Comenzar Juego
            </button>
          </div>
        </div>
      );
    }

    if (this.sountrackRef.current) {
      this.sountrackRef.current.volume = 0.6;
      this.sountrackRef.current
        .play()
        .then(() => this.updateGameState({ isPlaying: true }))
        .catch((error) => console.error("Error al reproducir audio:", error));
    }

    return (
      <div className="w-3/4 mx-auto p-4">
        <audio
          ref={this.sountrackRef}
          src="/sountrack.mp3"
          loop
          style={{ display: "none" }}
        />
        <audio ref={this.jumpRef} src="/jump.wav" style={{ display: "none" }} />
        <audio
          ref={this.validationRef}
          src="/validacion.wav"
          style={{ display: "none" }}
        />
        <audio
          ref={this.notValidation}
          src="/notValidation.mp3"
          style={{ display: "none" }}
        />

        <header className="mb-8 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-sky-600 text-center mb-4">
            {this.activity.title}
          </h2>
          <div className="flex justify-around mb-4">
            <div className="text-center">
              <span className="block text-sm text-gray-600">Puntuación</span>
              <span className="text-lg font-bold">{this.gameState.score}</span>
            </div>
            <div className="text-center">
              <span className="block text-sm text-gray-600">
                Palabras encontradas
              </span>
              <span className="text-lg font-bold">
                {foundWords.length} / {words?.length || 0}
              </span>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-6 justify-center items-center">
          <div className="w-fit bg-white p-4 rounded-lg shadow-sm border border-blue-100">
            <h3 className="text-xl font-semibold text-sky-800 mb-3 sticky top-0 bg-white py-2">
              Palabras a encontrar
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 overflow-y-auto max-h-[200px] lg:max-h-[calc(100%-60px)]">
              {words.map((word) => {
                const isFound = foundWords.some(
                  (found) => found.word === word.toUpperCase()
                );
                const isHinted = hint?.word === word.toUpperCase();
                return (
                  <div
                    key={word}
                    className={`p-2 rounded-md text-sm transition-all ${
                      isFound
                        ? "bg-green-100 text-green-800 line-through"
                        : isHinted
                        ? "bg-yellow-100 text-yellow-800 font-bold animate-pulse"
                        : "bg-blue-50 text-sky-800 hover:bg-blue-100"
                    }`}
                  >
                    <span className="font-medium">{word}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sopa de letras */}
          <div className="flex-1 min-w-2/4 w-fit bg-white p-4 rounded-lg shadow-sm border border-blue-100">
            <div className="flex justify-center items-center">
              <div
                className="word-search-grid inline-grid select-none w-full max-w-[600px]"
                style={{
                  gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                  aspectRatio: "1/1",
                  gap:
                    gridSize <= 10
                      ? "0.5rem"
                      : gridSize <= 15
                      ? "0.4rem"
                      : gridSize <= 20
                      ? "0.3rem"
                      : "0.4rem",
                  padding:
                    gridSize <= 10
                      ? "0.5rem"
                      : gridSize <= 15
                      ? "0.4rem"
                      : gridSize <= 20
                      ? "0.3rem"
                      : "0.4rem",
                }}
                onMouseLeave={() => this.handleMouseUp()}
                onMouseUp={() => this.handleMouseUp()}
              >
                {grid.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const cellId = `${rowIndex}-${colIndex}`;
                    const isSelected = selectedCells.some(
                      (selected) =>
                        selected.row === rowIndex && selected.col === colIndex
                    );
                    const isFound = foundWords.some((word) =>
                      word.cells.some(
                        (c) => c.row === rowIndex && c.col === colIndex
                      )
                    );
                    const isError = lastError && isSelected;
                    const isHinted = hint?.cells.some(
                      (c) => c.row === rowIndex && c.col === colIndex
                    );

                    const cellSize =
                      gridSize <= 10
                        ? "md"
                        : gridSize <= 15
                        ? "sm"
                        : gridSize <= 20
                        ? "xs"
                        : "xxs";

                    const sizeConfig = {
                      md: {
                        text: "text-xl",
                        padding: "p-2",
                        minSize: "min-w-[2rem] min-h-[2rem]",
                      },
                      sm: {
                        text: "text-lg",
                        padding: "p-1.5",
                        minSize: "min-w-[1.8rem] min-h-[1.8rem]",
                      },
                      xs: {
                        text: "text-md",
                        padding: "p-1",
                        minSize: "min-w-[1.6rem] min-h-[1.6rem]",
                      },
                      xxs: {
                        text: "text-sm",
                        padding: "p-1",
                        minSize: "min-w-[1.6rem] min-h-[1.6rem]",
                      },
                    };

                    return (
                      <GridCell
                        key={cellId}
                        letter={cell}
                        isSelected={isSelected}
                        isDisabled={isFound}
                        isHinted={isHinted}
                        onCellClick={() =>
                          this.handleMouseDown(rowIndex, colIndex)
                        }
                        onMouseDown={() =>
                          this.handleMouseDown(rowIndex, colIndex)
                        }
                        onMouseEnter={() =>
                          this.handleMouseEnter(rowIndex, colIndex)
                        }
                        onMouseUp={() => this.handleMouseUp()}
                        className={`
                          ${
                            isError
                              ? "bg-red-200 border-red-400 text-red-400"
                              : ""
                          } 
                          ${sizeConfig[cellSize].text}
                          ${sizeConfig[cellSize].padding}
                          ${sizeConfig[cellSize].minSize}
                          flex items-center justify-center
                          max-w-[2.5rem] max-h-[2.5rem]
                          transition-all duration-75
                          hover:bg-blue-50
                        `}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <button
            className={`px-4 py-2 rounded-md font-medium transition-all duration-200 transform ${
              this.allWordsFound()
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 shadow-md hover:shadow-yellow-200/50 active:scale-95 active:shadow-inner"
            }`}
            onClick={() => this.handleAction({ type: "GIVE_HINT" })}
            disabled={this.allWordsFound()}
          >
            Dame una pista
          </button>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-all duration-200 transform shadow-md hover:shadow-blue-700/50 active:scale-95 active:shadow-inner"
            onClick={() => this.handleAction({ type: "VALIDATE_SELECTION" })}
          >
            Validar
          </button>

          <button
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-400 transition-all duration-200 transform shadow-md hover:shadow-gray-400/50 active:scale-95 active:shadow-inner"
            onClick={() => this.handleAction({ type: "RESET_GAME" })}
          >
            Reiniciar
          </button>
        </div>
      </div>
    );
  }
}
