// Interfaz para el modelo Activity

// {
//     "title": "Curso de Introducción a Prisma",
//     "type": "LEARNING", 
//     "difficulty": "BEGINNER",
//     "config": {
//       "language": "ES",
//       "requirements": ["Computadora", "Conexión a Internet"]
//     },
//     "points": 15,
//     "timeLimit": 120,
//     "isActive": true,
//     "topicId": "abc123",
//     "createdById": "user567"
//   }



// model Activity {
//     id          String          @id @default(cuid())
//     title       String
//     type        ActivityType
//     difficulty  DifficultyLevel @default(BEGINNER)
//     config      Json
//     points      Int             @default(10)
//     timeLimit   Int?
//     isActive    Boolean         @default(true)
//     createdAt   DateTime        @default(now())
//     updatedAt   DateTime        @updatedAt
//     topicId     String
//     createdById String
//     createdBy   User            @relation("CreatedBy", fields: [createdById], references: [id])
//     topic       Topic           @relation(fields: [topicId], references: [id])
//     progress    Progress[]
//   }

import { UserDTO } from "./register";

export interface Activity {
    title: string; // Título de la actividad
    type: string; // Tipo de actividad, puede ser enum como ActivityType
    difficulty: string; // Nivel de dificultad, puede ser enum como DifficultyLevel
    config: Record<string, any>; // Configuración en formato JSON
    points: number; // Puntos asignados a la actividad
    timeLimit?: number; // Límite de tiempo en segundos (opcional)
    isActive: boolean; // Indica si la actividad está activa
    topicId: string; // ID del tema relacionado
    createdById: string; // ID del usuario que creó la actividad
    createdBy?: UserDTO; // Objeto User (opcional, depende de la relación)
    topic?: Topic; // Objeto Topic (opcional, depende de la relación)
    progress?: Progress[]; // Lista de progresos relacionados (opcional)
  }
  
  // Interfaz para el modelo Progress
export interface Progress {
    score: number; // Puntuación obtenida, valor por defecto: 0
    completed: boolean; // Indica si la actividad fue completada, por defecto: false
    timeSpent?: number; // Tiempo dedicado en segundos (opcional)
    attempts: number; // Número de intentos realizados, por defecto: 0
    lastAttempt?: Date; // Fecha del último intento (opcional)
    feedback?: string; // Retroalimentación sobre el progreso (opcional)
    studentId: string; // ID del estudiante relacionado (clave foránea)
    activityId: string; // ID de la actividad relacionada (clave foránea)
    activity?: Activity; // Objeto Activity relacionado (opcional)
    student?: UserDTO; // Objeto User relacionado (opcional)
  }
  
  
  // Interfaz para el modelo Topic
  export interface Topic {
    name: string; // Nombre del tema
    description?: string; // Descripción del tema (opcional)
  }
  