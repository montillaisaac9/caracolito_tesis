"use client";

import api from "@/app/utils/api";
import useUserStore from "@/app/stores/useUserStore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import Spinner from "@/app/components/ui/common/progresBar";
import { GameFactory } from "@/app/lib/games/GameFactory";
import { GameBase } from "@/app/lib/games/abstract/GameBase";
import Confetti from "react-confetti";
import useWindowSize from "react-use/lib/useWindowSize";
import { Activity } from "@prisma/client";
import { GameState, ProgressData, ScoreData } from "./components/interfaces";

export default function Activities() {
  const params = useParams();
  const router = useRouter();
  const activityId = params?.id as string;
  const { width, height } = useWindowSize();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [score, setScore] = useState<Array<ScoreData> | null>(null);
  const [finalyResponce, setFinalyResponce] = useState<{
    message?: string;
    data?: any;
  }>({});

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

      const response = await api.get<{ data: Activity }>(
        `/activities?id=${activityId}`
      );

      if (response.status === 200 && response.data.data) {
        setActivity(response.data.data);
        if (!gameStarted) {
          setTimeRemaining(response.data.data.timeLimit ?? null);
        }
      } else {
        setError(
          response.data?.message || "No se encontró la actividad solicitada."
        );
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
  }, [activityId, gameStarted]);

  const fetchScore = useCallback(async () => {
    if (!activityId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await api.post<{ data: Array<ScoreData> }>(
        `/progress/activity`,
        { idActivitie: activityId }
      );
      if (response.status === 200 && response.data.data) {
        setScore(response.data.data);
      } else {
        setError(
          response.data?.message || "No se encontró la actividad solicitada."
        );
        setScore(null);
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
  }, [activityId, gameStarted]);

  useEffect(() => {
    fetchActivity();
    if (user?.role != "STUDENT") {
      fetchScore();
    }
  }, [fetchActivity]);

  const saveProgress = useCallback(
    async (
      instance: GameBase,
      gameState: GameState,
      currentTimeRemaining: number | null
    ): Promise<void> => {
      if (!activity?.id || !user?.id || !instance) {
        console.warn(
          "Datos faltantes para guardar progreso. Abortando guardado.",
          {
            activityId: activity?.id,
            userId: user?.id,
            instanceExists: !!instance,
          }
        );
        return;
      }

      try {
        const timeSpent =
          activity.timeLimit !== null &&
          activity.timeLimit !== undefined &&
          currentTimeRemaining !== null
            ? Math.max(0, activity.timeLimit - currentTimeRemaining)
            : undefined;

        const progressData: ProgressData = {
          studentId: user.id,
          activityId: activity.id,
          score: gameState.score,
          completed: gameState.completed,
          timeSpent: timeSpent,
          attempts: 1,
          lastAttempt: new Date(),
          feedback:
            gameState.completed && gameState.score !== undefined
              ? renderScoreFeedback(gameState.score)
              : "Progreso guardado",
        };

        const response = await api.post(`/progress`, { data: progressData });
        setFinalyResponce(
          response.data || { message: "Progreso guardado con éxito" }
        );
      } catch (error) {
        console.error("Error saving progress:", error);
        setFinalyResponce({ message: "Error al guardar el progreso." });
      }
    },
    [activity, user?.id]
  );

  const startConfetti = useCallback(() => {
    setConfettiPieces(1200);
    setConfettiOpacity(1);

    if (confettiRef.current) {
      clearInterval(confettiRef.current);
      confettiRef.current = null;
    }

    const fadeInterval = setInterval(() => {
      setConfettiOpacity((prev) => {
        const newOpacity = prev - 0.03;

        if (newOpacity <= 0) {
          clearInterval(fadeInterval);
          confettiRef.current = null;
          setConfettiPieces(0);
          return 0;
        }
        return newOpacity;
      });
    }, 800);

    confettiRef.current = fadeInterval;

    const clearConfettiTimeout = setTimeout(() => {
      setConfettiPieces(0);
      setConfettiOpacity(1);
      if (confettiRef.current) {
        clearInterval(confettiRef.current);
        confettiRef.current = null;
      }
    }, 20000);

    return () => {
      clearTimeout(clearConfettiTimeout);
      if (confettiRef.current) {
        clearInterval(confettiRef.current);
        confettiRef.current = null;
      }
    };
  }, []);

  const handleGameCompletion = useCallback(async () => {
    if (latestGameCompleted.current) {
      return;
    }

    setGameCompleted(true);
    startConfetti();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const instance = latestGameInstance.current;
    const currentTimeRemaining = latestTimeRemaining.current;

    if (!instance) {
      console.warn(
        "No hay instancia del juego disponible para completar la lógica de guardado."
      );
      return;
    }

    try {
      const gameState = instance.getGameState();
      await saveProgress(instance, gameState, currentTimeRemaining);
    } catch (error) {
      console.error(
        "Error durante el proceso de completado/guardado del juego:",
        error
      );
    }
  }, [saveProgress, startConfetti]);

  const startGame = useCallback(async () => {
    if (!activity || gameStarted) {
      if (!activity) console.warn("startGame llamado sin datos de actividad.");
      if (gameStarted)
        console.warn("startGame llamado, pero el juego ya ha empezado.");
      return;
    }

    try {
      const game = GameFactory.createGame(activity);

      game.onGameComplete = async () => {
        await handleGameCompletion();
      };

      await game.initializeGame();

      setGameInstance(game);
      setGameStarted(true);
      setGameCompleted(false);
      setFinalyResponce({});
      setConfettiPieces(0);
      setConfettiOpacity(1);

      const initialTime = activity.timeLimit ?? null;
      setTimeRemaining(initialTime);
      latestTimeRemaining.current = initialTime;

      console.log(`Juego de tipo ${activity.type} iniciado correctamente.`);
    } catch (err) {
      console.error("Error al iniciar el juego:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error desconocido al iniciar el juego.";
      setError(`Error al iniciar el juego: ${errorMessage}`);
    }
  }, [activity, gameStarted, handleGameCompletion]);

  useEffect(() => {
    return () => {
      console.log(
        "Activities: Limpiando temporizadores y confetti al desmontar."
      );
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (confettiRef.current) {
        clearInterval(confettiRef.current);
        confettiRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const timerShouldRun =
      gameStarted &&
      latestTimeRemaining.current !== null &&
      latestGameCompleted.current === false;

    if (timerShouldRun && timerRef.current === null) {
      console.log("Iniciando temporizador de cuenta regresiva...");
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev === null || prev <= 1 ? 0 : prev - 1;
          latestTimeRemaining.current = newTime;

          if (newTime === 0 && !latestGameCompleted.current) {
            console.log(
              "Tiempo agotado. El temporizador dispara la finalización."
            );
          }
          return newTime;
        });
      }, 1000);
    } else if (!timerShouldRun && timerRef.current !== null) {
      console.log(
        "Condiciones del temporizador no cumplidas. Limpiando temporizador activo."
      );
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        console.log("Efecto de temporizador: Limpiando intervalo existente.");
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameStarted, latestGameCompleted.current, handleGameCompletion]);

  useEffect(() => {
    if (
      gameStarted &&
      timeRemaining !== null &&
      timeRemaining <= 0 &&
      !gameCompleted
    ) {
      console.log(
        "timeRemaining <= 0 detectado en useEffect. Llamando a handleGameCompletion."
      );
      handleGameCompletion();
    }
  }, [gameStarted, timeRemaining, gameCompleted, handleGameCompletion]);

  const renderActivityGame = useCallback(() => {
    if (!gameInstance) {
      return null;
    }
    return (
      <div className="game-container w-full flex justify-center">
        {gameInstance.render()}
      </div>
    );
  }, [gameInstance]);

  const renderActivityDetails = useCallback(() => {
    if (!activity) return null;

    return (
      <div className="mb-8 p-4 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">
          {activity.title}
        </h1>

        <div className="p-4 bg-gray-100 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <div>
              <p>
                <strong>Tipo:</strong> {activity.type}
              </p>
              <p>
                <strong>Dificultad:</strong> {activity.difficulty}
              </p>
              <p>
                <strong>Puntos máximos:</strong> {activity.points}
              </p>
              {activity.timeLimit !== null &&
                activity.timeLimit !== undefined && (
                  <p>
                    <strong>Tiempo límite:</strong> {activity.timeLimit}{" "}
                    segundos
                  </p>
                )}
            </div>

            <div>
              <p>
                <strong>Estado:</strong>{" "}
                {activity.isActive ? "Activa" : "Inactiva"}
              </p>
              <p>
                <strong>Creado:</strong>{" "}
                {new Date(activity.createdAt).toLocaleDateString()}
              </p>
              <p>
                <strong>Última actualización:</strong>{" "}
                {new Date(activity.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        {gameCompleted && finalyResponce?.message && (
          <div className="mt-4 p-4 bg-blue-100 text-green-800 rounded-lg font-semibold">
            {finalyResponce.message}
          </div>
        )}
      </div>
    );
  }, [activity, gameCompleted, finalyResponce]);

  const renderScoreFeedback = useCallback(
    (score: number) => {
      const totalPoints = activity?.points ?? 10;
      const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

      if (percentage >= 95) return "¡Felicidades, excelente!";
      if (percentage >= 80) return "¡Muy bien hecho!";
      if (percentage >= 50)
        return "Buen trabajo, sigue practicando para mejorar.";
      if (percentage > 0) return "Necesitas practicar más para dominarlo.";
      return "Inténtalo de nuevo para conseguir tu primera puntuación.";
    },
    [activity?.points]
  );

  if (loading && !activity) {
    return (
      <div className="flex justify-center items-center min-h-screen p-8">
        <Spinner isLoading={true} />
      </div>
    );
  }

  if (error && !activity) {
    return (
      <div className="container mx-auto p-8">
        <div className="p-8 bg-red-100 text-red-700 rounded-lg shadow-md">
          <p className="text-xl font-semibold mb-4">
            Error al cargar la actividad
          </p>
          <p>{error}</p>
          <button
            onClick={() => router.push("/activities")}
            className="mt-4 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 transition-colors"
          >
            Volver a Actividades
          </button>
        </div>
      </div>
    );
  }

  if (!loading && !error && !activity) {
    return (
      <div className="container mx-auto p-8">
        <div className="p-8 bg-yellow-100 text-yellow-800 rounded-lg shadow-md">
          <p className="text-xl font-semibold mb-4">Actividad no encontrada</p>
          <p>
            Parece que la actividad que buscas no existe o la URL es incorrecta.
          </p>
          <button
            onClick={() => router.push("/activities")}
            className="mt-4 px-4 py-2 bg-yellow-700 text-white rounded hover:bg-yellow-800 transition-colors"
          >
            Volver a Actividades
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-8 relative min-h-screen">
      {confettiPieces > 0 && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <Confetti
            width={width}
            height={height}
            numberOfPieces={confettiPieces}
            recycle={false}
            gravity={0.3}
            wind={0.02}
            opacity={confettiOpacity}
            colors={[
              "#FFC700",
              "#FF0000",
              "#2E3191",
              "#41BBC7",
              "#34A853",
              "#FABA00",
              "#FBBC05",
            ]}
            confettiSource={{
              x: 0,
              y: -50,
              w: width,
              h: 10,
            }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
          />
        </div>
      )}

      {renderActivityDetails()}

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        {user?.role === "STUDENT" && activity?.isActive && !gameStarted && (
          <div className="mb-4 text-center">
            <button
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-xl transition-colors shadow-lg"
              onClick={startGame}
              disabled={loading}
            >
              {loading ? "Cargando..." : "Comenzar Actividad"}
            </button>
          </div>
        )}

        {user?.role === "STUDENT" && gameStarted && (
          <div className="mb-4 flex flex-col items-center">
            {!gameCompleted && timeRemaining !== null && (
              <div className="w-full max-w-md mb-6">
                <div className="p-3 bg-blue-100 text-blue-800 rounded-t-lg flex items-center justify-between text-lg font-semibold border border-blue-200">
                  <span>Tiempo restante:</span>
                  <span className="font-mono">
                    {Math.floor(timeRemaining / 60)}:
                    {String(timeRemaining % 60).padStart(2, "0")}
                  </span>
                </div>
                {activity?.timeLimit !== null &&
                  activity?.timeLimit !== undefined &&
                  activity.timeLimit > 0 && (
                    <div className="w-full bg-gray-200 rounded-b-lg h-3 border border-gray-300 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
                        style={{
                          width: `${Math.max(
                            0,
                            (timeRemaining / activity.timeLimit) * 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  )}
              </div>
            )}

            {gameCompleted ? (
              <div className="p-6 bg-green-100 text-green-800 rounded-lg w-full max-w-lg text-center shadow-xl border border-green-200">
                <h2 className="text-2xl font-bold mb-3">
                  ¡Actividad Completada!
                </h2>
                <p className="text-xl mb-4">
                  <strong>Puntuación final:</strong>{" "}
                  {gameInstance?.getGameState().score || 0} puntos
                </p>
                {gameInstance?.getGameState().score !== undefined && (
                  <p className="text-lg font-semibold mb-4">
                    {renderScoreFeedback(gameInstance.getGameState().score)}
                  </p>
                )}

                <button
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors shadow"
                  onClick={() => router.push("/activities")}
                >
                  Comenzar de nuevo
                </button>
              </div>
            ) : (
              renderActivityGame()
            )}
          </div>
        )}

        {user?.role !== "STUDENT" && (
          <div className="p-4 bg-gray-100 text-gray-800 rounded-lg text-center font-semibold">
            <p className="text-lg">
              Como profesor, puedes ver el progreso de los estudiantes y sus
              puntuaciones.
            </p>
            <button
              className="mt-4 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition-colors shadow"
              onClick={fetchScore}
            >
              Ver Puntuaciones
            </button>
            {user?.role !== "STUDENT" && (
              <div className="p-4 bg-gray-100 text-gray-800 rounded-lg text-center font-semibold">
                {loading ? (
                  <Spinner isLoading={true} />
                ) : score && score.length > 0 ? (
                  <div>
                    <p className="text-lg mb-4">
                      Puntuaciones de los estudiantes:
                    </p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full leading-normal">
                        <thead>
                          <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Número
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Estudiante
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Puntuación
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Retroalimentación
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Completado
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {score.map((s, index) => (
                            <tr key={s.id} className="hover:bg-gray-50">
                              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">
                                {index + 1}
                              </td>
                              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">
                                {s.student.name}
                              </td>
                              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">
                                {s.score}
                              </td>
                              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">
                                {s.feedback}
                              </td>
                              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">
                                {s.completed ? "Sí" : "No"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg">
                      No hay puntuaciones disponibles para esta actividad.
                    </p>
                    <button
                      className="mt-4 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition-colors shadow"
                      onClick={fetchScore}
                      disabled={loading}
                    >
                      {loading ? "Cargando..." : "Cargar Puntuaciones"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {user?.role === "STUDENT" &&
          activity &&
          !activity.isActive &&
          !gameStarted && (
            <div className="p-4 bg-gray-100 text-gray-800 rounded-lg text-center font-semibold">
              Esta actividad no está activa actualmente.
            </div>
          )}
      </div>
    </div>
  );
}
