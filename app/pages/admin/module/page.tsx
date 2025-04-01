"use client";

import Spinner from "@/app/components/ui/common/progresBar";
import api from "@/app/utils/api";
import { useEffect, useState, useCallback } from "react";
import useUserStore from "@/app/stores/useUserStore";

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

export default function ModulesAdmin() {
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(5); // Cantidad de módulos por página
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false)
  const { user } = useUserStore();

  // Estados para el formulario
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(1);

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get(`/module?page=${page}&limit=${limit}`);
      if (response.status === 200 && response.data.data?.modules) {
        // Use the modules from the nested data structure
        setModules(response.data.data.modules);
        // You might need to adjust total pages calculation based on your backend
        setTotalPages(Math.ceil(response.data.data.modules.length / limit));
      }
    } catch (error) {
      console.error("Error obteniendo módulos:", error);
      setModules([]);
    }
    finally {
      setLoading(false)
    }
  }, [page, limit]);
  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const handleCreateModule = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    try {
      setLoading(true)
      if (user){
      await api.post("/module", {
        title,
        description,
        order,
        isActive: true,
        createdById: user.id, // Reemplaza con el ID real del usuario
      });
    }

      // Resetear formulario
      setTitle("");
      setDescription("");
      setOrder(1);
      setIsModalOpen(false);
      fetchModules(); // Recargar módulos
    } catch (error) {
      console.error("Error al crear módulo:", error);
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="p-8">
      {/* Botón para abrir el modal */}
      <Spinner isLoading={loading} />
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-md mb-4"
      >
        + Crear Módulo
      </button>

      {/* Modal para crear módulos */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 bg-opacity-50">
          <div className="bg-white w-3/12 rounded-lg shadow-lg px-10 py-8">
            <h2 className="text-xl font-bold mb-4">Crear Módulo</h2>
            <form onSubmit={handleCreateModule} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Título"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border p-2 rounded"
              />
              <textarea
                placeholder="Descripción"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border p-2 rounded"
              />
              <input
                type="number"
                placeholder="Orden"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="border p-2 rounded"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla de módulos */}
      <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="py-2 px-4">Título</th>
            <th className="py-2 px-4">Descripción</th>
            <th className="py-2 px-4">Orden</th>
          </tr>
        </thead>
        <tbody>
        {!modules || modules.length === 0 ? (
          <tr>
            <td colSpan={3} className="text-center py-4">
              No hay módulos disponibles
            </td>
          </tr>
        ) : (
          modules.map((mod, index) => (
            <tr key={index} className="border-b">
              <td className="py-2 px-4">{mod.title}</td>
              <td className="py-2 px-4">{mod.description}</td>
              <td className="py-2 px-4">{mod.order}</td>
            </tr>
          ))
        )}
        </tbody>
      </table>

      {/* Paginación */}
      <div className="flex justify-center mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-3 py-1 border rounded-l bg-gray-200"
        >
          Anterior
        </button>
        <span className="px-4 py-1 border bg-white">{page}</span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-3 py-1 border rounded-r bg-gray-200"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}