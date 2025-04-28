'use client';

import { ActivityType, DifficultyLevel } from "@prisma/client";
import api from "@/app/utils/api";
import useUserStore from "@/app/stores/useUserStore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import Spinner from "@/app/components/ui/common/progresBar";
import { GameFactory } from "@/app/lib/games/GameFactory";
import { GameBase } from "@/app/lib/games/abstract/GameBase";
import { message } from "@/app/api/helpers/responsesMsg";
import Confetti from 'react-confetti';
import useWindowSize from 'react-use/lib/useWindowSize';

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

interface ProgressData {
  studentId: string;
  activityId: string;
  score?: number;
  completed?: boolean;
  timeSpent?: number;
  attempts?: number;
  lastAttempt?: Date;
  feedback?: string;
}

interface GameState {
  score: number;
  completed: boolean;
}

export default function Activities() {
  const params = useParams();
  const router = useRouter();
  const activityId = params?.id as string;
  const { width, height } = useWindowSize();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [finalyResponce, setFinalyResponce] = useState({ message: "", data: {} });
  const [confettiPieces, setConfettiPieces] = useState(0);
  const [confettiOpacity, setConfettiOpacity] = useState(1);

  const { user } = useUserStore();

  const [gameInstance, setGameInstance] = useState<GameBase | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const confettiRef = useRef<NodeJS.Timeout | null>(null);
  const latestTimeRemaining = useRef(timeRemaining);
  const latestGameInstance = useRef(gameInstance);
  const latestGameCompleted = useRef(gameCompleted);

  useEffect(() => {
    latestTimeRemaining.current = timeRemaining;
  }, [timeRemaining]);

  useEffect(() => {
    latestGameInstance.current = gameInstance;
  }, [gameInstance]);

  useEffect(() => {
    latestGameCompleted.current = gameCompleted;
  }, [gameCompleted]);

  const fetchActivity = useCallback(async () => {
    if (!activityId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await api.get<{ data: Activity }>(`/activities?id=${activityId}`);
      if (response.status === 200 && response.data.data) {
        setActivity(response.data.data);
        setTimeRemaining(response.data.data.timeLimit ?? null);
      } else {
        setError("No se encontró la actividad solicitada.");
        setActivity(null);
        setTimeRemaining(null);
      }
    } catch (err) {
      console.error("Error obteniendo la actividad:", err);
      setError("Error al cargar los datos de la actividad.");
      setActivity(null);
      setTimeRemaining(null);
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const saveProgress = useCallback(async (
    instance: GameBase,
    gameState: GameState,
    currentTimeRemaining: number | null
  ): Promise<void> => {
    if (!activity?.id || !user?.id || !instance) {
      console.warn("Datos faltantes para guardar progreso:", {
        activityId: activity?.id,
        userId: user?.id,
        instanceExists: !!instance
      });
      return;
    }

    try {
      const progressData: ProgressData = {
        studentId: user.id,
        activityId: activity.id,
        score: gameState.score,
        completed: gameState.completed,
        timeSpent: activity.timeLimit !== null && activity.timeLimit !== undefined && currentTimeRemaining !== null
          ? (activity.timeLimit - currentTimeRemaining)
          : undefined,
        attempts: 1,
        lastAttempt: new Date(),
        feedback: "muy bien hecho"
      };

      const response = await api.post(`/progress`, { data: progressData });
      setFinalyResponce(response.data);

    } catch (error) {
      console.error("Error saving progress:", error);
    }
  }, [activity, user?.id]);

  const startConfetti = useCallback(() => {
    setConfettiPieces(700);
    setConfettiOpacity(0.8);

    if (confettiRef.current) {
      clearInterval(confettiRef.current);
    }

    confettiRef.current = setInterval(() => {
      setConfettiOpacity(prev => {
        const newOpacity = prev - 0.05;
        if (newOpacity <= 0) {
          clearInterval(confettiRef.current as NodeJS.Timeout);
          setConfettiPieces(0);
          return 0;
        }
        return newOpacity;
      });
    }, 8000);
  }, []);

  const handleGameCompletion = useCallback(async () => {
    if (latestGameCompleted.current) return;

    console.log("Iniciando completado del juego (desde callback)");
    setGameCompleted(true);
    startConfetti();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const instance = latestGameInstance.current;
    const currentTimeRemaining = latestTimeRemaining.current;

    if (!instance) {
      console.warn("No game instance available to complete game.");
      return;
    }

    try {
      const gameState = instance.getGameState();
      await saveProgress(instance, gameState, currentTimeRemaining);
      instance.completeGame?.();
    } catch (error) {
      console.error("Error al completar el juego:", error);
    }
  }, [saveProgress, startConfetti]);

  const startGame = useCallback(async () => {
    if (!activity || gameStarted) return;


    try {
      const game = GameFactory.createGame(activity);

      game.onGameComplete = async () => {
        await handleGameCompletion();
      };

      game.initializeGame();
      setGameInstance(game);
      setGameStarted(true);
      setGameCompleted(false);
      setConfettiPieces(0);
      setConfettiOpacity(1);

      setTimeRemaining(activity.timeLimit ?? null);

    } catch (err) {
      console.error("Error al iniciar el juego:", err);
      setError(`Tipo de actividad no soportado: ${activity?.type || 'Desconocido'}`);
    }
  }, [activity, gameStarted, handleGameCompletion]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (confettiRef.current) clearInterval(confettiRef.current);
    };
  }, []);

  useEffect(() => {
    if (!gameStarted || latestTimeRemaining.current === null || latestGameCompleted.current) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = (prev === null || prev <= 1) ? 0 : prev - 1;
        latestTimeRemaining.current = newTime;

        if (newTime === 0) {
          handleGameCompletion();
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameStarted, gameCompleted, handleGameCompletion]);

  const renderActivityGame = useCallback(() => {
    if (!gameInstance) return null;
    return (
      <div className="game-container">
        {gameInstance.render()}
      </div>
    );
  }, [gameInstance]);

  const renderActivityDetails = useCallback(() => {
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
              {activity.timeLimit !== null && activity.timeLimit !== undefined && (
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
      </div>
    );
  }, [activity]);

  const renderScoreFeedback = useCallback((score: number) => {
    if (score >= 8) return "¡Muy bien, tienes talento!";
    if (score >= 5) return "Vas bien.";
    return "Necesitas practicar más.";
  }, []);

  if (loading && !activity) {
    return (
      <div className="flex justify-center p-8">
        <Spinner isLoading={true} />
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

  if (!loading && !error && !activity) {
    return (
      <div className="p-8 bg-yellow-100 text-yellow-800 rounded-lg">
        No se pudo cargar la actividad. Verifica la URL.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 relative">
      {confettiPieces > 0 && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <Confetti
            width={width}
            height={height}
            numberOfPieces={confettiPieces}
            recycle={false}
            gravity={0.2}
            wind={0.01}
            opacity={confettiOpacity}
            colors={['#FFC700', '#FF0000', '#2E3191', '#41BBC7']}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}
          />
        </div>
      )}

      {renderActivityDetails()}

      {user?.role === 'STUDENT' && activity?.isActive && !gameStarted && (
        <div className="mb-4">
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
            onClick={startGame}
          >
            Comenzar Actividad
          </button>
        </div>
      )}

      {user?.role === 'STUDENT' && gameStarted && (
        <div className="mb-8">
          {!gameCompleted && timeRemaining !== null && (
            <div className="mb-4">
              <div className="p-3 bg-blue-100 text-blue-800 rounded flex items-center justify-center text-lg font-semibold">
                Tiempo restante: {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
              </div>
              {activity?.timeLimit !== null && activity?.timeLimit !== undefined && (
                <div className="w-full mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 bg-blue-500 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(timeRemaining / activity.timeLimit) * 100}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}

          {gameCompleted ? (
            <div className="p-6 bg-green-100 text-green-800 rounded-lg mb-4">
              <h2 className="text-2xl font-bold mb-2">¡Actividad Completada!</h2>
              <p className="text-xl mb-4">
                <strong>Puntuación:</strong> {gameInstance?.getGameState().score || 0} puntos
                {gameInstance?.getGameState().score !== undefined && (
                  <span className="ml-2">{renderScoreFeedback(gameInstance.getGameState().score)}</span>
                )}
              </p>
              {finalyResponce?.message && (
                <div className="mb-4 p-4 rounded-lg">
                  <p className="font-semibold">{finalyResponce.message}</p>
                </div>
              )}
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                onClick={() => router.push('/activities')}
              >
                Volver a Actividades
              </button>
            </div>
          ) : (
            renderActivityGame()
          )}
        </div>
      )}

      {user?.role !== 'STUDENT' && (
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg">
          Esta sección es para estudiantes.
        </div>
      )}

      {user?.role === 'STUDENT' && activity && !activity.isActive && (
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg">
          Esta actividad no está activa actualmente.
        </div>
      )}
    </div>
  );
}