// types/user.ts
import { Role as PrismaRole } from '@prisma/client'; // Importamos el enum Role de Prisma

// Usamos el tipo de Prisma directamente en lugar de definir nuestro propio enum
export type Role = PrismaRole;

// Interface del modelo completo (como viene de la DB)
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role; // Ahora usa el tipo de Prisma
  createdAt: Date;
  updatedAt: Date;
}

// DTO para la respuesta
export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: Role; // Ahora usa el tipo de Prisma
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role?: Role; // Ahora usa el tipo de Prisma
}

// Función para transformar User a UserDTO
export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}