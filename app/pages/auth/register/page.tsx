"use client";

import React, { useState } from "react";
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
import RadioButton from "@/app/components/ui/common/radioButton"; // Asegúrate de importar el RadioButton
import Spinner from "@/app/components/ui/common/progresBar";

// Esquema de validación con Zod
const userSchema = z.object({
  firstName: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  lastName: z.string().min(3, "El apellido debe tener al menos 3 caracteres"),
  email: z.string().email("Debe ser un correo electrónico válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  role: z.enum(["STUDENT"]),
});

const colors = {
  background: '#f7f7f7',
  accent: '#241476',
  primary: '#1E0A63',
  secondary: '#A4DAF6',
  text: {
    light: '#ffffff',
    secondary: '#666666',
  },
  error: '#ff0000',
}

const Home: React.FC = () => {
  // Estado para los datos del formulario
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "STUDENT", // El rol inicial es 'STUDENT'
  });
  const [loading, setLoading] = useState(false)

  const router = useRouter();
  // Estado para los errores de validación
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Manejo de cambios en los inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleNavigation = () => {
    router.push("/pages/auth/login"); // Navega a la página de login
  };
  // Manejo del envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validar los datos con Zod
      userSchema.parse(formData);
      setErrors({}); // Limpiar errores si la validación pasa
      setLoading(true)
      const response = await axios.post("/api/auth/register", formData);
      if (response.status === 200 || response.status === 201) {
        router.push("/pages/auth/login");
        setLoading(false)
      }
    } catch (error) {
      // Manejo de errores de validación
      if (error instanceof z.ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
        setLoading(false)
      }
      // Manejo de errores de Axios
      else if (axios.isAxiosError(error)) {
        console.error(
          "Error en la petición:",
          error.response?.data || error.message
        );
        setLoading(false)
      }
      // Otros errores inesperados
      else {
        console.error("Error inesperado:", error);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative" style={{ backgroundColor: colors.background }}>
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(/background.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(5px)',
          WebkitFilter: 'blur(5px)',
          transform: 'scale(1.02)',
        }}
      />
      <div className="fixed inset-0 bg-black/50 z-0" />
      
      <div className="relative z-10 w-full max-w-md flex flex-col items-center mb-8">
        <div className="mb-6 w-full">
          <img src="/logo.png" alt="Logo" className="w-full h-auto max-h-48 object-contain" />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-white text-center">
          Entorno de Aprendizaje Interactivo
        </h1>
        <p className="text-sm text-white text-center">
          Fundamentos en Informática - Universidad Nacional Experimental Rómulo
          Gallegos
        </p>
      </div>
      
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm p-6 shadow-lg relative border-2 border-[#241476] z-10">
        <CardHeader>
          <CardTitle className="text-center" style={{ color: colors.primary }}>Crear una cuenta</CardTitle>
          <CardDescription className="text-center" style={{ color: colors.text.secondary }}>
            Ingrese sus datos para registrarse
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
                  className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4DAF6] focus:border-[#1E0A63] w-full"
                />
                {errors.firstName && (
                  <p className="text-sm mt-1" style={{ color: colors.error }}>{errors.firstName}</p>
                )}
              </div>
              <div>
                <Input
                  type="text"
                  placeholder="Apellido"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4DAF6] focus:border-[#1E0A63] w-full"
                />
                {errors.lastName && (
                  <p className="text-sm mt-1" style={{ color: colors.error }}>{errors.lastName}</p>
                )}
              </div>
            </div>
            <div>
              <Input
                type="email"
                placeholder="Correo electrónico"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4DAF6] focus:border-[#1E0A63] w-full"
              />
              {errors.email && (
                <p className="text-sm mt-1" style={{ color: colors.error }}>{errors.email}</p>
              )}
            </div>
            <div>
              <Input
                type="password"
                placeholder="Contraseña"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4DAF6] focus:border-[#1E0A63] w-full"
              />
              {errors.password && (
                <p className="text-sm mt-1" style={{ color: colors.error }}>{errors.password}</p>
              )}
            </div>
  
            <div className="flex justify-center my-4">
              <button
                type="submit"
                className="w-full px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: colors.primary,
                  color: colors.text.light,
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.secondary}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = colors.primary}
                disabled={loading}
              >
                {loading ? 'Registrando...' : 'Registrarse'}
              </button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <button
            onClick={handleNavigation}
            className="font-medium hover:underline"
            style={{ color: colors.primary }}
          >
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Home;
