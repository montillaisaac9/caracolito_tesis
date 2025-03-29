// app/dashboard/page.tsx
"use client"
import { useCallback, useEffect } from "react";
import DashboardCard from "./components/card";
import ModuleCard from "./components/moduleCard";
import axios from "axios";

export default function Dashboard() {
  const modules = [
    "Introducción a la Informática",
    "Algoritmos y Programación",
    "Estructuras de Datos",
    "Sistemas Operativos",
    "Redes y Comunicación",
  ];
  
  const fetchModules = useCallback(async () => {
    try {
      const response = await axios.get(`/api/topics`);
      console.log(response.data)
    } catch (error) {
      console.error("Error obteniendo módulos:", error);
    }
  }, []);

    useEffect(() => {
      fetchModules();
    }, [fetchModules]);
  


  return (
    <div className="p-8">

  
      <h1 className="text-3xl font-bold mb-6">Fundamentos en Informática</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <DashboardCard title="Total de usuarios" value={163} />
        <DashboardCard title="Usuarios en el tema 1" value={35} />
        <DashboardCard title="Estadísticas" value="..." />
      </div>

      <div className="bg-white shadow-md rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Módulos de Aprendizaje</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modules.map((module, index) => (
            <ModuleCard key={index} title={module} />
          ))}
        </div>
      </div>
    </div>
  );
}

