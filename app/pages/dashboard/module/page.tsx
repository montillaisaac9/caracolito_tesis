"use client";
import Spinner from "@/app/components/ui/common/progresBar";
import api from "@/app/utils/api";
import { useEffect, useState, useCallback } from "react";
import useUserStore from "@/app/stores/useUserStore";
import { useRouter } from "next/navigation";

interface ModuleData {
  id: string;
  title: string;
  description: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById: string;
}

interface PaginationData {
  modules: ModuleData[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ApiResponse {
  status: number;
  data: PaginationData;
  message?: string;
}

export default function ModulesAdmin() {
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const { user } = useUserStore();
  const router = useRouter();
  
  // Estados para el formulario
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(1);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/module?page=${page}&limit=${limit}`);
      
      if (response.status === 200) {
        const data: PaginationData = response.data.data;
        
        // Actualizar todos los estados de paginación
        setModules(data.modules || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
        setHasNextPage(data.hasNextPage || false);
        setHasPrevPage(data.hasPrevPage || false);
      }
    } catch (error) {
      console.error("Error obteniendo módulos:", error);
      setModules([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);
  
  useEffect(() => {
    fetchModules();
  }, [fetchModules]);
  
  // Validación del formulario
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!title.trim()) {
      errors.title = "El título es requerido";
    } else if (title.trim().length < 3) {
      errors.title = "El título debe tener al menos 3 caracteres";
    }
    
    if (!description.trim()) {
      errors.description = "La descripción es requerida";
    } else if (description.trim().length < 10) {
      errors.description = "La descripción debe tener al menos 10 caracteres";
    }
    
    if (order < 1) {
      errors.order = "El orden debe ser mayor a 0";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setFormLoading(true);
      if (user) {
        const response = await api.post("/module", {
          title: title.trim(),
          description: description.trim(),
          order,
          isActive: true,
          createdById: user.id,
        });
        
        if (response.status === 200 || response.status === 201) {
          // Resetear formulario
          setTitle("");
          setDescription("");
          setOrder(1);
          setFormErrors({});
          setIsModalOpen(false);
          
          // Si estamos en la última página y hay espacio, mantener la página
          // Si no, ir a la primera página para ver el nuevo módulo
          if (modules.length < limit) {
            fetchModules();
          } else {
            setPage(1);
          }
        }
      }
    } catch (error: any) {
      console.error("Error al crear módulo:", error);
      
      // Manejar errores específicos del backend
      if (error.response?.data?.message) {
        setFormErrors({ general: error.response.data.message });
      } else {
        setFormErrors({ general: "Error al crear el módulo. Intente nuevamente." });
      }
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTitle("");
    setDescription("");
    setOrder(1);
    setFormErrors({});
  };
  
  function navigate(id: string) {
    router.push(`/pages/dashboard/module/${id}`);
  }
  
  // Función para cambiar página
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };
  
  // Generar números de página para mostrar
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    // Ajustar el inicio si estamos cerca del final
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };
  
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Spinner isLoading={loading} />
      
      {/* Header con estadísticas */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Módulos</h1>
            <p className="text-gray-600">
              {totalCount > 0 
                ? `Mostrando ${modules.length} de ${totalCount} módulos`
                : "No hay módulos disponibles"
              }
            </p>
          </div>
          {user?.role !== "STUDENT" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              Crear Módulo
            </button>
          )}
        </div>
      </div>

      {/* Modal para crear módulos */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white w-full max-w-md rounded-lg shadow-xl mx-4">
            <div className="px-6 py-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Crear Módulo</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                  disabled={formLoading}
                >
                  ×
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreateModule} className="p-6">
              {formErrors.general && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {formErrors.general}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Título del módulo"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={formLoading}
                  />
                  {formErrors.title && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
                  )}
                </div>
                
                <div>
                  <textarea
                    placeholder="Descripción del módulo"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className={`w-full border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                      formErrors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={formLoading}
                  />
                  {formErrors.description && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                  )}
                </div>
                
                <div>
                  <input
                    type="number"
                    placeholder="Orden"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    min="1"
                    className={`w-full border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.order ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={formLoading}
                  />
                  {formErrors.order && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.order}</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={formLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={formLoading}
                >
                  {formLoading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla de módulos */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-4 px-6 text-left font-semibold">Título</th>
              <th className="py-4 px-6 text-left font-semibold">Descripción</th>
              <th className="py-4 px-6 text-left font-semibold">Orden</th>
              <th className="py-4 px-6 text-left font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {!modules || modules.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  {loading ? "Cargando módulos..." : "No hay módulos disponibles"}
                </td>
              </tr>
            ) : (
              modules.map((mod, index) => (
                <tr 
                  key={mod.id || index} 
                  onClick={() => navigate(mod.id)} 
                  className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="py-4 px-6 font-medium text-gray-900">{mod.title}</td>
                  <td className="py-4 px-6 text-gray-700">
                    {mod.description.length > 100 
                      ? `${mod.description.substring(0, 100)}...` 
                      : mod.description
                    }
                  </td>
                  <td className="py-4 px-6 text-gray-700">{mod.order}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      mod.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {mod.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación mejorada */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <button
            disabled={!hasPrevPage || loading}
            onClick={() => handlePageChange(page - 1)}
            className="px-3 py-2 border rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          
          {/* Números de página */}
          {getPageNumbers().map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`px-3 py-2 border rounded-md transition-colors ${
                pageNum === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {pageNum}
            </button>
          ))}
          
          <button
            disabled={!hasNextPage || loading}
            onClick={() => handlePageChange(page + 1)}
            className="px-3 py-2 border rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}
      
      {/* Información adicional de paginación */}
      {totalCount > 0 && (
        <div className="mt-4 text-center text-sm text-gray-600">
          Página {page} de {totalPages} • Total: {totalCount} módulos
        </div>
      )}
    </div>
  );
}