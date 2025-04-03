"use client";

import Spinner from "@/app/components/ui/common/progresBar";
import api from "@/app/utils/api";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Module {
  id: string;
  title: string;
  createdAt: string;
  createdById: string;
  description: string;
  isActive: boolean;
  order: number;
  updatedAt: string;
  topics: any[]; // Puedes definir mejor la estructura de `topics` si es necesario
}

export default function ModulePage() {
  const params = useParams();
  const moduleId = params?.id as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [module, setModule] = useState<Module | null>(null);

  const fetchModule = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/module/${moduleId}`);

      if (response.status === 200 && response.data.data?.module) {
        setModule(response.data.data.module);
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

  useEffect(() => {
    if (moduleId) {
      fetchModule();
    }
  }, [moduleId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Detalles del Módulo</h1>

      {module ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">ID: {module.id}</h2>
          <p className="mb-2"><span className="font-medium">Título:</span> {module.title}</p>
          <p className="mb-2"><span className="font-medium">Descripción:</span> {module.description}</p>
          <p className="mb-2"><span className="font-medium">Creado por:</span> {module.createdById}</p>
          <p className="mb-2"><span className="font-medium">Fecha de creación:</span> {new Date(module.createdAt).toLocaleString()}</p>
          <p className="mb-2"><span className="font-medium">Última actualización:</span> {new Date(module.updatedAt).toLocaleString()}</p>
          <p className="mb-2"><span className="font-medium">Estado:</span> {module.isActive ? "Activo" : "Inactivo"}</p>

          {module.topics.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold mt-4">Temas:</h3>
              <ul className="list-disc list-inside">
                {module.topics.map((topic, index) => (
                  <li key={index}>{topic.title}</li> // Ajusta según la estructura real de `topics`
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-2 text-gray-500">No hay temas asociados.</p>
          )}
        </div>
      ) : (
        <p>No hay datos disponibles para mostrar.</p>
      )}
    </div>
  );
}
