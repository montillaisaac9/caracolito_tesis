// /app/utils/wordSearchGenerator.ts
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
  
  /**
   * Genera una sopa de letras basada en la configuración proporcionada
   */
  export function generateWordSearchGrid(config: WordSearchConfig): WordSearchGameData {
    const { wordSearch } = config;
    const { words, gridSize, allowDiagonal, allowBackwards } = wordSearch;
    
    // Inicializar grid vacío
    const grid = Array.from({ length: gridSize }, () => 
      Array.from({ length: gridSize }, () => "")
    );
    
    // Rellenar grid con letras aleatorias
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
    
    // Colocar palabras en el grid
    const placedWords: {
      word: string;
      startRow: number;
      startCol: number;
      endRow: number;
      endCol: number;
      backwards: boolean;
    }[] = [];
    
    const directions = [
      [0, 1],   // derecha
      [1, 0],   // abajo
      [1, 1],   // diagonal abajo-derecha
      [-1, 1],  // diagonal arriba-derecha
    ];
    
    // Filtrar direcciones basadas en opciones
    const validDirections = directions.filter((dir, index) => {
      if (index >= 2 && !allowDiagonal) return false;
      return true;
    });
    
    // Función para comprobar si una palabra puede ser colocada en una posición y dirección
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
    
    // Colocar la palabra en el grid
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
    
    // Intentar colocar cada palabra
    for (const word of words) {
      let placed = false;
      const attempts = 100; // Limitar intentos para evitar bucles infinitos
      
      for (let attempt = 0; attempt < attempts && !placed; attempt++) {
        // Obtener posición y dirección aleatorias
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
        console.warn(`No se pudo colocar la palabra: ${word}`);
      }
    }
    
    fillRandomLetters();
    
    return {
      grid,
      placedWords,
      words
    };
  }