"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { z } from "zod";
import Input from "@/app/components/ui/common/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/authentication/cards";
import RadioButton from "@/app/components/ui/common/radioButton";
import Spinner from "@/app/components/ui/common/progresBar";
import api from "@/app/utils/api";

// Tipos
interface User {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  createdAt?: string;
}

interface PaginationData {
  modules: User[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ApiResponse {
  status: number;
  data: PaginationData;
  message?: string;
}


// Zod schema
const userSchema = z.object({
  firstName: z.string().min(3),
  lastName: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
});

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<"ADMIN" | "STUDENT" | "TEACHER" | "ALL">("STUDENT");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "STUDENT" as "STUDENT" | "TEACHER" | "ADMIN",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Resetear página al cambiar de rol
    setCurrentPage(1);
  }, [selectedRole]);

  useEffect(() => {
    let filtered = selectedRole === "ALL" ? users : users.filter(u => u.role === selectedRole);
    const total = filtered.length;
    const pages = Math.ceil(total / itemsPerPage);
    setTotalPages(pages);

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    setFilteredUsers(filtered.slice(start, end));
  }, [users, selectedRole, currentPage, itemsPerPage]);

  const fetchUsers = useCallback(async () => {
  try {
    setLoadingUsers(true);
    const response = await api.get(`/users?page=${currentPage}&limit=${itemsPerPage}`);

    if (response.status === 200) {
      const data: PaginationData = response.data.data;

      setUsers(data.modules || []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || 1); // por si backend ajusta
      // Puedes agregar `setTotalCount`, `setHasNextPage`, etc. si los necesitas más adelante
    } else {
      setUsers([]);
      setTotalPages(1);
    }
  } catch (error) {
    console.error("Error al cargar usuarios:", error);
    setUsers([]);
    setTotalPages(1);
  } finally {
    setLoadingUsers(false);
  }
}, [currentPage, itemsPerPage]);

// Ejecutar cuando cambia la página
useEffect(() => {
  fetchUsers();
}, [fetchUsers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ firstName: "", lastName: "", email: "", password: "", role: "STUDENT" });
    setErrors({});
  };

  const openModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const openDetailsModal = (user: User) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      userSchema.parse(formData);
      setErrors({});
      setLoading(true);

      const response = await axios.post("/api/auth/register", formData);
      if (response.status === 200 || response.status === 201) {
        closeModal();
        fetchUsers();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        error.errors.forEach(err => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
      } else if (axios.isAxiosError(error)) {
        console.error("Error en la petición:", error.response?.data || error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <Spinner isLoading={loading} />

      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-black text-3xl font-bold mb-2">Gestión de Usuarios</h1>
          <p className="text-black text-sm mb-8">Entorno de Aprendizaje Interactivo - UNERG</p>
        </div>

        {/* Filtros y acción */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedRole("ALL")}
              className={`px-4 py-2 rounded-md ${selectedRole === "ALL" ? "bg-green-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            >
              Todos ({users?.length || 0})
            </button>
            <button
              onClick={() => setSelectedRole("STUDENT")}
              className={`px-4 py-2 rounded-md ${selectedRole === "STUDENT" ? "bg-green-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            >
              Estudiantes ({(users?.filter(u => u.role === "STUDENT") || []).length})
            </button>
            <button
              onClick={() => setSelectedRole("TEACHER")}
              className={`px-4 py-2 rounded-md ${selectedRole === "TEACHER" ? "bg-green-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            >
              Profesores ({(users?.filter(u => u.role === "TEACHER") || []).length})
            </button>
                    <button
              onClick={() => setSelectedRole("ADMIN")}
              className={`px-4 py-2 rounded-md ${selectedRole === "ADMIN" ? "bg-green-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            >
              Administradores ({(users?.filter(u => u.role === "ADMIN") || []).length})
            </button>
          </div>

          <button onClick={openModal} className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md flex items-center gap-2">
            <span>+</span> Crear Usuario
          </button>
        </div>

        {/* Lista */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loadingUsers ? (
            <div className="col-span-full flex justify-center py-8 text-white">Cargando usuarios...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-400">No hay usuarios para mostrar</div>
          ) : (
            filteredUsers.map(user => (
              <Card
                key={user.id}
                className="cursor-pointer bg-gray-100 hover:shadow-lg transition-all duration-200 hover:scale-105 border-gray-200"
                onClick={() => openDetailsModal(user)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-black font-semibold">
                      {user.name}
                    </CardTitle>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === "ADMIN" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                     {user.role}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{user.email}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-md bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Anterior
            </button>
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 border rounded-md transition-colors ${
                    pageNum === currentPage ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-md bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>


      {/* Modal de creación de usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-800/70 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Crear Usuario</CardTitle>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                >
                  ×
                </button>
              </div>
              <CardDescription>
                Ingrese los datos para crear un nuevo usuario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="Nombre"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      type="text"
                      placeholder="Apellido"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm">{errors.lastName}</p>
                    )}
                  </div>
                </div>
                <Input
                  type="email"
                  placeholder="Correo electrónico"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
                <Input
                  type="password"
                  placeholder="Contraseña"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password}</p>
                )}

                <div className="flex justify-center my-4 space-x-[5px]">
                    <RadioButton
                    name="role"
                    label="administrador"
                    value="ADMIN"
                    checked={formData.role === "ADMIN"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as "ADMIN",
                      })
                    }
                  />
                  <RadioButton
                    name="role"
                    label="Estudiante"
                    value="STUDENT"
                    checked={formData.role === "STUDENT"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as "STUDENT",
                      })
                    }
                  />
                  <RadioButton
                    name="role"
                    label="Profesor"
                    value="TEACHER"
                    checked={formData.role === "TEACHER"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as "TEACHER",
                      })
                    }
                  />
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
                    disabled={loading}
                  >
                    {loading ? "Creando..." : "Crear Usuario"}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      {isDetailsModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md border-2 border-gray-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Detalles del Usuario</CardTitle>
                <button
                  onClick={closeDetailsModal}
                  className="text-gray-100 hover:text-gray-700 text-xl font-bold"
                >
                  ×
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-200">Nombre Completo:</label>
                <p className="text-lg text-gray-200">{selectedUser.name}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-200">Correo Electrónico:</label>
                <p className="text-lg text-gray-200">{selectedUser.email}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-200">Rol:</label>
                <span className={`mx-3 inline-block px-3 py-1 rounded-full text-gray-200 text-sm font-medium ${
                  selectedUser.role === "ADMIN" 
                    ? "bg-blue-100 text-green-950" 
                    : "bg-green-100 text-green-800"
                }`}>
                  {selectedUser.role}
                </span>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-200">ID de Usuario:</label>
                <p className="text-sm text-gray-200 font-mono">{selectedUser.id}</p>
              </div>
              {selectedUser.createdAt && (
                <div>
                  <label className="text-sm font-semibold text-gray-200">Fecha de Registro:</label>
                  <p className="text-sm text-gray-200">
                    {new Date(selectedUser.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <button
                onClick={closeDetailsModal}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-md"
              >
                Cerrar
              </button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UserManagement;