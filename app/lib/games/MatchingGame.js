import { GameBase } from "./abstract/GameBase";
import React from 'react';
import Confetti from 'react-confetti';

export class MatchingGame extends GameBase {
  constructor(activity) {
    super(activity);

    this.gameState = {
      ...this.gameState,
      selectedLeft: null,
      selectedRight: null,
      matches: {},
      attempts: 0,
      lastError: null,
      hint: null,
      started: false,
      showConfetti: false
    };
  }

  initializeGame() {
    const config = this.activity.config;
    this.gameData = this.generateMatchingGame(config);
  }

  handleAction(action) {
    switch(action.type) {
      case 'SELECT_LEFT':
        this.handleLeftSelection(action.payload.index);
        break;
      case 'SELECT_RIGHT':
        this.handleRightSelection(action.payload.index);
        break;
      case 'START_GAME':
        this.updateGameState({ started: true });
        break;
      case 'RESET_GAME':
        this.resetGame();
        break;
      case 'GIVE_HINT':
        this.giveHint();
        break;
      default:
        console.warn("Acción desconocida:", action);
    }
  }

  render() {
    if (!this.gameState.started) {
      return (
        <div className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-blue-600 mb-6">{this.activity.title}</h2>
            
            <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Instrucciones</h3>
              <p className="text-gray-600 mb-4">Encuentra todos los pares que coincidan</p>
              
              <ul className="text-left space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">👉</span>
                  <span>Haz clic en un elemento de la columna izquierda</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">👉</span>
                  <span>Haz clic en un elemento de la columna derecha</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">👉</span>
                  <span>Si forman un par correcto, permanecerán resaltados</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">👉</span>
                  <span>Encuentra todos los pares para completar el juego</span>
                </li>
              </ul>
            </div>
            
            <button 
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105"
              onClick={() => this.handleAction({ type: 'START_GAME' })}
            >
              Comenzar Juego
            </button>
          </div>
        </div>
      );
    }

    const { leftItems, rightItems, pairs } = this.gameData || {};
    const { matches, selectedLeft, selectedRight, score, completed, hint, showConfetti } = this.gameState;

    return (
      <div className="max-w-4xl mx-auto p-4">
        {showConfetti && <Confetti recycle={false} numberOfPieces={500} onConfettiComplete={() => this.updateGameState({ showConfetti: false })} />}
        
        <header className="mb-8 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-blue-600 text-center mb-4">{this.activity.title}</h2>
          
          <div className="flex justify-around mb-4">
            <div className="text-center">
              <span className="block text-sm text-gray-600">Puntuación</span>
              <span className="text-lg font-bold">{score}</span>
            </div>
            
            <div className="text-center">
              <span className="block text-sm text-gray-600">Intentos</span>
              <span className="text-lg font-bold">{this.gameState.attempts}</span>
            </div>
            
            <div className="text-center">
              <span className="block text-sm text-gray-600">Pares</span>
              <span className="text-lg font-bold">
                {Object.keys(matches).length} / {pairs?.length || 0}
              </span>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-500 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${(Object.keys(matches).length / (pairs?.length || 1)) * 100}%` }}
            />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Columna Izquierda */}
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <div className="space-y-3">
              {leftItems?.map((item, index) => {
                const isSelected = selectedLeft === index;
                const isMatched = matches[index] !== undefined;
                const isHinted = hint?.left === index;
                const isError = this.gameState.lastError && selectedLeft === index;

                return (
                  <div
                    key={item.id}
                    onClick={() => !isMatched && this.handleAction({ 
                      type: 'SELECT_LEFT', 
                      payload: { index } 
                    })}
                    className={`
                      p-3 rounded-md transition-all duration-200 cursor-pointer
                      ${isMatched ? 'bg-green-100 border border-green-300 cursor-default' : ''}
                      ${isSelected ? 'bg-blue-100 border-2 border-blue-400 scale-105' : ''}
                      ${isHinted ? 'border-3 border-sky-500 border-dashed animate-pulse' : ''}
                      ${isError ? 'bg-red-100 border-2 border-red-400' : ''}
                      ${!isMatched && !isSelected ? 'bg-white border border-gray-300 hover:shadow-md hover:scale-[1.02]' : ''}
                    `}
                  >
                    {item.content}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha */}
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <div className="space-y-3">
              {rightItems?.map((item, index) => {
                const isSelected = selectedRight === index;
                const isMatched = Object.values(matches).includes(index);
                const isHinted = hint?.right === index;
                const isError = this.gameState.lastError && selectedRight === index;

                return (
                  <div
                    key={item.id}
                    onClick={() => !isMatched && this.handleAction({ 
                      type: 'SELECT_RIGHT', 
                      payload: { index } 
                    })}
                    className={`
                      p-3 rounded-md transition-all duration-200 cursor-pointer
                      ${isMatched ? 'bg-green-100 border border-green-300 cursor-default' : ''}
                      ${isSelected ? 'bg-yellow-100 border-2 border-yellow-400 scale-105' : ''}
                      ${isHinted ? 'border-3 border-sky-500 border-dashed animate-pulse' : ''}
                      ${isError ? 'bg-red-100 border-2 border-red-400' : ''}
                      ${!isMatched && !isSelected ? 'bg-white border border-gray-300 hover:shadow-md hover:scale-[1.02]' : ''}
                    `}
                  >
                    {item.content}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <button 
            className={`px-4 py-2 rounded-md font-medium transition ${completed ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
            onClick={() => this.handleAction({ type: 'GIVE_HINT' })}
            disabled={completed}
          >
            Dame una pista
          </button>
          
          <button 
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 transition"
            onClick={() => this.handleAction({ type: 'RESET_GAME' })}
          >
            Reiniciar Juego
          </button>
        </div>

        {completed && (
          <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-2xl font-bold text-blue-600 mb-2">¡Juego Completado! 🎉</h3>
            <p className="text-lg mb-1">Puntuación final: <span className="font-bold">{score}</span> puntos</p>
            <p className="text-lg mb-4">Intentos totales: <span className="font-bold">{this.gameState.attempts}</span></p>
            <button 
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105"
              onClick={() => this.handleAction({ type: 'RESET_GAME' })}
            >
              Jugar de nuevo
            </button>
          </div>
        )}
      </div>
    );
  }

  generateMatchingGame(config) {
    const { matching } = config;
    let { pairs, shuffle } = matching;

    if (shuffle) {
      pairs = [...pairs].sort(() => Math.random() - 0.5);
    }

    const leftItems = pairs.map((pair, index) => ({
      id: `left-${index}`,
      content: pair.left,
      originalIndex: index
    }));

    const rightItems = pairs.map((pair, index) => ({
      id: `right-${index}`,
      content: pair.right,
      originalIndex: index
    })).sort(() => Math.random() - 0.5);

    return { leftItems, rightItems, pairs };
  }

  handleLeftSelection(index) {
    if (this.gameState.matches[index] !== undefined) return;
    
    this.updateGameState({ 
      selectedLeft: index,
      selectedRight: null,
      lastError: null
    });
    
    if (this.gameState.selectedRight !== null) {
      this.checkForMatch();
    }
  }

  handleRightSelection(index) {
    if (Object.values(this.gameState.matches).includes(index)) return;
    
    this.updateGameState({ 
      selectedRight: index,
      lastError: null 
    });
    
    if (this.gameState.selectedLeft !== null) {
      this.checkForMatch();
    }
  }

  checkForMatch() {
    const { selectedLeft, selectedRight } = this.gameState;
    const { leftItems, rightItems } = this.gameData;

    if (selectedLeft === null || selectedRight === null) return;

    this.updateGameState({ attempts: this.gameState.attempts + 1 });

    const leftItem = leftItems[selectedLeft];
    const rightItem = rightItems[selectedRight];
    const isMatch = leftItem.originalIndex === rightItem.originalIndex;

    if (isMatch) {
      const newMatches = { 
        ...this.gameState.matches, 
        [selectedLeft]: selectedRight 
      };

      this.updateGameState({
        matches: newMatches,
        selectedLeft: null,
        selectedRight: null,
        hint: null
      });

      const newScore = this.calculateScore();
      this.updateGameState({ score: newScore });

      if (Object.keys(newMatches).length === this.gameData.pairs.length) {
        this.updateGameState({ showConfetti: true });
        this.completeGame();
      } else {
        this.saveProgress();
      }
    } else {
      this.updateGameState({ lastError: Date.now() });
      setTimeout(() => {
        this.updateGameState({
          selectedLeft: null,
          selectedRight: null
        });
      }, 1000);
    }
  }

  calculateScore() {
    const matches = Object.keys(this.gameState.matches).length;
    const totalPairs = this.gameData.pairs.length;
    if (totalPairs === 0) return 0;
    return Math.floor((matches / totalPairs) * this.activity.points);
  }

  resetGame() {
    this.initializeGame();
    this.updateGameState({
      selectedLeft: null,
      selectedRight: null,
      matches: {},
      attempts: 0,
      score: 0,
      completed: false,
      lastError: null,
      hint: null,
      showConfetti: false
    });
  }

  giveHint() {
    const { leftItems, pairs } = this.gameData;
    const { matches } = this.gameState;

    const unmatchedIndex = leftItems.findIndex((_, idx) => !matches[idx]);
    if (unmatchedIndex === -1) return;

    const rightIndex = this.gameData.rightItems.findIndex(
      item => item.originalIndex === leftItems[unmatchedIndex].originalIndex
    );

    this.updateGameState({ 
      hint: { left: unmatchedIndex, right: rightIndex },
      selectedLeft: null,
      selectedRight: null
    });

    setTimeout(() => this.updateGameState({ hint: null }), 3000);
  }
}