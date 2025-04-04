export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  timestamp: string;
}

export interface CreateModuleResponse {
  id: string;
  title: string;
  description: string;
  order: number;
  isActive: boolean;
  createdAt: string; // Puede usar Date si desea trabajar directamente con objetos de fecha.
  updatedAt: string; // También se puede cambiar a Date si se requiere.
  createdById: string;
}

