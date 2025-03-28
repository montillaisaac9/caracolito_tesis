"use client";

import api from "@/app/utils/api";
import { useEffect, useState, useCallback } from "react";

interface ModuleData {
  title: string;
  description: string;
  isActive?: boolean;
  order: number;
  createdById: string;
}

export default function ModulesAdmin() {
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(5); // Cantidad de módulos por página
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados para el formulario
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(1);

  const fetchModules = useCallback(async () => {
    try {
      const response = await api.get(`/modules?page=${page}&limit=${limit}`);
      setModules(response.data.modules);
      setTotalPages(Math.ceil(response.data.total / limit));
    } catch (error) {
      console.error("Error obteniendo módulos:", error);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const handleCreateModule = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    try {
      await api.post("/modules", {
        title,
        description,
        order,
        isActive: true,
        createdById: "user123", // Reemplaza con el ID real del usuario
      });

      // Resetear formulario
      setTitle("");
      setDescription("");
      setOrder(1);
      setIsModalOpen(false);
      fetchModules(); // Recargar módulos
    } catch (error) {
      console.error("Error al crear módulo:", error);
    }
  };

  return (
    <div className="p-8">
      {/* Botón para abrir el modal */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-md mb-4"
      >
        + Crear Módulo
      </button>

      {/* Modal para crear módulos */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
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
          {modules.map((mod, index) => (
            <tr key={index} className="border-b">
              <td className="py-2 px-4">{mod.title}</td>
              <td className="py-2 px-4">{mod.description}</td>
              <td className="py-2 px-4">{mod.order}</td>
            </tr>
          ))}
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

