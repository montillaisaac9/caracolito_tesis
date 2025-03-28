import { Module } from "./modules";
import { Activity } from "./activities";
// Interfaz para el modelo Topic
export interface Topic {
    id: string; // Identificador único del tema
    title: string; // Título del tema
    content: string; // Contenido del tema
    order: number; // Orden del tema dentro del módulo
    isActive: boolean; // Indica si el tema está activo
    createdAt: Date; // Fecha de creación
    updatedAt: Date; // Fecha de última actualización
    moduleId: string; // ID del módulo relacionado
    activities?: Activity[]; // Lista de actividades relacionadas (opcional)
    module?: Module; // Módulo relacionado con el tema (opcional)
  }
  