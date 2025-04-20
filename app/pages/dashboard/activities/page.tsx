'use client'
import { ActivityType, DifficultyLevel } from "@prisma/client";
import api from "@/app/utils/api";
import useUserStore from "@/app/stores/useUserStore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Spinner from "@/app/components/ui/common/progresBar";
import { generateWordSearchGrid } from "@/app/utils/wordSearchGenerator";
import useWordSearchStore from "@/app/stores/useWordSearchStore";
import WordSearch from "./[id]/components/WordSearch";

interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  difficulty: DifficultyLevel;
  config: any;
  points: number;
  timeLimit: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  topicId: string;
  createdById: string;
}

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

interface MatchingConfig {
  matching: {
    pairs: {
      left: string;
      right: string;
    }[];
    shuffle: boolean;
  };
  instructions: string;
}

interface MatchingGameData {
  leftItems: {
    id: string;
    content: string;
    originalIndex: number;
  }[];
  rightItems: {
    id: string;
    content: string;
    originalIndex: number;
  }[];
  pairs: {
    left: string;
    right: string;
  }[];
}

export interface ProgressCreate {
  studentId: string;
  activityId: string;
  score?: number;          // Default: 0 si no se envía
  completed?: boolean;     // Default: false si no se envía
  timeSpent?: number;      // Optional
  attempts?: number;       // Default: 0 si no se envía
  lastAttempt?: Date;      // Optional
  feedback?: string;       // Optional, max 500 chars
}

export default function Activities() {
  const params = useParams();
  const router = useRouter();
  const activityId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const { user } = useUserStore();
  
  const [gameData, setGameData] = useState<any>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [progressId, setProgressId] = useState(null);
  
  // Estado del juego de WordSearch desde Zustand
  const { gameCompleted: wsGameCompleted } = useWordSearchStore();
  
  // Para compatibilidad con otros tipos de juegos que no usan Zustand todavía
  const gameCompletedRef = useRef(false);
  const gameStateRef = useRef({
    matches: {} as Record<string, any>,
  });
  
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get(`/activities?id=${activityId}`);
        if (response.status === 200 && response.data.data) {
          setActivity(response.data.data);
          
          if (response.data.data.timeLimit) {
            setTimeRemaining(response.data.data.timeLimit);
          }
        } else {
          console.log(response);
          setError("No se encontró la actividad solicitada");
        }
      } catch (error) {
        console.error("Error obteniendo la actividad:", error);
        setError("Error al cargar los datos de la actividad");
      } finally {
        setLoading(false);
      }
    };
    
    if (activityId) {
      fetchActivity();
    }
  }, [activityId]);
  
  useEffect(() => {
    // Set up timer if game has started and there's a time limit
    let timer: NodeJS.Timeout | null = null;
    
    if (gameStarted && timeRemaining !== null && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer as NodeJS.Timeout);
            setGameCompleted(true);
            gameCompletedRef.current = true;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [gameStarted, timeRemaining]);
  
  // Function to generate matching game
  const generateMatchingGame = (config: MatchingConfig): MatchingGameData => {
    const { matching } = config;
    let { pairs, shuffle } = matching;
    
    if (shuffle) {
      // Create a shuffled copy of the pairs
      const shuffledPairs = [...pairs];
      for (let i = shuffledPairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPairs[i], shuffledPairs[j]] = [shuffledPairs[j], shuffledPairs[i]];
      }
      pairs = shuffledPairs;
    }
    
    // Create left and right sides (shuffled independently)
    const leftItems = pairs.map((pair, index) => ({
      id: `left-${index}`,
      content: pair.left,
      originalIndex: index
    }));
    
    const rightItems = pairs.map((pair, index) => ({
      id: `right-${index}`,
      content: pair.right,
      originalIndex: index
    }));
    
    // Shuffle right items
    for (let i = rightItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rightItems[i], rightItems[j]] = [rightItems[j], rightItems[i]];
    }
    
    return {
      leftItems,
      rightItems,
      pairs
    };
  };
  
  // Function to save progress
  const saveProgress = async () => {
    if (!activity || !user?.id) return;
    try {
      // Para juegos de tipo word search, obtenemos el estado desde Zustand
      let gameState = {};
      let gameComplete = gameCompleted;
      
      if (activity.type === 'WORD_SEARCH') {
        const wordSearchStore = useWordSearchStore.getState();
        gameState = {
          foundWords: wordSearchStore.foundWords,
          disabledCells: wordSearchStore.disabledCells,
          selectionHistory: wordSearchStore.selectionHistory
        };
        gameComplete = wordSearchStore.gameCompleted || gameCompleted;
      } else {
        // Para otros tipos de juegos seguimos usando la referencia
        gameState = gameStateRef.current;
        gameComplete = gameCompletedRef.current || gameCompleted;
      }
      
      const progressData: ProgressCreate = {
        studentId: user.id,
        activityId: activity.id,
        score: score,
        completed: gameComplete,
        timeSpent: activity.timeLimit ? (activity.timeLimit - (timeRemaining || 0)) : undefined,
        attempts: 1,
        lastAttempt: new Date(),
        feedback: JSON.stringify({
          gameState: gameState,
          gameData: gameData
        })
      };
      
      if (progressId) {
        console.log("Guardando progreso:", progressData);
        // await api.post(`/progress`, progressData);
      } else {
        console.log("Guardando nuevo progreso:", progressData);
        // const response = await api.post(`/progress`, progressData);
        // setProgressId(response.data.id);
      }
    } catch (error) {
      console.log(error);
      alert("Error al guardar el progreso. Por favor, inténtelo de nuevo.");
      console.error("Error saving progress:", error);
    }
  };
  
  // Save progress when game is completed or time runs out
  useEffect(() => {
    if (gameCompleted || (timeRemaining === 0 && gameStarted)) {
      saveProgress();
    }
  }, [gameCompleted, timeRemaining, gameStarted]);
  
  // También guardar progreso cuando cambia el estado de completado en el WordSearch store
  useEffect(() => {
    if (wsGameCompleted && activity?.type === 'WORD_SEARCH') {
      setGameCompleted(true);
      saveProgress();
    }
  }, [wsGameCompleted, activity?.type]);
  
  const startGame = () => {
    if (!activity) return;
    
    let generatedGameData;
    
    switch (activity.type) {
      case 'WORD_SEARCH':
        const wordSearchConfig = activity.config as unknown as WordSearchConfig;
        generatedGameData = generateWordSearchGrid(wordSearchConfig);
        break;
      case 'MATCHING':
        const matchingConfig = activity.config as unknown as MatchingConfig;
        generatedGameData = generateMatchingGame(matchingConfig);
        break;
      default:
        setError(`Tipo de actividad no soportado: ${activity.type}`);
        return;
    }
    
    setGameData(generatedGameData);
    setGameStarted(true);
    setGameCompleted(false);
    gameCompletedRef.current = false;
    setScore(0);
    setProgressId(null);
  };
  
  const completeGame = () => {
    // Avoid completing the game multiple times
    if (gameCompletedRef.current) return;
    
    // Calculate score based on activity and game state
    let finalScore = 0;
    
    if (activity && gameData) {
      switch (activity.type) {
        case 'WORD_SEARCH':
          // For simplicity, award full points if game is completed
          finalScore = activity.points;
          break;
        case 'MATCHING':
          // Award points based on correct matches
          finalScore = activity.points;
          break;
      }
    }
    
    setScore(finalScore);
    setGameCompleted(true);
    gameCompletedRef.current = true;
    
    // Save final progress
    saveProgress();
  };
  
  const MatchingGame = () => {
    const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
    const [selectedRight, setSelectedRight] = useState(null);
    const [matches, setMatches] = useState<Record<string, any>>({});
    
    // Update game state ref
    useEffect(() => {
      gameStateRef.current = {
        ...gameStateRef.current,
        matches
      };
    }, [matches]);
    
    if (!gameData || activity?.type !== 'MATCHING') return null;
    
    const matchingData = gameData as MatchingGameData;
    const { leftItems, rightItems, pairs } = matchingData;
    
    const handleLeftSelection = (index: number) => {
      if (gameCompletedRef.current || index.toString() in gameStateRef.current.matches) return;
      
      setSelectedLeft(index);
      
      // Check for match if right item is already selected
      if (selectedRight !== null) {
        checkForMatch(index, selectedRight);
      }
    };
    
    const handleRightSelection = (index: number) => {
      if (gameCompletedRef.current || Object.values(gameStateRef.current.matches).includes(index)) return;
      
      setSelectedRight(index);
      
      // Check for match if left item is already selected
      if (selectedLeft !== null) {
        checkForMatch(selectedLeft, index);
      }
    };
    
    const checkForMatch = (leftIndex: number, rightIndex: number) => {
      const leftItem = leftItems[leftIndex];
      const rightItem = rightItems[rightIndex];
      
      // Check if the indices match in the original pairs
      if (leftItem.originalIndex === rightItem.originalIndex) {
        // Correct match!
        const newMatches = { ...gameStateRef.current.matches, [leftIndex]: rightIndex };
        setMatches(newMatches);
        gameStateRef.current.matches = newMatches;
        
        // Save progress after correct match
        saveProgress();
        
        // Check if all pairs are matched
        if (Object.keys(newMatches).length === pairs.length && !gameCompletedRef.current) {
          // Use setTimeout to ensure state updates before completing
          setTimeout(() => {
            completeGame();
          }, 300);
        }
      } else {
        // Reset selections if match is incorrect
        setSelectedLeft(null);
        setSelectedRight(null);
      }
    };
    
    return (
      <div className="matching-game">
        <h2>Juego de Emparejamiento</h2>
        <p>{activity?.config?.instructions}</p>
        
        <div className="matching-columns">
          <div className="left-column">
            <h3>Columna A</h3>
            {leftItems.map((item, index) => {
              const isMatched = index.toString() in gameStateRef.current.matches;
              const isSelected = selectedLeft === index;
              
              return (
                <button 
                  key={item.id} 
                  className={`item-button ${isMatched ? 'matched' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleLeftSelection(index)}
                  disabled={isMatched || gameCompletedRef.current}
                >
                  {item.content}
                </button>
              );
            })}
          </div>
          
          <div className="right-column">
            <h3>Columna B</h3>
            {rightItems.map((item, index) => {
              const isMatched = Object.values(gameStateRef.current.matches).includes(index);
              const isSelected = selectedRight === index;
              
              return (
                <button 
                  key={item.id} 
                  className={`item-button ${isMatched ? 'matched' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleRightSelection(index)}
                  disabled={isMatched || gameCompletedRef.current}
                >
                  {item.content}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="matching-progress">
          <p>Emparejados: {Object.keys(gameStateRef.current.matches).length} de {pairs.length}</p>
        </div>
      </div>
    );
  };
  
  const renderActivityGame = () => {
    if (!activity || !gameData) return null;
    
    switch (activity.type) {
      case 'WORD_SEARCH':
        return <WordSearch 
          gameData={gameData as WordSearchGameData} 
          activityId={activity.id}
          onComplete={completeGame}
        />;
      case 'MATCHING':
        return <MatchingGame />;
      default:
        return (
          <div className="error-message">
            <p>Tipo de actividad no soportado: {activity.type}</p>
          </div>
        );
    }
  };
  
  const renderActivityDetails = () => {
    if (!activity) return null;
    
    return (
      <div className="activity-details">
        <h1>{activity.title}</h1>
        
        <div className="activity-info">
          <div className="activity-metadata">
            <p>Tipo: {activity.type}</p>
            <p>Dificultad: {activity.difficulty}</p>
            <p>Puntos: {activity.points}</p>
            {activity.timeLimit && (
              <p>Tiempo límite: {activity.timeLimit} segundos</p>
            )}
          </div>
          <div className="activity-dates">
            <p>Activo: {activity.isActive ? 'Sí' : 'No'}</p>
            <p>Creado: {new Date(activity.createdAt).toLocaleDateString()}</p>
            <p>Actualizado: {new Date(activity.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
        
        {user?.role === 'STUDENT' && activity.isActive && !gameStarted && (
          <button className="start-button" onClick={startGame}>
            Comenzar Actividad
          </button>
        )}
        
        {gameCompleted && (
          <div className="game-completed">
            <h2>¡Actividad Completada!</h2>
            <p>Puntuación: {score} puntos</p>
            <button className="return-button" onClick={() => router.push('/activities')}>
              Volver a Actividades
            </button>
          </div>
        )}
      </div>
    );
  };
  
  if (loading && !activity) {
    return (
      <div className="loading-container">
        <Spinner isLoading={false} />
      </div>
    );
  }
  
  if (error && !activity) {
    return (
      <div className="error-container">
        {error}
      </div>
    );
  }
  
  return (
    <div className="activity-container">
      {renderActivityDetails()}
      
      {user?.role === 'STUDENT' && gameStarted && !gameCompleted && (
        <div className="game-container">
          {timeRemaining !== null && (
            <div className="timer">
              <div className="time-display">
                Tiempo restante: {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
              </div>
              <div className="time-progress">
                <div className="progress-bar"></div>
              </div>
            </div>
          )}
          
          {renderActivityGame()}
        </div>
      )}
    </div>
  );
}