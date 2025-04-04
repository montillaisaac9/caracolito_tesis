"use client";
import Spinner from "@/app/components/ui/common/progresBar";
import api from "@/app/utils/api";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Topic {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  moduleId: string;
  order: number;
}

interface Module {
  id: string;
  title: string;
  createdAt: string;
  createdById: string;
  description: string;
  isActive: boolean;
  order: number;
  updatedAt: string;
  topics: Topic[];
}

export default function ModulePage() {
  const params = useParams();
  const moduleId = params?.id as string;
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  
  // Estados para el formulario de tópico
  const [topicTitle, setTopicTitle] = useState("");
  const [topicContent, setTopicContent] = useState("");
  const [topicOrder, setTopicOrder] = useState(1);

  const fetchModule = async () => {
    try {
      setLoading(true);
      setError(null);
     
      const response = await api.get(`/module/id?id=${moduleId}`);
      if (response.status === 200 && response.data.data?.length > 0) {
        setModule(response.data.data[0]);
      } else {
        setError("No se encontró el módulo solicitado");
      }
    } catch (error) {
      console.error("Error obteniendo el módulo:", error);
      setError("Error al cargar los datos del módulo");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post("/topics", {
        title: topicTitle,
        content: topicContent,
        order: topicOrder,
        isActive: true,
        moduleId: moduleId
      });
      
      // Resetear formulario
      setTopicTitle("");
      setTopicContent("");
      setTopicOrder(1);
      setIsTopicModalOpen(false);
      
      // Recargar módulo para ver los cambios
      fetchModule();
    } catch (error) {
      console.error("Error al crear tópico:", error);
      setError("Error al crear el tópico");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (moduleId) {
      fetchModule();
    }
  }, [moduleId]);

  if (loading && !module) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner isLoading={true}/>
      </div>
    );
  }

  if (error && !module) {
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
        <h1 className="text-2xl font-bold">Detalles del Módulo</h1>
        <button
          onClick={() => setIsTopicModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          + Nuevo Tópico
        </button>
      </div>
      
      {module ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">{module.title}</h2>
              <p className="mb-2 text-gray-700">{module.description}</p>
              <div className="mt-4 text-sm text-gray-500">
                <p>ID: {module.id}</p>
                <p>Creado por: {module.createdById}</p>
                <p>Fecha de creación: {new Date(module.createdAt).toLocaleString()}</p>
                <p>Última actualización: {new Date(module.updatedAt).toLocaleString()}</p>
                <p>Estado: {module.isActive ? 
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Activo</span> : 
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Inactivo</span>}
                </p>
              </div>
            </div>
          </div>
          
          {/* Mostrar los tópicos asociados */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Tópicos ({module.topics?.length || 0})</h3>
            </div>
            
            {module.topics && module.topics.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {module.topics.map((topic) => (
                  <div key={topic.id} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-lg">{topic.title}</h4>
                      <span className="text-sm text-gray-500">Orden: {topic.order}</span>
                    </div>
                    <div className="my-2 border-t border-gray-200 pt-2">
                      <p className="whitespace-pre-wrap">{topic.content}</p>
                    </div>
                    <div className="mt-2 flex justify-between text-sm text-gray-500">
                      <span>Creado: {new Date(topic.createdAt).toLocaleString()}</span>
                      <span>{topic.isActive ? 'Activo' : 'Inactivo'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No hay tópicos disponibles para este módulo.</p>
            )}
          </div>
        </div>
      ) : (
        <p>No hay datos disponibles para mostrar.</p>
      )}
      
      {/* Modal para crear tópicos */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg px-6 py-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Crear Tópico</h2>
              <button 
                onClick={() => setIsTopicModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTopic} className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  placeholder="Título del tópico"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
                <textarea
                  placeholder="Contenido del tópico"
                  value={topicContent}
                  onChange={(e) => setTopicContent(e.target.value)}
                  className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  rows={6}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                <input
                  type="number"
                  placeholder="Orden"
                  value={topicOrder}
                  onChange={(e) => setTopicOrder(Number(e.target.value))}
                  className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  disabled={loading}
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