"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/utils/api";
import Spinner from "@/app/components/ui/common/progresBar";
import { ActivityType, DifficultyLevel } from "@prisma/client";
import useUserStore from "@/app/stores/useUserStore";

interface ActivityForm {
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
  topicId: string;
}

export default function NewActivityPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ActivityForm>({
    title: "",
    type: "WORD_SEARCH",
    difficulty: "BEGINNER",
    config: {
      instructions: "",
      wordSearch: {
        words: [],
        gridSize: 10,
        allowDiagonal: true,
        allowBackwards: true
      }
    },
    points: 10,
    timeLimit: null,
    isActive: true,
    topicId: ""
  });

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
          ...prev.config[configType as keyof typeof prev.config],
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
          ...prev.config.wordSearch!,
          words: prev.config.wordSearch!.words.map((word, i) => i === index ? value : word)
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
          ...prev.config.wordSearch!,
          words: [...prev.config.wordSearch!.words, ""]
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
          ...prev.config.wordSearch!,
          words: prev.config.wordSearch!.words.filter((_, i) => i !== index)
        }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/activities", {
        ...form,
        createdById: user?.id
      });

      if (response.status === 201) {
        router.push("/pages/dashboard/activities");
      } else {
        setError("Error al crear la actividad");
      }
    } catch (error) {
      console.error("Error creating activity:", error);
      setError("Error al crear la actividad");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Nueva Actividad</h1>
        <button
          onClick={() => router.push("/pages/dashboard/activities")}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
        >
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

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
                value={form.config.instructions}
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
                    value={form.config.wordSearch?.gridSize}
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
                    checked={form.config.wordSearch?.allowDiagonal}
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
                    checked={form.config.wordSearch?.allowBackwards}
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
                    {form.config.wordSearch?.words.map((word, index) => (
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

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
          >
            {loading ? <Spinner isLoading={true} /> : "Crear Actividad"}
          </button>
        </div>
      </form>
    </div>
  );
} 