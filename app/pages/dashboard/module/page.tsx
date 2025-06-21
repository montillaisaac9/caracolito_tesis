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

export default function ModulesAdmin() {
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleData | null>(null);
  const { user } = useUserStore();
  const router = useRouter();
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(1);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const canEditDelete = user?.role === 'ADMIN' || user?.role === 'TEACHER';

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/module?page=${page}&limit=${limit}`);
      
      if (response.status === 200) {
        const data = response.data.data;
        setModules(data.modules || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
        setHasNextPage(data.hasNextPage || false);
        setHasPrevPage(data.hasPrevPage || false);
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
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
    
    if (!validateForm()) return;
    
    try {
      setFormLoading(true);
      await api.post("/module", {
        title: title.trim(),
        description: description.trim(),
        order,
        isActive: true,
        createdById: user?.id,
      });
      
      await fetchModules();
      handleCloseModal();
      alert('Módulo creado exitosamente');
    } catch (error) {
      console.error("Error creating module:", error);
      alert('Error al crear el módulo');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingModule || !validateForm()) return;
    
    try {
      setFormLoading(true);
      await api.patch(`/module/${editingModule.id}`, {
        title: title.trim(),
        description: description.trim(),
        order,
      });
      
      await fetchModules();
      closeEditModal();
      alert('Módulo actualizado exitosamente');
    } catch (error) {
      console.error('Error updating module:', error);
      alert('Error al actualizar el módulo');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este módulo? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      setLoading(true);
      await api.delete(`/module/${moduleId}`);
      await fetchModules();
      alert('Módulo eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting module:', error);
      alert('Error al eliminar el módulo');
    } finally {
      setLoading(false);
    }
  };

  const handleEditModule = (module: ModuleData) => {
    setEditingModule(module);
    setTitle(module.title);
    setDescription(module.description);
    setOrder(module.order);
    setIsEditModalOpen(true);
  };

  const handleRowClick = (moduleId: string) => {
    router.push(`/pages/dashboard/module/${moduleId}`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTitle("");
    setDescription("");
    setOrder(1);
    setFormErrors({});
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingModule(null);
    setTitle("");
    setDescription("");
    setOrder(1);
    setFormErrors({});
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const renderActionButtons = (module: ModuleData) => {
    if (!canEditDelete) return null;
    
    return (
      <div className="flex space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEditModule(module);
          }}
          className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
        >
          Editar
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteModule(module.id);
          }}
          className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
        >
          Eliminar
        </button>
      </div>
    );
  };

  const renderCreateButton = () => {
    if (!canEditDelete) return null;
    
    return (
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
      >
        + Nuevo Módulo
      </button>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Spinner isLoading={loading} />
      
      {/* Header */}
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
          {renderCreateButton()}
        </div>
      </div>

      {/* Create Module Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Nuevo Módulo</h2>
              <form onSubmit={handleCreateModule}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                    {formErrors.title && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-2 border rounded-md"
                      rows={3}
                      required
                    />
                    {formErrors.description && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                    <input
                      type="number"
                      value={order}
                      onChange={(e) => setOrder(Number(e.target.value))}
                      className="w-full p-2 border rounded-md"
                      min={1}
                      required
                    />
                    {formErrors.order && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.order}</p>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={formLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    disabled={formLoading}
                  >
                    {formLoading ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Module Modal */}
      {isEditModalOpen && editingModule && (
        <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Editar Módulo</h2>
              <form onSubmit={handleUpdateModule}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                    {formErrors.title && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-2 border rounded-md"
                      rows={3}
                      required
                    />
                    {formErrors.description && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                    <input
                      type="number"
                      value={order}
                      onChange={(e) => setOrder(Number(e.target.value))}
                      className="w-full p-2 border rounded-md"
                      min={1}
                      required
                    />
                    {formErrors.order && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.order}</p>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={formLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    disabled={formLoading}
                  >
                    {formLoading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modules Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-4 px-6 text-left font-semibold">Título</th>
              <th className="py-4 px-6 text-left font-semibold">Descripción</th>
              <th className="py-4 px-6 text-left font-semibold">Orden</th>
              <th className="py-4 px-6 text-left font-semibold">Estado</th>
              {canEditDelete && (
                <th className="py-4 px-6 text-left font-semibold">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody>
            {modules.length === 0 ? (
              <tr>
                <td colSpan={canEditDelete ? 5 : 4} className="text-center py-8 text-gray-500">
                  {loading ? "Cargando módulos..." : "No hay módulos disponibles"}
                </td>
              </tr>
            ) : (
              modules.map((module) => (
                <tr 
                  key={module.id} 
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRowClick(module.id)}
                >
                  <td className="py-4 px-6 font-medium text-gray-900">{module.title}</td>
                  <td className="py-4 px-6 text-gray-700">
                    {module.description?.length > 50 
                      ? `${module.description.substring(0, 50)}...` 
                      : module.description || 'Sin descripción'}
                  </td>
                  <td className="py-4 px-6 text-gray-700">{module.order}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      module.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {module.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  {canEditDelete && (
                    <td 
                      className="py-4 px-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {renderActionButtons(module)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <button
            disabled={!hasPrevPage || loading}
            onClick={() => handlePageChange(page - 1)}
            className="px-3 py-2 border rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          
          {getPageNumbers().map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`px-3 py-2 border rounded-md ${
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
            className="px-3 py-2 border rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      )}
      
      {totalCount > 0 && (
        <div className="mt-4 text-center text-sm text-gray-600">
          Página {page} de {totalPages} • Total: {totalCount} módulos
        </div>
      )}
    </div>
  );
}