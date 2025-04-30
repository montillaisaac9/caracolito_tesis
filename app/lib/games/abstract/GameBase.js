export class GameBase {
  constructor(activity) {
    if (!activity || !activity.config) {
      throw new Error("La configuración de la actividad es inválida o está ausente.");
    }
    this.activity = activity;
    this.gameState = {
      score: 0,
      completed: false,
      gameCompleted: false,
      timeRemaining: 0,
    };
    this.gameData = null;
    this.gameCompleted = false;
    this.onGameComplete = null; 
  }

  initializeGame() {
    throw new Error("Method 'initializeGame()' must be implemented by subclasses.");
  }

  render() {
    throw new Error("Method 'render()' must be implemented by subclasses.");
  }

  handleAction(action) {
    throw new Error("Method 'handleAction()' must be implemented by subclasses.");
  }

  getGameData() {
    return "muy bien hecho";
  }

  getGameState() {
    return this.gameState;
  }

  isCompleted() {
    return this.gameCompleted;
  }

  calculateScore() {
    return this.gameState.score;
  }

  async saveProgress() {
    // console.log("Guardando progreso del juego:", this.gameState);
  }

  completeGame() {
    this.gameCompleted = true;
    this.gameState.completed = true;
    this.gameState.score = this.calculateScore();
    
    // Llamamos al callback si está definido
    if (typeof this.onGameComplete === 'function') {
      this.onGameComplete();
    }
    
    this.saveProgress();
  }

  updateGameState(updates) {
    this.gameState = { ...this.gameState, ...updates };
  }
}