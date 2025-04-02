// app/module/[id]/page.tsx
"use client";

import Spinner from "@/app/components/ui/common/progresBar";
import api from "@/app/utils/api";
import { useEffect, useState } from "react";
import useUserStore from "@/app/stores/useUserStore";
import { useParams } from "next/navigation";

export default function ModulePage() {
  // Obtenemos el id de los parámetros de la URL
  const params = useParams();
  const moduleId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUserStore();
  const [module, setModule] = useState(null);

  // Función para obtener los datos del módulo
  const fetchModule = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Hacemos la petición con el ID como parámetro de consulta
      const response = await api.get(`/api/module?id=${moduleId}`);
      
      if (response.status === 200 && response.data.data?.length > 0) {
        // Obtenemos el primer módulo del array de datos
        console.log(response.data.data[0]);
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

  useEffect(() => {
    if (moduleId) {
      fetchModule();
    }
  }, [moduleId]);

  // Mostramos un spinner mientras carga
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  // Mostramos un mensaje de error si ocurrió algún problema
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // Mostramos los datos del módulo si está disponible
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Detalles del Módulo</h1>
      
      {module ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">ID: {module.id}</h2>
          {module.name && (
            <p className="mb-2"><span className="font-medium">Nombre:</span> {module.name}</p>
          )}
          {/* Renderiza aquí el resto de los campos del módulo */}
        </div>
      ) : (
        <p>No hay datos disponibles para mostrar.</p>
      )}
    </div>
  );
}