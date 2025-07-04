"use client";
import { useCallback, useEffect, useState } from "react";
import DashboardCard from "@/app/components/ui/common/card";
import ModuleCard from "@/app/components/ui/common/moduleCard";
import useUserStore from "@/app/stores/useUserStore";
import axios, { AxiosError } from "axios";
import { RefreshCw } from "lucide-react";
import { Skeleton, StatsSkeleton } from "@/app/components/ui/common/Skeleton";
import { useParams, useRouter } from "next/navigation";

// Tipos mejorados
type Module = {
  id: string;
  title: string;
  description: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById: string;
};

type Activity = {
  id: string;
  title: string;
  type: string;
  difficulty: string;
  points: number;
  timeLimit: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  topic: { id: string; title: string };
};

type DashboardStats = {
  count: number;
};

type ApiResponse<T> = {
  data: T;
  modules?: Module[]; // Corregido para que coincida con el uso en fetchModules
};

type LoadingState = {
  activities: boolean;
  modules: boolean;
  stats: boolean;
};

type ErrorState = {
  activities: string | null;
  modules: string | null;
  stats: string | null;
};

export default function Dashboard() {
  const { user } = useUserStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<LoadingState>({
    activities: true,
    modules: true,
    stats: true,
  });
  const [error, setError] = useState<ErrorState>({
    activities: null,
    modules: null,
    stats: null,
  });
  const router = useRouter();

  // Formateador de fechas
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, []);

  // Manejo de errores mejorado
  const handleApiError = (type: keyof ErrorState, err: unknown) => {
    console.error(`Error obteniendo ${type}:`, err);
    const errorMessage =
      err instanceof AxiosError
        ? err.response?.data?.message || `Error cargando ${type}`
        : `Error inesperado cargando ${type}`;

    setError((prev) => ({ ...prev, [type]: errorMessage }));
    return null;
  };

  const fetchData = useCallback(
    async <T,>(endpoint: string, type: keyof LoadingState): Promise<T | null> => {
      try {
        setLoading((prev) => ({ ...prev, [type]: true }));
        const response = await axios.get<ApiResponse<T>>(endpoint);
        setError((prev) => ({ ...prev, [type]: null }));
        return response.data.data;
      } catch (err) {
        return handleApiError(type, err);
      } finally {
        setLoading((prev) => ({ ...prev, [type]: false }));
      }
    },
    []
  );

  const fetchStats = useCallback(async () => {
    const data = await fetchData<DashboardStats>("/api/master", "stats");
    console.log(data);
    
    if (data) setStats(data);
  }, [fetchData]);

  const fetchModules = useCallback(async () => {
    if (!user?.id) return;
    const data = await fetchData<{modules: Module[]}>(`/api/module?page=1&limit=10&userId=${user.id}`, "modules");
    if (data && data.modules) setModules(data.modules);
  }, [fetchData]);

  const fetchActivities = useCallback(async () => {
    if (!user?.id) return;
    const data = await fetchData<Activity[]>(
      `/api/activities?createdById=${user.id}`,
      "activities"
    );
    if (data) setActivities(data);
  }, [user?.id, fetchData]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.allSettled([
          fetchStats(), 
          user?.id ? fetchModules() : Promise.resolve(), 
          user?.id ? fetchActivities() : Promise.resolve()
        ]);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      }
    };

    loadData();
  }, [fetchStats, fetchModules, fetchActivities, user?.id]);

  function navigateToActivity(id: string) {
    router.push(`/pages/dashboard/activities/${id}`);
  }

  function navigateToModule(id: string) {
    router.push(`/pages/dashboard/module/${id}`);
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header with gradient */}
      <header className="p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-md sm:shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
              Panel de Control
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1 sm:mt-2">
              Bienvenido, {user?.name || "Usuario"}
            </p>
          </div>
  
          {stats && (
            <div className="w-full sm:w-auto mt-3 sm:mt-0">
              <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm px-4 py-2 sm:px-6 sm:py-3 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-lg">👥</span>
                  <span className="font-semibold text-base sm:text-lg">
                    {stats?.count.toLocaleString()}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                    usuarios activos
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
  
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Modules */}
        <section className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-sm sm:shadow-md border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md sm:hover:shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-blue-600 dark:text-blue-400 text-xl">📚</span>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                Módulos de Aprendizaje
              </h2>
            </div>
            {!loading.modules && modules.length > 0 && (
              <span className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 sm:px-3 py-1 rounded-full">
                {modules.length} módulos
              </span>
            )}
          </div>
  
          {loading.modules ? (
            <div className="space-y-3 sm:space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 sm:h-20 w-full rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse"></div>
              ))}
            </div>
          ) : error.modules ? (
            <div className="text-center p-4 sm:p-6 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
              <p className="text-red-500 dark:text-red-400 font-medium mb-3">{error.modules}</p>
              <button 
                onClick={fetchModules}
                className="px-3 sm:px-4 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reintentar
              </button>
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center p-6 sm:p-8 space-y-3 sm:space-y-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-600">
              <span className="text-3xl sm:text-4xl text-gray-400 dark:text-gray-500">📖</span>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No hay módulos disponibles</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {modules.map((module) => (
                <div 
                  key={module.id}
                  onClick={() => navigateToModule(module.id)}
                  className="p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center flex-wrap gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                    <span className="text-lg sm:text-xl">📘</span>
                    <h3 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">{module.title}</h3>
                    <span className={`ml-auto text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full ${
                      module.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {module.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{module.description}</p>
                  <div className="mt-2 sm:mt-3 flex justify-between items-center text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                    <span>Actualizado: {formatDate(module.updatedAt)}</span>  
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
  
        {/* Activities */}
        <section className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-sm sm:shadow-md border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md sm:hover:shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-emerald-600 dark:text-emerald-400 text-xl">✍️</span>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                Tus Actividades
              </h2>
            </div>
            {!loading.activities && activities.length > 0 && (
              <span className="text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 sm:px-3 py-1 rounded-full">
                {activities.length} actividades
              </span>
            )}
          </div>
  
          {loading.activities ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 sm:h-16 w-full rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse"></div>
              ))}
            </div>
          ) : error.activities ? (
            <div className="text-center p-4 sm:p-6 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
              <p className="text-red-500 dark:text-red-400 font-medium mb-3">{error.activities}</p>
              <button 
                onClick={fetchActivities}
                className="px-3 sm:px-4 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reintentar
              </button>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center p-6 sm:p-8 space-y-3 sm:space-y-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-600">
              <span className="text-3xl sm:text-4xl text-gray-400 dark:text-gray-500">📝</span>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No has creado actividades aún</p>
              <button
                onClick={() => router.push('/pages/dashboard/activities/create')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors mt-2"
              >
                Crear actividad
              </button>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  onClick={() => navigateToActivity(activity.id)}
                  className="p-3 sm:p-4 border rounded-lg shadow-sm hover:shadow-md transition-all dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer"
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className={`p-1.5 sm:p-2 rounded-lg mt-0.5 ${
                      activity.type === 'MATCHING' ? 'bg-blue-200 dark:bg-blue-900/30' :
                      activity.type === 'WORD_SEARCH' ? 'bg-purple-200 dark:bg-purple-900/30' :
                      'bg-emerald-100 dark:bg-emerald-900/30'
                    }`}>
                      <span className="text-base sm:text-lg">
                        {activity.type === 'MATCHING' ? '📝' : 
                         activity.type === 'WORD_SEARCH' ? '📄' : '✏️'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base line-clamp-1">
                        {activity.title}
                      </h3>
                      <div className="flex flex-wrap justify-between items-center mt-1.5 sm:mt-2 gap-1.5">
                        <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <span className="hidden sm:inline">🏷️</span>
                          {activity.topic?.title || 'Sin tema'}
                        </span>
                        <span className={`text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full font-medium ${
                          activity.type === 'quiz' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' :
                          activity.type === 'tarea' ? 'bg-purple-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200' :
                          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
                        }`}>
                          {activity.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}