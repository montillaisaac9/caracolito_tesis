"use client";
import Spinner from "@/app/components/ui/common/progresBar";
import api from "@/app/utils/api";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ActivityType, DifficultyLevel } from "@prisma/client";

interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  difficulty: DifficultyLevel;
  config: JSON;
  points: number;
  timeLimit: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  topicId: string;
  createdById: string;
}

interface Topic {
  id: string;
  title: string;
  content: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  moduleId: string;
  activities: Activity[];
}

interface ActivityFormData {
  title: string;
  type: ActivityType;
  difficulty: DifficultyLevel;
  config: {
    words: string[];
    gridSize: number;
  };
  points: number;
  timeLimit: number;
  isActive: boolean;
}

export default function Topic() {
  const params = useParams();
  const topicId = params?.id as string;
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [wordErrors, setWordErrors] = useState<string[]>([]);
  const MAX_WORDS = 10;
  
  // Estados para el formulario de actividad
  const [activityForm, setActivityForm] = useState<ActivityFormData>({
    title: "",
    type: ActivityType.WORD_SEARCH,
    difficulty: DifficultyLevel.BEGINNER,
    config: {
      words: [""],
      gridSize: 10
    },
    points: 10,
    timeLimit: 300,
    isActive: true
  });
  
  const router = useRouter();

  const fetchTopic = async () => {
    try {
      setLoading(true);
      setError(null);
     
      const response = await api.get(`/topics/get?id=${topicId}`);
      if (response.status === 200 && response.data.data?.length > 0) {
        setTopic(response.data.data[0]);
      } else {
        setError("No se encontró el tópico solicitado");
      }
    } catch (error) {
      console.error("Error obteniendo el tópico:", error);
      setError("Error al cargar los datos del tópico");
    } finally {
      setLoading(false);
    }
  };

  function navigateToActivity(id: string) {
    router.push(`/pages/dashboard/activity/${id}`);
  }

  const validateWordLengths = () => {
    const { difficulty, config } = activityForm;
    const newErrors = [...config.words].map((word, index) => {
      if (!word.trim()) return "La palabra no puede estar vacía";
      
      const wordLength = word.trim().length;
      
      if (difficulty === DifficultyLevel.BEGINNER && wordLength > 5) {
        return "Para nivel Principiante, la palabra debe tener máximo 5 caracteres";
      }
      if (difficulty === DifficultyLevel.INTERMEDIATE && (wordLength < 5 || wordLength > 8)) {
        return "Para nivel Intermedio, la palabra debe tener entre 5 y 8 caracteres";
      }
      if (difficulty === DifficultyLevel.ADVANCED && wordLength < 8) {
        return "Para nivel Avanzado, la palabra debe tener 8 o más caracteres";
      }
      
      return "";
    });
    
    setWordErrors(newErrors);
    return newErrors.every(error => error === "");
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar la longitud de las palabras según el nivel de dificultad
    if (!validateWordLengths()) {
      return;
    }
    
    try {
      setLoading(true);
      
      await api.post("/activities", {
        ...activityForm,
        topicId: topicId
      });
      
      // Resetear formulario
      setActivityForm({
        title: "",
        type: ActivityType.WORD_SEARCH,
        difficulty: DifficultyLevel.BEGINNER,
        config: {
          words: [""],
          gridSize: 10
        },
        points: 10,
        timeLimit: 300,
        isActive: true
      });
      
      setIsActivityModalOpen(false);
      
      // Recargar tópico para ver los cambios
      fetchTopic();
    } catch (error) {
      console.error("Error al crear actividad:", error);
      setError("Error al crear la actividad");
    } finally {
      setLoading(false);
    }
  };

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...activityForm.config.words];
    newWords[index] = value;
    setActivityForm({
      ...activityForm,
      config: {
        ...activityForm.config,
        words: newWords
      }
    });
    
    // Actualizar errores de validación en tiempo real
    const newErrors = [...wordErrors];
    
    if (!value.trim()) {
      newErrors[index] = "La palabra no puede estar vacía";
    } else {
      const wordLength = value.trim().length;
      
      if (activityForm.difficulty === DifficultyLevel.BEGINNER && wordLength > 5) {
        newErrors[index] = "Para nivel Principiante, la palabra debe tener máximo 5 caracteres";
      } else if (activityForm.difficulty === DifficultyLevel.INTERMEDIATE && (wordLength < 5 || wordLength > 8)) {
        newErrors[index] = "Para nivel Intermedio, la palabra debe tener entre 5 y 8 caracteres";
      } else if (activityForm.difficulty === DifficultyLevel.ADVANCED && wordLength < 8) {
        newErrors[index] = "Para nivel Avanzado, la palabra debe tener 8 o más caracteres";
      } else {
        newErrors[index] = "";
      }
    }
    
    setWordErrors(newErrors);
  };

  // Manejar cambio de dificultad para validar palabras existentes
  const handleDifficultyChange = (difficulty: DifficultyLevel) => {
    setActivityForm({...activityForm, difficulty});
    
    // Revalidar palabras existentes con la nueva dificultad
    const newErrors = [...activityForm.config.words].map((word, index) => {
      if (!word.trim()) return "La palabra no puede estar vacía";
      
      const wordLength = word.trim().length;
      
      if (difficulty === DifficultyLevel.BEGINNER && wordLength > 5) {
        return "Para nivel Principiante, la palabra debe tener máximo 5 caracteres";
      }
      if (difficulty === DifficultyLevel.INTERMEDIATE && (wordLength < 5 || wordLength > 8)) {
        return "Para nivel Intermedio, la palabra debe tener entre 5 y 8 caracteres";
      }
      if (difficulty === DifficultyLevel.ADVANCED && wordLength < 8) {
        return "Para nivel Avanzado, la palabra debe tener 8 o más caracteres";
      }
      
      return "";
    });
    
    setWordErrors(newErrors);
  };

  const addWordField = () => {
    if (activityForm.config.words.length >= MAX_WORDS) {
      return; // No permitir más de MAX_WORDS palabras
    }
    
    setActivityForm({
      ...activityForm,
      config: {
        ...activityForm.config,
        words: [...activityForm.config.words, ""]
      }
    });
    
    // Añadir una entrada de error para la nueva palabra
    setWordErrors([...wordErrors, ""]);
  };

  const removeWordField = (index: number) => {
    const newWords = [...activityForm.config.words];
    newWords.splice(index, 1);
    setActivityForm({
      ...activityForm,
      config: {
        ...activityForm.config,
        words: newWords
      }
    });
    
    // Eliminar la entrada de error correspondiente
    const newErrors = [...wordErrors];
    newErrors.splice(index, 1);
    setWordErrors(newErrors);
  };

  useEffect(() => {
    if (topicId) {
      fetchTopic();
    }
  }, [topicId]);

  if (loading && !topic) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner isLoading={true}/>
      </div>
    );
  }

  if (error && !topic) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {loading && <div className="fixed top-4 right-4"><Spinner isLoading={true}/></div>}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Detalles del Tópico</h1>
        <button
          onClick={() => setIsActivityModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          + Nueva Actividad
        </button>
      </div>
      
      {topic ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">{topic.title}</h2>
              <p className="mb-2 text-gray-700">{topic.content}</p>
              <div className="mt-4 text-sm text-gray-500">
                <p>ID: {topic.id}</p>
                <p>Creado: {new Date(topic.createdAt).toLocaleString()}</p>
                <p>Estado: {topic.isActive ? 
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Activo</span> : 
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Inactivo</span>}
                </p>
              </div>
            </div>
          </div>
          
          {/* Mostrar las actividades asociadas */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Actividades ({topic.activities?.length || 0})</h3>
            </div>
            
            {topic.activities && topic.activities.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {topic.activities.map((activity) => (
                  <div 
                    key={`activity-${activity.id}`} 
                    onClick={() => navigateToActivity(activity.id)} 
                    className="bg-gray-50 p-4 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-lg">{activity.title}</h4>
                      <span className="text-sm text-gray-500">Tipo: {activity.type}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {activity.difficulty}
                      </span>
                      <span className="text-sm">Puntos: {activity.points}</span>
                    </div>
                    <div className="mt-2 flex justify-between text-sm text-gray-500">
                      <span>Tiempo: {activity.timeLimit ? `${activity.timeLimit}s` : 'Sin límite'}</span>
                      <span>{activity.isActive ? 'Activa' : 'Inactiva'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No hay actividades disponibles para este tópico.</p>
            )}
          </div>
        </div>
      ) : (
        <p>No hay datos disponibles para mostrar.</p>
      )}
      
      {/* Modal para crear actividades */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg px-6 py-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Crear Actividad</h2>
              <button 
                onClick={() => setIsActivityModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateActivity} className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  placeholder="Título de la actividad"
                  value={activityForm.title}
                  onChange={(e) => setActivityForm({...activityForm, title: e.target.value})}
                  className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={activityForm.type}
                  onChange={(e) => setActivityForm({...activityForm, type: e.target.value as ActivityType})}
                  className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value={ActivityType.WORD_SEARCH}>Sopa de Letras</option>
                  <option value={ActivityType.QUIZ}>Quiz</option>
                  <option value={ActivityType.MATCHING}>Conectar palabras</option>
                  <option value={ActivityType.EXERCISE}>Ejercicio Practivo</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dificultad</label>
                <select
                  value={activityForm.difficulty}
                  onChange={(e) => handleDifficultyChange(e.target.value as DifficultyLevel)}
                  className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value={DifficultyLevel.BEGINNER}>Principiante (palabras máx. 5 caracteres)</option>
                  <option value={DifficultyLevel.INTERMEDIATE}>Intermedio (palabras 5-8 caracteres)</option>
                  <option value={DifficultyLevel.ADVANCED}>Avanzado (palabras 8+ caracteres)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Puntos</label>
                <input
                  type="number"
                  placeholder="Puntos"
                  value={activityForm.points}
                  onChange={(e) => setActivityForm({...activityForm, points: Number(e.target.value)})}
                  className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo límite (segundos)</label>
                <input
                  type="number"
                  placeholder="Tiempo límite"
                  value={activityForm.timeLimit}
                  onChange={(e) => setActivityForm({...activityForm, timeLimit: Number(e.target.value)})}
                  className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño de la cuadrícula</label>
                <input
                  type="number"
                  placeholder="Tamaño de la cuadrícula"
                  value={activityForm.config.gridSize}
                  onChange={(e) => setActivityForm({
                    ...activityForm, 
                    config: {
                      ...activityForm.config,
                      gridSize: Number(e.target.value)
                    }
                  })}
                  className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  min="5"
                  max="20"
                  required
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Palabras ({activityForm.config.words.length}/{MAX_WORDS})
                  </label>
                  <button 
                    type="button" 
                    onClick={addWordField}
                    disabled={activityForm.config.words.length >= MAX_WORDS}
                    className={`text-xs ${activityForm.config.words.length >= MAX_WORDS ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white px-2 py-1 rounded`}
                  >
                    + Añadir palabra
                  </button>
                </div>
                
                {activityForm.config.words.map((word, index) => (
                  <div key={`word-${index}`} className="mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`Palabra ${index + 1}`}
                        value={word}
                        onChange={(e) => handleWordChange(index, e.target.value)}
                        className={`w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500 ${wordErrors[index] ? 'border-red-500' : ''}`}
                        required
                      />
                      {activityForm.config.words.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeWordField(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {wordErrors[index] && (
                      <p className="text-red-500 text-xs mt-1">{wordErrors[index]}</p>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={activityForm.isActive}
                  onChange={(e) => setActivityForm({...activityForm, isActive: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Actividad activa</label>
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  disabled={loading || wordErrors.some(error => error !== "")}
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}