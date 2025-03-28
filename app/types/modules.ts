import { UserDTO } from "./register";
import { Topic } from "./topics";
// Interfaz para el modelo Module
export interface Module {
    id: string; // Identificador único del módulo
    title: string; // Título del módulo
    createdAt: Date; // Fecha de creación
    updatedAt: Date; // Fecha de última actualización
    createdById: string; // ID del usuario que creó el módulo
    description: string; // Descripción del módulo
    isActive: boolean; // Indica si el módulo está activo
    order: number; // Orden del módulo en la lista
    createdBy?: UserDTO; // Relación con el usuario que creó el módulo (opcional)
    topics?: Topic[]; // Relación con los temas asociados al módulo (opcional)
  }
  
  
