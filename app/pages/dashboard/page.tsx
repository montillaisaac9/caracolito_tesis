// app/dashboard/page.tsx
"use client"
import { useCallback, useEffect, useState } from "react";
import DashboardCard from "@/app/components/ui/common/card";
import ModuleCard from "@/app/components/ui/common/moduleCard";
import useUserStore from "@/app/stores/useUserStore";
import axios from "axios";
// app/types.ts
export interface Activity {
  id: string;
  title: string;
  type: string;
  difficulty: string;
  points: number;
  timeLimit: number;
  isActive: boolean;
  topic: {
    id: string;
    title: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  progress: number;
  activitiesCount: number;
  isActive: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  completedActivities: number;
  activeModules: number;
  userGrowth: number;
  completionRate: number;
  moduleEngagement: number;
  lastUpdated: string;
}

export default function Dashboard() {
  const { user } = useUserStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState({
    activities: true,
    modules: true,
    stats: true
  });
  const [error, setError] = useState({
    activities: null as string | null,
    modules: null as string | null,
    stats: null as string | null
  });

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  // Función para obtener estadísticas
  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get("/api/dashboard/stats");
      setStats(response.data.data);
      setError(prev => ({ ...prev, stats: null }));
    } catch (err) {
      console.error("Error obteniendo estadísticas:", err);
      setError(prev => ({ ...prev, stats: "Error cargando estadísticas" }));
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, []);

  // Función para obtener módulos
  const fetchModules = useCallback(async () => {
    try {
      const response = await axios.get("/api/modules");
      setModules(response.data.data);
      setError(prev => ({ ...prev, modules: null }));
    } catch (err) {
      console.error("Error obteniendo módulos:", err);
      setError(prev => ({ ...prev, modules: "Error cargando módulos" }));
    } finally {
      setLoading(prev => ({ ...prev, modules: false }));
    }
  }, []);

  // Función para obtener actividades
  const fetchActivities = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await axios.get(`/api/activities?createdById=${user.id}`);
      setActivities(response.data.data);
      setError(prev => ({ ...prev, activities: null }));
    } catch (err) {
      console.error("Error obteniendo actividades:", err);
      setError(prev => ({ ...prev, activities: "Error cargando actividades" }));
    } finally {
      setLoading(prev => ({ ...prev, activities: false }));
    }
  }, [user?.id]);

  // Efecto para cargar todos los datos
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchStats(),
        fetchModules(),
        fetchActivities()
      ]);
    };
    
    loadData();
  }, [fetchStats, fetchModules, fetchActivities]);

  // Componente de carga
  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Panel de Control</h1>
        <div className="text-sm text-gray-500">
          {stats && `Última actualización: ${formatDate(stats.lastUpdated)}`}
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading.stats ? (
          <>
            <div className="bg-white p-6 rounded-xl shadow-sm h-36 flex items-center">
              <LoadingSkeleton />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm h-36 flex items-center">
              <LoadingSkeleton />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm h-36 flex items-center">
              <LoadingSkeleton />
            </div>
          </>
        ) : error.stats ? (
          <div className="col-span-3 text-center py-8 text-red-500">
            {error.stats}
          </div>
        ) : stats ? (
          <>
            <DashboardCard 
              title="Total de Usuarios" 
              value={stats.totalUsers}
              trend={stats.userGrowth}
            />
            <DashboardCard 
              title="Actividades Completadas" 
              value={stats.completedActivities}
              trend={stats.completionRate}
            />
            <DashboardCard 
              title="Módulos Activos" 
              value={stats.activeModules}
              trend={stats.moduleEngagement}
            />
          </>
        ) : null}
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Módulos de aprendizaje */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Módulos de Aprendizaje</h2>
            {modules.length > 0 && (
              <span className="text-sm text-gray-500">
                {modules.length} módulos disponibles
              </span>
            )}
          </div>

          {loading.modules ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : error.modules ? (
            <div className="text-center py-8 text-red-500">{error.modules}</div>
          ) : modules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay módulos disponibles actualmente
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modules.map((module) => (
                <ModuleCard 
                  key={module.id}
                  id={module.id}
                  title={module.title}
                  description={module.description}
                  progress={module.progress}
                  activitiesCount={module.activitiesCount}
                />
              ))}
            </div>
          )}
        </div>

        {/* Actividades recientes */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Tus Actividades</h2>
            <div className="flex items-center space-x-2">
              {activities.length > 0 && (
                <span className="text-sm text-gray-500">
                  {activities.length} actividades
                </span>
              )}
              <button 
                onClick={fetchActivities}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Recargar actividades"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {loading.activities ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : error.activities ? (
            <div className="text-center py-8 text-red-500">{error.activities}</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">No has creado actividades aún</div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Crear primera actividad
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <ActivityCard 
                  key={activity.id}
                  activity={activity}
                  onRefresh={fetchActivities}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente de tarjeta de actividad
const ActivityCard = ({ activity, onRefresh }: { activity: Activity, onRefresh: () => void }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(`/api/activities/${activity.id}`);
      onRefresh();
    } catch (error) {
      console.error("Error eliminando actividad:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-lg text-gray-800">{activity.title}</h3>
          <p className="text-sm text-gray-600">
            Tema: <span className="font-medium">{activity.topic.title}</span>
          </p>
        </div>
        <div className="flex space-x-2">
          <span className={`text-xs px-2 py-1 rounded-full ${getActivityTypeColor(activity.type)}`}>
            {activity.type.replace("_", " ")}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(activity.difficulty)}`}>
            {activity.difficulty}
          </span>
        </div>
      </div>

      <div className="mt-3 flex justify-between items-center">
        <div className="flex space-x-4 text-sm">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span>{activity.points} pts</span>
          </div>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{activity.timeLimit} seg</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1 text-gray-500 hover:text-red-500 transition-colors"
            aria-label="Eliminar actividad"
          >
            {isDeleting ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
          <button 
            className="p-1 text-gray-500 hover:text-blue-500 transition-colors"
            aria-label="Editar actividad"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Funciones auxiliares para estilos
const getActivityTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    WORD_SEARCH: "bg-purple-100 text-purple-800",
    MATCHING: "bg-blue-100 text-blue-800",
    QUIZ: "bg-green-100 text-green-800",
    FLASHCARDS: "bg-orange-100 text-orange-800",
    CROSSWORD: "bg-indigo-100 text-indigo-800",
    DEFAULT: "bg-gray-100 text-gray-800"
  };
  return colors[type] || colors.DEFAULT;
};

const getDifficultyColor = (difficulty: string) => {
  const colors: Record<string, string> = {
    BEGINNER: "bg-green-100 text-green-800",
    INTERMEDIATE: "bg-yellow-100 text-yellow-800",
    ADVANCED: "bg-red-100 text-red-800",
    DEFAULT: "bg-gray-100 text-gray-800"
  };
  return colors[difficulty] || colors.DEFAULT;
};