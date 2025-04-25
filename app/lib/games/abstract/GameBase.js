// Se eliminan las importaciones de tipos de TypeScript
// import { Activity, GameState } from "../types";

// Se elimina 'abstract' de la declaración de clase
export class GameBase {
  // Se eliminan las anotaciones de tipo y modificadores de acceso
  // protected activity: Activity;
  activity;

  // protected gameState: GameState;
  gameState;

  // protected gameData: any;
  gameData;

  // protected gameCompleted: boolean = false;
  gameCompleted = false; // Inicialización se mantiene

  // Se elimina la anotación de tipo del parámetro
  // constructor(activity: Activity) {
  constructor(activity) {
    this.activity = activity;
    this.gameState = {
      score: 0,
      completed: false
    };
    this.gameData = null;
  }

  // Los métodos abstractos se convierten en métodos normales que idealmente lanzarían un error
  // si no son sobrescritos por la clase hija.
  // abstract initializeGame(): void;
  initializeGame() {
    throw new Error("Method 'initializeGame()' must be implemented by subclasses.");
  }

  // abstract render(): React.ReactNode;
  render() {
    throw new Error("Method 'render()' must be implemented by subclasses.");
    // Si usas React, este método debe retornar algo que React pueda renderizar (JSX, etc.)
  }

  // abstract handleAction(action: any): void;
  // Se elimina la anotación de tipo del parámetro y del retorno
  handleAction(action) {
    throw new Error("Method 'handleAction()' must be implemented by subclasses.");
  }

  // Métodos comunes a todos los juegos
  // Se eliminan las anotaciones de tipo y modificadores de acceso
  // public getGameData() { // : any se elimina del retorno
  getGameData() {
    return this.gameData;
  }

  // public getGameState() { // : GameState se elimina del retorno
  getGameState() {
    return this.gameState;
  }

  // public isCompleted() { // : boolean se elimina del retorno
  isCompleted() {
    return this.gameCompleted;
  }

  // public calculateScore(): number { // : number se elimina del retorno
  calculateScore() {
    // Implementación base, puede ser sobrescrita
    return this.gameState.score;
  }

  // public async saveProgress(): Promise<void> { // : Promise<void> se elimina del retorno
  async saveProgress() {
    console.log("Guardando progreso del juego:", this.gameState);
    // Como retorna una Promesa, la palabra clave 'async' se mantiene si la implementación usa await
    // o si explícitamente quieres que retorne una Promesa.
    // En este caso, solo console.log, podrías no necesitar async a menos que añadas await después.
    // Lo dejo con async por si la intención es que siempre retorne una Promesa.
  }

  // protected completeGame() { // : void se elimina del retorno, protected se elimina
  completeGame() {
    this.gameCompleted = true;
    this.gameState.completed = true;
    // Aunque calculateScore ya no tiene anotación de retorno, JS no necesita saberlo
    this.gameState.score = this.calculateScore();
    // saveProgress ahora es solo una función que devuelve una promesa o se ejecuta asíncronamente
    this.saveProgress();
  }

  updateGameState(updates) {
    // La sintaxis de spread (...) es JavaScript válido para fusionar objetos
    this.gameState = { ...this.gameState, ...updates };
  }
}