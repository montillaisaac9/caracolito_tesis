'use client'

import React, { useState } from 'react';
import axios from 'axios';
import { z } from "zod";
import Input from './components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/cards";

// Esquema de validación con Zod
const userSchema = z.object({
  firstName: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  lastName: z.string().min(3, "El apellido debe tener al menos 3 caracteres"),
  email: z.string().email("Debe ser un correo electrónico válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  role: z.enum(["STUDENT"]),
});

const Home: React.FC = () => {
  // Estado para los datos del formulario
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'STUDENT' as const,
  });

  // Estado para los errores de validación
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Manejo de cambios en los inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejo del envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validar los datos con Zod
      userSchema.parse(formData);
      setErrors({}); // Limpiar errores si la validación pasa

      // Enviar datos con Axios
      const response = await axios.post('/api/auth/register', formData);
      if (response.status === 200 || response.status === 201) {
        console.log('Usuario registrado exitosamente');
        // Aquí podrías cerrar el modal o redirigir al usuario
      }
    } catch (error) {
      // Manejo de errores de validación
      if (error instanceof z.ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
      } 
      // Manejo de errores de Axios
      else if (axios.isAxiosError(error)) {
        console.error('Error en la petición:', error.response?.data || error.message);
      } 
      // Otros errores inesperados
      else {
        console.error('Error inesperado:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4">
      <h1 className="text-white text-3xl font-bold mb-2">Entorno de Aprendizaje Interactivo</h1>
      <p className="text-white text-sm mb-8 text-center">
        Fundamentos en Informática - Universidad Nacional Experimental Rómulo Gallegos
      </p>

      <Card className="w-full max-w-lg border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="text-center">Crear una cuenta</CardTitle>
          <CardDescription className="text-center">Ingrese sus datos para registrarse</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input type="text" placeholder="Nombre" name="firstName" value={formData.firstName} onChange={handleChange} />
                {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
              </div>
              <div>
                <Input type="text" placeholder="Apellido" name="lastName" value={formData.lastName} onChange={handleChange} />
                {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
              </div>
            </div>
            <Input type="email" placeholder="Correo electrónico" name="email" value={formData.email} onChange={handleChange} />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            <Input type="password" placeholder="Contraseña" name="password" value={formData.password} onChange={handleChange} />
            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}

            {/* Radio Button centrado y siempre activo */}
            <div className="flex justify-center my-4">
            <label className="flex items-center space-x-2">
  <input type="radio" name="role" checked readOnly className="form-radio border-green-500 text-green-500 focus:ring-green-50 w-5 h-5" />
  <span className='text-white'>Estudiante</span>
</label>
            </div>

            {/* Botón de Registro centrado */}
            <div className="flex justify-center">
              <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md">
                Registrarse
              </button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <button className="text-blue-500 hover:underline">
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        </CardFooter>
      </Card>
    </div>
  );
};
export default Home;

