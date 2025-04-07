"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/utils/api";
import Spinner from "@/app/components/ui/common/progresBar";
import { ActivityType, DifficultyLevel } from "@prisma/client";
import useUserStore from "@/app/stores/useUserStore";

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

export default function ActivitiesPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: "",
    difficulty: "",
    isActive: true,
    createdById: user?.id || ""
  });

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir query params
      const queryParams = new URLSearchParams();
      if (filters.type) queryParams.append("type", filters.type);
      if (filters.difficulty) queryParams.append("difficulty", filters.difficulty);
      if (filters.isActive !== undefined) queryParams.append("isActive", filters.isActive.toString());
      if (filters.createdById) queryParams.append("createdById", filters.createdById);

      const response = await api.get(`/activities?${queryParams.toString()}`);
      
      if (response.status === 200) {
        setActivities(response.data.data);
      } else {
        setError("Error al cargar las actividades");
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      setError("Error al cargar las actividades");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const navigateToActivity = (id: string) => {
    router.push(`/pages/dashboard/activity/${id}`);
  };

  const getActivityTypeLabel = (type: ActivityType) => {
    switch (type) {
      case "WORD_SEARCH":
        return "Sopa de Letras";
      case "QUIZ":
        return "Quiz";
      case "MATCHING":
        return "Emparejamiento";
      case "EXERCISE":
        return "Ejercicio";
      default:
        return type;
    }
  };

  const getDifficultyLabel = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case "BEGINNER":
        return "Principiante";
      case "INTERMEDIATE":
        return "Intermedio";
      case "ADVANCED":
        return "Avanzado";
      default:
        return difficulty;
    }
  };

  if (loading && !activities.length) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner isLoading={true} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Actividades</h1>
        <button
          onClick={() => router.push("/pages/dashboard/activities/new")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          + Nueva Actividad
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="WORD_SEARCH">Sopa de Letras</option>
              <option value="QUIZ">Quiz</option>
              <option value="MATCHING">Emparejamiento</option>
              <option value="EXERCISE">Ejercicio</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dificultad</label>
            <select
              name="difficulty"
              value={filters.difficulty}
              onChange={handleFilterChange}
              className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas</option>
              <option value="BEGINNER">Principiante</option>
              <option value="INTERMEDIATE">Intermedio</option>
              <option value="ADVANCED">Avanzado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              name="isActive"
              value={filters.isActive.toString()}
              onChange={handleFilterChange}
              className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="true">Activas</option>
              <option value="false">Inactivas</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                type: "",
                difficulty: "",
                isActive: true,
                createdById: user?.id || ""
              })}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md w-full"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Actividades */}
      {error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : activities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              onClick={() => navigateToActivity(activity.id)}
              className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">{activity.title}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  activity.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {activity.isActive ? "Activa" : "Inactiva"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-2">
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                  {getActivityTypeLabel(activity.type)}
                </span>
                <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                  {getDifficultyLabel(activity.difficulty)}
                </span>
                <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                  {activity.points} puntos
                </span>
              </div>

              <div className="text-sm text-gray-600 mb-2">
                <p>Tema: {activity.topic.title}</p>
                <p>Módulo: {activity.topic.module.title}</p>
              </div>

              <div className="text-xs text-gray-500">
                <p>Creado por: {activity.createdBy.name}</p>
                <p>Última actualización: {new Date(activity.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500">
          No se encontraron actividades con los filtros seleccionados
        </div>
      )}
    </div>
  );
} 