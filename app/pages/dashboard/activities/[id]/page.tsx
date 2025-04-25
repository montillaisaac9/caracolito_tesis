'use client'

import { ActivityType, DifficultyLevel } from "@prisma/client";
import api from "@/app/utils/api";
import useUserStore from "@/app/stores/useUserStore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Spinner from "@/app/components/ui/common/progresBar";
import { WordSearchGame } from "@/app/lib/games/WordSearchGame"; 
import { GameBase } from "@/app/lib/games/abstract/GameBase";
import { GameFactory } from "@/app/lib/games/GameFactory"; 

// Interfaces (se mantienen igual)
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

export interface ProgressCreate {
  studentId: string;
  activityId: string;
  score?: number;
  completed?: boolean;
  timeSpent?: number;
  attempts?: number;
  lastAttempt?: Date;
  feedback?: string;
}

export default function Activities() {
  const params = useParams();
  const router = useRouter();
  const activityId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const { user } = useUserStore();
  
  const [currentGame, setCurrentGame] = useState<GameBase | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  const gameCompletedRef = useRef(false);

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
    let timer: NodeJS.Timeout | null = null;
    
    if (gameStarted && timeRemaining !== null && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer as NodeJS.Timeout);
            setGameCompleted(true);
            gameCompletedRef.current = true;
            if (currentGame) {
              currentGame.completeGame();
            }
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
  }, [gameStarted, timeRemaining, currentGame]);

  const startGame = () => {
    if (!activity) return;
    
    try {
      const game = GameFactory.createGame(activity);
      game.initializeGame();
      setCurrentGame(game);
      setGameStarted(true);
      setGameCompleted(false);
      gameCompletedRef.current = false;
    } catch (err) {
      console.error("Error al iniciar el juego:", err);
      setError(`Tipo de actividad no soportado: ${activity.type}`);
    }
  };

  const saveProgress = async () => {
    if (!activity || !user?.id || !currentGame) return;

    try {
      const gameState = currentGame.getGameState();
      const progressData: ProgressCreate = {
        studentId: user.id,
        activityId: activity.id,
        score: gameState.score,
        completed: gameState.completed,
        timeSpent: activity.timeLimit ? (activity.timeLimit - (timeRemaining || 0)) : undefined,
        attempts: 1,
        lastAttempt: new Date(),
        feedback: JSON.stringify({
          gameState: gameState,
          gameData: currentGame.getGameData()
        })
      };

      console.log("Guardando progreso:", progressData);
      // await api.post(`/progress`, progressData);
    } catch (error) {
      console.error("Error saving progress:", error);
      alert("Error al guardar el progreso. Por favor, inténtelo de nuevo.");
    }
  };

  const renderActivityGame = () => {
    if (!activity || !currentGame) return null;
    
    return (
      <div className="game-container">
        {currentGame.render()}
      </div>
    );
  };
  
  const renderActivityDetails = () => {
    if (!activity) return null;
    
    return (
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{activity.title}</h1>
        
        <div className="p-4 bg-gray-100 rounded-lg mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Tipo:</strong> {activity.type}</p>
              <p><strong>Dificultad:</strong> {activity.difficulty}</p>
              <p><strong>Puntos:</strong> {activity.points}</p>
              {activity.timeLimit && (
                <p><strong>Tiempo límite:</strong> {activity.timeLimit} segundos</p>
              )}
            </div>
            <div>
              <p><strong>Activo:</strong> {activity.isActive ? 'Sí' : 'No'}</p>
              <p><strong>Creado:</strong> {new Date(activity.createdAt).toLocaleDateString()}</p>
              <p><strong>Actualizado:</strong> {new Date(activity.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        
        {user?.role === 'STUDENT' && activity.isActive && !gameStarted && (
          <div className="mb-4">
            <button 
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              onClick={startGame}
            >
              Comenzar Actividad
            </button>
          </div>
        )}
        
        {gameCompleted && currentGame && (
          <div className="p-6 bg-green-100 text-green-800 rounded-lg mb-4">
            <h2 className="text-2xl font-bold mb-2">¡Actividad Completada!</h2>
            <p className="text-xl mb-4">
              <strong>Puntuación:</strong> {currentGame.getGameState().score} puntos
            </p>
            <button 
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={() => router.push('/activities')}
            >
              Volver a Actividades
            </button>
          </div>
        )}
      </div>
    );
  };
  
  if (loading && !activity) {
    return (
      <div className="flex justify-center p-8">
        <Spinner isLoading={false} />
      </div>
    );
  }
  
  if (error && !activity) {
    return (
      <div className="p-8 bg-red-100 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      {renderActivityDetails()}
      
      {user?.role === 'STUDENT' && gameStarted && !gameCompleted && (
        <div className="mb-8">
          {timeRemaining !== null && (
            <div className="mb-4">
              <div className="p-3 bg-blue-100 text-blue-800 rounded flex items-center justify-center text-lg font-semibold">
                Tiempo restante: {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
              </div>
              <div className="w-full mt-2">
                <div 
                  className="h-2 bg-blue-500 rounded-full" 
                  style={{ width: `${(timeRemaining / (activity?.timeLimit || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {renderActivityGame()}
        </div>
      )}
    </div>
  );
}