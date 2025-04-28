'use client'

import { ActivityType, DifficultyLevel } from "@prisma/client";
import api from "@/app/utils/api";
import useUserStore from "@/app/stores/useUserStore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import Spinner from "@/app/components/ui/common/progresBar";
import { GameFactory } from "@/app/lib/games/GameFactory";
import { GameBase } from "@/app/lib/games/abstract/GameBase";

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
  attempts?: number; // Asumimos que 1 significa un intento registrado
  lastAttempt?: Date;
  feedback?: string;
}

interface GameState {
  score: number;
  completed: boolean;
  // Otros estados internos del juego si los hay
}

export default function Activities() {
  const params = useParams();
  const router = useRouter();
  const activityId = params?.id as string;

  // Estado principal de carga y error de la actividad
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);

  // Estado del usuario desde el store
  const { user } = useUserStore();

  // Estado y refs relacionados con el juego
  const [gameInstance, setGameInstance] = useState<GameBase | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Refs para mantener valores actualizados dentro de callbacks como setInterval
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const latestTimeRemaining = useRef(timeRemaining);
  const latestGameInstance = useRef(gameInstance);
  const latestGameCompleted = useRef(gameCompleted);


  // Efectos para mantener los refs actualizados
  useEffect(() => {
    latestTimeRemaining.current = timeRemaining;
  }, [timeRemaining]);

  useEffect(() => {
    latestGameInstance.current = gameInstance;
  }, [gameInstance]);

   useEffect(() => {
    latestGameCompleted.current = gameCompleted;
  }, [gameCompleted]);


  // Función para obtener los detalles de la actividad
  const fetchActivity = useCallback(async () => {
    if (!activityId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await api.get<{ data: Activity }>(`/activities?id=${activityId}`);
      if (response.status === 200 && response.data.data) {
        setActivity(response.data.data);
        // Inicializar timeRemaining solo si hay un timeLimit en la actividad
        if (response.data.data.timeLimit !== null && response.data.data.timeLimit !== undefined) {
             setTimeRemaining(response.data.data.timeLimit);
        } else {
             setTimeRemaining(null); // Asegurarse de que sea null si no hay límite
        }
      } else {
        setError("No se encontró la actividad solicitada.");
        setActivity(null); // Limpiar actividad si no se encuentra
        setTimeRemaining(null);
      }
    } catch (err) {
      console.error("Error obteniendo la actividad:", err);
      setError("Error al cargar los datos de la actividad.");
      setActivity(null); // Limpiar actividad en caso de error
      setTimeRemaining(null);
    } finally {
      setLoading(false);
    }
  }, [activityId]); // Depende solo del ID de la actividad

  // Efecto para cargar la actividad al montar el componente o cambiar activityId
  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]); // Depende solo de fetchActivity (que es estable gracias a useCallback y su dependencia en activityId)


  // Función para guardar el progreso, recibe explícitamente los datos a guardar
  const saveProgress = useCallback(async (
    instance: GameBase,
    gameState: GameState,
    currentTimeRemaining: number | null
  ): Promise<void> => {
    // Estos logs pueden ayudar a depurar, pero se deben quitar en producción si son excesivos
    // console.log("Intentando guardar progreso con:", {
    //   activityId: activity?.id,
    //   userId: user?.id,
    //   instanceExists: !!instance,
    //   gameState,
    //   currentTimeRemaining
    // });

    // Validar que tenemos la información necesaria antes de guardar
    if (!activity?.id || !user?.id || !instance) {
       console.warn("Datos faltantes para guardar progreso:", {
         activityId: activity?.id,
         userId: user?.id,
         instanceExists: !!instance
       });
       return; // No guardar si faltan datos esenciales
     }

    try {
      const progressData: ProgressData = {
          studentId: user.id,
          activityId: activity.id,
          score: gameState.score,
          // Usa el estado de completado del juego, no el estado del componente
          completed: gameState.completed,
          // Calcula el tiempo empleado solo si había un límite de tiempo
          timeSpent: activity.timeLimit !== null && activity.timeLimit !== undefined && currentTimeRemaining !== null
                     ? (activity.timeLimit - currentTimeRemaining)
                     : undefined,
          attempts: 1, // Asumimos 1 significa que se registró un intento de progreso
          lastAttempt: new Date(),
          feedback: JSON.stringify({
            gameState: gameState,
            gameData: instance.getGameData() // Asumiendo que getGameData existe
          })
      };

      // console.log("Enviando datos de progreso:", progressData);
      const response = await api.post(`/progress`, { data: progressData }); // Enviar en un objeto 'data' si la API lo espera así
      console.log("Progreso guardado exitosamente", response.data);

    } catch (error) {
      console.error("Error saving progress:", error);
      // Podrías querer mostrar un mensaje de error al usuario aquí
    }
  }, [activity, user?.id]); // Dependencias minimas para construir los datos de progreso

  // Función para manejar la finalización del juego
  // No recibe argumentos, lee del ref para obtener la instancia más reciente
  const handleGameCompletion = useCallback(async () => {
     // Usa el ref para el chequeo inicial para evitar llamadas duplicadas
    if (latestGameCompleted.current) return;

    console.log("Iniciando completado del juego (desde callback)");
    setGameCompleted(true); // Establecer el estado de completado

    // Limpiar el temporizador si existe
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Obtener los valores finales usando los refs
    const instance = latestGameInstance.current;
    const currentTimeRemaining = latestTimeRemaining.current;

    if (!instance) {
      console.warn("No game instance available to complete game.");
      return; // No se puede completar si no hay instancia
    }

    try {
      const gameState = instance.getGameState(); // Obtener el estado final del juego
      await saveProgress(instance, gameState, currentTimeRemaining); // Guardar progreso con los datos finales
      instance.completeGame?.(); // Llamar al método de finalización de la instancia del juego
    } catch (error) {
      console.error("Error al completar el juego:", error);
       // Podrías querer mostrar un mensaje de error al usuario aquí
    }
  }, [saveProgress]); // Dependencias: saveProgress (stable), gameCompleted (for the initial ref check). gameInstance and timeRemaining are accessed via refs.


  // Función para iniciar el juego
  const startGame = useCallback(async () => {
    if (!activity || gameStarted) return; // No iniciar si no hay actividad o ya ha iniciado

    console.log("Iniciando el juego...");

    try {
      const game = GameFactory.createGame(activity);

      // Asignar el callback de completado. Usa la función handleGameCompletion
      // que accede a los refs para obtener el estado más reciente cuando se llama.
      game.onGameComplete = async () => {
        console.log("Juego completado desde el callback de la instancia del juego");
        await handleGameCompletion(); // Llama a handleGameCompletion (que lee de refs)
      };

      game.initializeGame(); // Inicializa la instancia del juego
      setGameInstance(game); // Almacena la instancia en el estado
      setGameStarted(true); // Marca el juego como iniciado
      setGameCompleted(false); // Asegura que gameCompleted sea falso al inicio

      // Si la actividad tiene tiempo límite, inicializa el tiempo restante
      if (activity.timeLimit !== null && activity.timeLimit !== undefined) {
        setTimeRemaining(activity.timeLimit);
      } else {
        setTimeRemaining(null); // Asegurarse de que sea null si no hay límite
      }

    } catch (err) {
      console.error("Error al iniciar el juego:", err);
      setError(`Tipo de actividad no soportado: ${activity?.type || 'Desconocido'}`); // Mostrar error si falla la creación/inicialización
    }
  }, [activity, gameStarted, handleGameCompletion]); // Depende de activity (para crear el juego), gameStarted (para no iniciar multiples veces), y handleGameCompletion (para el callback)


  // Efecto para el temporizador (controlado por gameStarted y gameCompleted)
  useEffect(() => {
    // El temporizador solo se ejecuta si el juego ha iniciado, hay tiempo límite y NO ha completado
    if (!gameStarted || latestTimeRemaining.current === null || latestGameCompleted.current) {
       console.log("Temporizador no iniciado o detenido:", {
          gameStarted,
          timeRemaining: latestTimeRemaining.current,
          gameCompleted: latestGameCompleted.current
       });
      // Asegurarse de limpiar el intervalo si las condiciones ya no se cumplen
      if (timerRef.current) {
         clearInterval(timerRef.current);
         timerRef.current = null;
      }
      return;
    }

     console.log("Iniciando temporizador...");
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = (prev === null || prev <= 1) ? 0 : prev - 1;
        latestTimeRemaining.current = newTime; // Actualizar el ref inmediatamente

        if (newTime === 0) {
           console.log("Tiempo agotado, llamando a handleGameCompletion");
           // El tiempo se agotó, llamar a la función de finalización
           // handleGameCompletion ya lee el instance y timeRemaining de sus refs
           handleGameCompletion();
        }
        return newTime;
      });
    }, 1000);

    // Función de limpieza del efecto
    return () => {
      console.log("Limpiando temporizador...");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameStarted, gameCompleted, handleGameCompletion]);
  // Dependencias: gameStarted (para empezar), gameCompleted (para parar), handleGameCompletion (porque se llama dentro del intervalo).
  // timeRemaining y gameInstance ya NO son dependencias directas del efecto, se accede via refs dentro del intervalo/handleGameCompletion.


  // Funciones de renderizado memoizadas con useCallback
  const renderActivityGame = useCallback(() => {
    // Asegurarse de que gameInstance existe antes de intentar renderizar
    if (!gameInstance) return null;
    return (
        <div className="game-container">
          {gameInstance.render()}
        </div>
      );
  }, [gameInstance]); // Depende solo de gameInstance


  const renderActivityDetails = useCallback(() => {
    // No renderizar detalles si no hay actividad
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
              {(activity.timeLimit !== null && activity.timeLimit !== undefined) && (
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
  }, [activity]); // Depende solo de activity

  const renderScoreFeedback = useCallback((score: number) => {
    if (score >= 8) return "¡Muy bien, tienes talento!";
    if (score >= 5) return "Vas bien.";
    return "Necesitas practicar más.";
  }, []); // Sin dependencias

  // Renderizado condicional principal
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

  // Si no hay loading, error y activity es null, significa que no se encontró la actividad
   if (!loading && !error && !activity) {
       return (
           <div className="p-8 bg-yellow-100 text-yellow-800 rounded-lg">
               No se pudo cargar la actividad. Verifica la URL.
           </div>
       );
   }


  return (
    <div className="container mx-auto p-4">
      {renderActivityDetails()}

      {/* Botón para iniciar la actividad solo para estudiantes, si está activa y no ha iniciado */}
      {user?.role === 'STUDENT' && activity?.isActive && !gameStarted && (
        <div className="mb-4">
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
            onClick={startGame} // Llama a la función startGame
          >
            Comenzar Actividad
          </button>
        </div>
      )}

      {/* Área del juego o resultado, solo para estudiantes si el juego ha iniciado */}
      {user?.role === 'STUDENT' && gameStarted && (
        <div className="mb-8">
          {/* Mostrar tiempo restante si existe y el juego no ha completado */}
          {!gameCompleted && timeRemaining !== null && (
            <div className="mb-4">
              <div className="p-3 bg-blue-100 text-blue-800 rounded flex items-center justify-center text-lg font-semibold">
                Tiempo restante: {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
              </div>
               {/* Barra de progreso del tiempo */}
              {activity?.timeLimit !== null && activity?.timeLimit !== undefined && (
                 <div className="w-full mt-2 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 bg-blue-500 rounded-full transition-all duration-1000 ease-linear"
                      // Calcular el ancho basado en el tiempo restante y el límite inicial
                      style={{ width: `${(timeRemaining / activity.timeLimit) * 100}%` }}
                    ></div>
                 </div>
              )}
            </div>
          )}

          {/* Mostrar resultado si el juego ha completado, de lo contrario renderizar el juego */}
          {gameCompleted ? (
            <div className="p-6 bg-green-100 text-green-800 rounded-lg mb-4">
              <h2 className="text-2xl font-bold mb-2">¡Actividad Completada!</h2>
              <p className="text-xl mb-4">
                {/* Mostrar puntuación si la instancia del juego existe */}
                <strong>Puntuación:</strong> {gameInstance?.getGameState().score || 0} puntos
                {gameInstance?.getGameState().score !== undefined && ( // Mostrar feedback solo si hay puntuación
                  <span className="ml-2">{renderScoreFeedback(gameInstance.getGameState().score)}</span>
                )}
              </p>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                onClick={() => router.push('/activities')} // Botón para volver
              >
                Volver a Actividades
              </button>
            </div>
          ) : (
             // Renderizar el juego si no ha completado
            renderActivityGame()
          )}
        </div>
      )}

      {/* Mensaje si el usuario no es estudiante o la actividad no está activa */}
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