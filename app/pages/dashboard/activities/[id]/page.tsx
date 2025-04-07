"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/utils/api";
import Spinner from "@/app/components/ui/common/progresBar";
import { ActivityType, DifficultyLevel, Role } from "@prisma/client";
import useUserStore from "@/app/stores/useUserStore";
import { use } from "react";

interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  difficulty: DifficultyLevel;
  config: {
    instructions: string;
    wordSearch?: {
      words: string[];
      gridSize: number;
      allowDiagonal: boolean;
      allowBackwards: boolean;
    };
    quiz?: {
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    };
    matching?: {
      pairs: {
        left: string;
        right: string;
      }[];
      shuffle: boolean;
    };
    exercise?: {
      text: string;
      correctAnswer: string;
      caseSensitive: boolean;
      allowPartial: boolean;
    };
  };
  points: number;
  timeLimit: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  topicId: string;
  createdById: string;
  topic: {
    id: string;
    title: string;
    module: {
      id: string;
      title: string;
    };
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ActivityPage({ params }: PageProps) {
  const router = useRouter();
  const { user } = useUserStore();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<Activity>>({});
  const [gameState, setGameState] = useState({
    score: 0,
    timeLeft: 0,
    isPlaying: false,
    foundWords: [] as string[],
    grid: [] as string[][],
  });

  const resolvedParams = use(params);

  useEffect(() => {
    if (resolvedParams?.id) {
      fetchActivity();
    }
  }, [resolvedParams?.id]);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/activities?id=${resolvedParams.id}`);
      
      if (response.status === 200) {
        setActivity(response.data.data);
        setForm(response.data.data);
      } else {
        setError("Error al cargar la actividad");
      }
    } catch (error) {
      console.error("Error fetching activity:", error);
      setError("Error al cargar la actividad");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const [configType, field] = name.split(".");
    
    setForm(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [configType]: {
          ...prev.config?.[configType as keyof typeof prev.config],
          [field]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
        }
      }
    }));
  };

  const handleWordChange = (index: number, value: string) => {
    setForm(prev => ({
      ...prev,
      config: {
        ...prev.config,
        wordSearch: {
          ...prev.config?.wordSearch!,
          words: prev.config?.wordSearch?.words.map((word, i) => i === index ? value : word) || []
        }
      }
    }));
  };

  const addWord = () => {
    setForm(prev => ({
      ...prev,
      config: {
        ...prev.config,
        wordSearch: {
          ...prev.config?.wordSearch!,
          words: [...(prev.config?.wordSearch?.words || []), ""]
        }
      }
    }));
  };

  const removeWord = (index: number) => {
    setForm(prev => ({
      ...prev,
      config: {
        ...prev.config,
        wordSearch: {
          ...prev.config?.wordSearch!,
          words: prev.config?.wordSearch?.words.filter((_, i) => i !== index) || []
        }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.put(`/activities?id=${resolvedParams.id}`, form);

      if (response.status === 200) {
        setActivity(response.data.data);
        setIsEditing(false);
      } else {
        setError("Error al actualizar la actividad");
      }
    } catch (error) {
      console.error("Error updating activity:", error);
      setError("Error al actualizar la actividad");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta actividad?")) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.delete(`/activities?id=${resolvedParams.id}`);

      if (response.status === 200) {
        router.push("/pages/dashboard/activities");
      } else {
        setError("Error al eliminar la actividad");
      }
    } catch (error) {
      console.error("Error deleting activity:", error);
      setError("Error al eliminar la actividad");
    } finally {
      setLoading(false);
    }
  };

  const generateWordSearchGrid = () => {
    if (!activity?.config.wordSearch) return;
    
    const { words, gridSize, allowDiagonal, allowBackwards } = activity.config.wordSearch;
    const grid: string[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
    const directions = [
      { x: 1, y: 0 }, // horizontal
      { x: 0, y: 1 }, // vertical
      ...(allowDiagonal ? [{ x: 1, y: 1 }, { x: 1, y: -1 }] : []), // diagonal
    ];

    // Place words
    words.forEach(word => {
      let placed = false;
      while (!placed) {
        const direction = directions[Math.floor(Math.random() * directions.length)];
        const startX = Math.floor(Math.random() * gridSize);
        const startY = Math.floor(Math.random() * gridSize);
        
        if (canPlaceWord(grid, word, startX, startY, direction, allowBackwards)) {
          placeWord(grid, word, startX, startY, direction, allowBackwards);
          placed = true;
        }
      }
    });

    // Fill empty spaces with random letters
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (!grid[y][x]) {
          grid[y][x] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        }
      }
    }

    setGameState(prev => ({
      ...prev,
      grid,
      timeLeft: activity.timeLimit ? activity.timeLimit * 60 : 0,
      isPlaying: true,
    }));
  };

  const canPlaceWord = (grid: string[][], word: string, x: number, y: number, direction: { x: number, y: number }, allowBackwards: boolean) => {
    const gridSize = grid.length;
    const wordLength = word.length;
    
    // Check if word fits
    if (x + direction.x * (wordLength - 1) < 0 || x + direction.x * (wordLength - 1) >= gridSize ||
        y + direction.y * (wordLength - 1) < 0 || y + direction.y * (wordLength - 1) >= gridSize) {
      return false;
    }

    // Check if space is available
    for (let i = 0; i < wordLength; i++) {
      const currentX = x + direction.x * i;
      const currentY = y + direction.y * i;
      if (grid[currentY][currentX] && grid[currentY][currentX] !== word[i]) {
        return false;
      }
    }

    return true;
  };

  const placeWord = (grid: string[][], word: string, x: number, y: number, direction: { x: number, y: number }, allowBackwards: boolean) => {
    const wordToPlace = allowBackwards && Math.random() > 0.5 ? word.split('').reverse().join('') : word;
    for (let i = 0; i < wordToPlace.length; i++) {
      grid[y + direction.y * i][x + direction.x * i] = wordToPlace[i];
    }
  };

  const handleWordFound = (word: string) => {
    if (gameState.foundWords.includes(word)) return;
    
    setGameState(prev => ({
      ...prev,
      foundWords: [...prev.foundWords, word],
      score: prev.score + (activity?.points || 0),
    }));
  };

  if (loading && !activity) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner isLoading={true} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-gray-500">
          Actividad no encontrada
        </div>
      </div>
    );
  }

  if (user?.role === Role.STUDENT) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-4">{activity.title}</h1>
          <p className="text-gray-600 mb-4">{activity.config.instructions}</p>
          
          {activity.type === ActivityType.WORD_SEARCH && (
            <div className="space-y-4">
              {!gameState.isPlaying ? (
                <button
                  onClick={generateWordSearchGrid}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Comenzar Juego
                </button>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="font-semibold">Puntuación: </span>
                      {gameState.score}
                    </div>
                    {activity.timeLimit && (
                      <div>
                        <span className="font-semibold">Tiempo: </span>
                        {Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${activity.config.wordSearch?.gridSize}, 1fr)` }}>
                    {gameState.grid.map((row, y) => (
                      row.map((cell, x) => (
                        <div
                          key={`${y}-${x}`}
                          className="aspect-square border border-gray-300 flex items-center justify-center text-xl font-bold cursor-pointer hover:bg-gray-100"
                        >
                          {cell}
                        </div>
                      ))
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Palabras encontradas:</h3>
                    <div className="flex flex-wrap gap-2">
                      {gameState.foundWords.map((word, index) => (
                        <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin/Teacher view
  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{activity.title}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {isEditing ? 'Cancelar' : 'Editar'}
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Información Básica</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Actividad
                  </label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="WORD_SEARCH">Sopa de Letras</option>
                    <option value="QUIZ">Quiz</option>
                    <option value="MATCHING">Emparejamiento</option>
                    <option value="EXERCISE">Ejercicio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dificultad
                  </label>
                  <select
                    name="difficulty"
                    value={form.difficulty}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="BEGINNER">Principiante</option>
                    <option value="INTERMEDIATE">Intermedio</option>
                    <option value="ADVANCED">Avanzado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Puntos
                  </label>
                  <input
                    type="number"
                    name="points"
                    value={form.points}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiempo Límite (minutos)
                  </label>
                  <input
                    type="number"
                    name="timeLimit"
                    value={form.timeLimit || ""}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    placeholder="Opcional"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Activa
                  </label>
                </div>
              </div>

              {/* Configuración Específica */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Configuración</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instrucciones
                  </label>
                  <textarea
                    name="config.instructions"
                    value={form.config?.instructions}
                    onChange={handleConfigChange}
                    className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    required
                  />
                </div>

                {form.type === "WORD_SEARCH" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tamaño de la Cuadrícula
                      </label>
                      <input
                        type="number"
                        name="config.wordSearch.gridSize"
                        value={form.config?.wordSearch?.gridSize}
                        onChange={handleConfigChange}
                        className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
                        min="5"
                        max="20"
                        required
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="config.wordSearch.allowDiagonal"
                        checked={form.config?.wordSearch?.allowDiagonal}
                        onChange={handleConfigChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Permitir palabras en diagonal
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="config.wordSearch.allowBackwards"
                        checked={form.config?.wordSearch?.allowBackwards}
                        onChange={handleConfigChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Permitir palabras al revés
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Palabras
                      </label>
                      <div className="space-y-2">
                        {form.config?.wordSearch?.words.map((word, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={word}
                              onChange={(e) => handleWordChange(index, e.target.value)}
                              className="flex-1 border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => removeWord(index)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addWord}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                        >
                          + Agregar Palabra
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
              >
                {loading ? <Spinner isLoading={true} /> : "Guardar Cambios"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Información General</h2>
              <p><span className="font-semibold">Tipo:</span> {activity.type}</p>
              <p><span className="font-semibold">Dificultad:</span> {activity.difficulty}</p>
              <p><span className="font-semibold">Puntos:</span> {activity.points}</p>
              <p><span className="font-semibold">Tiempo límite:</span> {activity.timeLimit ? `${activity.timeLimit} minutos` : 'Sin límite'}</p>
              <p><span className="font-semibold">Estado:</span> {activity.isActive ? 'Activa' : 'Inactiva'}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold">Configuración</h2>
              <p><span className="font-semibold">Instrucciones:</span> {activity.config.instructions}</p>
              
              {activity.type === ActivityType.WORD_SEARCH && activity.config.wordSearch && (
                <div className="mt-2">
                  <p><span className="font-semibold">Tamaño de la cuadrícula:</span> {activity.config.wordSearch.gridSize}x{activity.config.wordSearch.gridSize}</p>
                  <p><span className="font-semibold">Palabras:</span></p>
                  <ul className="list-disc list-inside ml-4">
                    {activity.config.wordSearch.words.map((word, index) => (
                      <li key={index}>{word}</li>
                    ))}
                  </ul>
                  <p><span className="font-semibold">Opciones:</span></p>
                  <ul className="list-disc list-inside ml-4">
                    <li>Palabras en diagonal: {activity.config.wordSearch.allowDiagonal ? 'Sí' : 'No'}</li>
                    <li>Palabras al revés: {activity.config.wordSearch.allowBackwards ? 'Sí' : 'No'}</li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold">Información del Creador</h2>
              <p><span className="font-semibold">Nombre:</span> {activity.createdBy.name}</p>
              <p><span className="font-semibold">Email:</span> {activity.createdBy.email}</p>
              <p><span className="font-semibold">Fecha de creación:</span> {new Date(activity.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 