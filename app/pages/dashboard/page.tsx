// app/dashboard/page.tsx
"use client"
import { useCallback, useEffect, useState } from "react";
import DashboardCard from "@/app/components/ui/common/card";
import ModuleCard from "@/app/components/ui/common/moduleCard";
import useUserStore from "@/app/stores/useUserStore";
import axios from "axios";
import { Activity, Module, DashboardStats } from "@/app/types";

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

  // Formateador de fechas
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  }, []);

  // Función para manejar errores de API
  const handleApiError = (type: keyof typeof error, err: any) => {
    console.error(`Error obteniendo ${type}:`, err);
    setError(prev => ({ ...prev, [type]: `Error cargando ${type}` }));
    return null;
  };

  // Función genérica para fetch data
  const fetchData = useCallback(async <T,>(
    endpoint: string,
    type: keyof typeof loading
  ): Promise<T | null> => {
    try {
      const response = await axios.get(endpoint);
      setError(prev => ({ ...prev, [type]: null }));
      return response.data;
    } catch (err) {
      return handleApiError(type, err);
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  }, []);

  // Obtener estadísticas
  const fetchStats = useCallback(async () => {
    const data = await fetchData<DashboardStats>("/api/master", "stats");
    if (data) setStats(data);
  }, [fetchData]);

  // Obtener módulos
  const fetchModules = useCallback(async () => {
    const data = await fetchData<{ data: Module[] }>("/api/module?page=1&limit=10", "modules");
    if (data) setModules(data.data);
  }, [fetchData]);

  // Obtener actividades
  const fetchActivities = useCallback(async () => {
    if (!user?.id) return;
    const data = await fetchData<{ data: Activity[] }>(
      `/api/activities?createdById=${user.id}`,
      "activities"
    );
    if (data) setActivities(data.data);
  }, [user?.id, fetchData]);

  // Cargar todos los datos
  useEffect(() => {
    const loadData = async () => {
      await Promise.allSettled([
        fetchStats(),
        fetchModules(),
        fetchActivities()
      ]);
    };
    
    loadData();
  }, [fetchStats, fetchModules, fetchActivities]);

  // Componente de carga optimizado
  const LoadingSkeleton = ({ count = 1, height = 'h-4' }: { count?: number, height?: string }) => (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${height} bg-gray-200 rounded w-full`}></div>
      ))}
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Encabezado */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Panel de Control</h1>
          {stats && (
            <p className="text-sm text-gray-500 mt-1">
              Última actualización: {formatDate(stats.lastUpdated)}
            </p>
          )}
        </div>
        {stats && (
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <span className="font-medium text-blue-800">Usuarios activos: {stats.count}</span>
          </div>
        )}
      </header>

      {/* Tarjetas de estadísticas */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading.stats ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-xl shadow-sm h-36 flex items-center">
              <LoadingSkeleton count={3} />
            </div>
          ))
        ) : error.stats ? (
          <div className="col-span-full text-center py-8 text-red-500 bg-red-50 rounded-xl">
            {error.stats}
          </div>
        ) : stats ? (
          <>
            <DashboardCard 
              title="Total de Usuarios" 
              value={stats.totalUsers}
              trend={stats.userGrowth}
              icon="users"
            />
            <DashboardCard 
              title="Actividades Completadas" 
              value={stats.completedActivities}
              trend={stats.completionRate}
              icon="activities"
            />
            <DashboardCard 
              title="Módulos Activos" 
              value={stats.activeModules}
              trend={stats.moduleEngagement}
              icon="modules"
            />
          </>
        ) : null}
      </section>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Módulos de aprendizaje */}
        <section className="bg-white p-5 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-semibold text-gray-800">Módulos de Aprendizaje</h2>
            {!loading.modules && modules.length > 0 && (
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {modules.length} módulos
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
            <div className="text-center py-8 text-red-500 bg-red-50 rounded-lg">
              {error.modules}
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">No hay módulos disponibles</div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Crear nuevo módulo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* {modules?modules.map((module) => (
                <ModuleCard 
                  key={module.id}
                  id={module.id}
                  title={module.title}
                  description={module.description}
                  progress={module.progress}
                  activitiesCount={module.activitiesCount}
                />
              )):[]} */}
            </div>
          )}
        </section>

        {/* Actividades recientes */}
        <section className="bg-white p-5 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-semibold text-gray-800">Tus Actividades</h2>
            <div className="flex items-center gap-2">
              {!loading.activities && activities.length > 0 && (
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {activities.length} actividades
                </span>
              )}
              <button 
                onClick={fetchActivities}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Recargar actividades"
                disabled={loading.activities}
              >
                <RefreshIcon loading={loading.activities} />
              </button>
            </div>
          </div>

          {loading.activities ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : error.activities ? (
            <div className="text-center py-8 text-red-500 bg-red-50 rounded-lg">
              {error.activities}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">No has creado actividades aún</div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Crear primera actividad
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <ActivityCard 
                  key={activity.id}
                  activity={activity}
                  onRefresh={fetchActivities}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// Componente de tarjeta de actividad optimizado
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
    <article className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 truncate">{activity.title}</h3>
          <p className="text-sm text-gray-600 truncate">
            Tema: <span className="font-medium">{activity.topic.title}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          <ActivityBadge type={activity.type} />
          <DifficultyBadge difficulty={activity.difficulty} />
        </div>
      </div>

      <div className="mt-3 flex justify-between items-center">
        <div className="flex gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <StarIcon />
            <span className="ml-1">{activity.points} pts</span>
          </div>
          <div className="flex items-center">
            <ClockIcon />
            <span className="ml-1">{activity.timeLimit} seg</span>
          </div>
        </div>
        <div className="flex gap-1">
          <IconButton 
            onClick={handleDelete}
            loading={isDeleting}
            icon="trash"
            color="red"
            ariaLabel="Eliminar actividad"
          />
          <IconButton 
            icon="edit"
            color="blue"
            ariaLabel="Editar actividad"
          />
        </div>
      </div>
    </article>
  );
};

// Componentes pequeños reutilizables
const ActivityBadge = ({ type }: { type: string }) => {
  const typeText = type.toLowerCase().replace('_', ' ');
  return (
    <span className={`text-xs px-2 py-1 rounded-full capitalize ${getActivityTypeColor(type)}`}>
      {typeText}
    </span>
  );
};

const DifficultyBadge = ({ difficulty }: { difficulty: string }) => {
  return (
    <span className={`text-xs px-2 py-1 rounded-full capitalize ${getDifficultyColor(difficulty)}`}>
      {difficulty.toLowerCase()}
    </span>
  );
};

const IconButton = ({ 
  icon, 
  color, 
  loading = false, 
  onClick, 
  ariaLabel 
}: { 
  icon: 'trash' | 'edit' | 'refresh',
  color: 'red' | 'blue' | 'gray',
  loading?: boolean,
  onClick?: () => void,
  ariaLabel: string
}) => {
  const colorClasses = {
    red: 'text-gray-500 hover:text-red-500',
    blue: 'text-gray-500 hover:text-blue-500',
    gray: 'text-gray-500 hover:text-gray-700'
  };

  const icons = {
    trash: <TrashIcon />,
    edit: <EditIcon />,
    refresh: <RefreshIcon loading={loading} />
  };

  return (
    <button 
      onClick={onClick}
      disabled={loading}
      className={`p-1.5 rounded-full transition-colors ${colorClasses[color]}`}
      aria-label={ariaLabel}
    >
      {icons[icon]}
    </button>
  );
};

// Iconos SVG como componentes
const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const RefreshIcon = ({ loading = false }: { loading?: boolean }) => (
  loading ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
);

// Funciones auxiliares para estilos
const getActivityTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    WORD_SEARCH: "bg-purple-100 text-purple-800",
    MATCHING: "bg-blue-100 text-blue-800",
    QUIZ: "bg-green-100 text-green-800",
    FLASHCARDS: "bg-orange-100 text-orange-800",
    CROSSWORD: "bg-indigo-100 text-indigo-800"
  };
  return colors[type] || "bg-gray-100 text-gray-800";
};

const getDifficultyColor = (difficulty: string) => {
  const colors: Record<string, string> = {
    BEGINNER: "bg-green-100 text-green-800",
    INTERMEDIATE: "bg-yellow-100 text-yellow-800",
    ADVANCED: "bg-red-100 text-red-800"
  };
  return colors[difficulty] || "bg-gray-100 text-gray-800";
};