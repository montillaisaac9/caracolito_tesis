'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/app/components/ui/authentication/cards";
import Input from "@/app/components/ui/common/input";
import { Label } from "@/app/components/ui/common/label";
import { Checkbox } from "@/app/components/ui/common/checkbox";
import Link from "next/link";
import useUserStore from "@/app/stores/useUserStore";

const colors = {
  background: '#f7f7f7',
  accent: '#1E0A63',
  primary: '#241476',
  secondary: '#1E0A63',
  text: {
    light: '#ffffff',
    primary: '#333333',
  },
  error: '#EF4444',
};

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  
  // Utilizamos nuestro store de Zustand
  const { setUser, setToken } = useUserStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic client-side validation
    if (!formData.email.trim()) {
      setError("Por favor ingresa tu correo electrónico");
      return;
    }
    
    if (!formData.password) {
      setError("Por favor ingresa tu contraseña");
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Por favor ingresa un correo electrónico válido");
      return;
    }
    
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post('/api/auth/login', {
        email: formData.email.trim(),
        password: formData.password,
      });

      // Extraemos los datos relevantes de la respuesta
      const { user, session } = response.data;
      
      // Verificar si la respuesta es exitosa
      if (!user) {
        throw new Error("Respuesta del servidor incompleta");
      }
      
      // Guardamos el usuario en nuestro store
      setUser(user);
      
      // Si la API devuelve un token, lo guardamos también
      if (session?.token) {
        setToken(session.token);
      }
      
      // Redirigir según el rol
      if (user?.role === "ADMIN" && user?.role !== "TEACHER") {
        router.push("/pages/dashboard");
      } else {
        router.push("/pages/dashboard/module");
      }
      
    } catch (err) {
      console.error("Error de login:", err);
      
      if (axios.isAxiosError(err)) {
        // Manejar errores de red
        if (err.code === 'ECONNABORTED') {
          setError("La solicitud está tardando demasiado. Por favor, verifica tu conexión e inténtalo de nuevo.");
          return;
        }
        
        // Manejar errores de la API
        const status = err.response?.status;
        const data = err.response?.data;
        
        if (status === 400) {
          setError(data?.message || "Datos de entrada inválidos. Por favor, verifica la información ingresada.");
        } else if (status === 401) {
          setError("Correo o contraseña incorrectos. Por favor, verifica tus credenciales.");
        } else if (status === 403) {
          setError("Tu cuenta ha sido deshabilitada. Por favor, contacta al administrador.");
        } else if (status === 500) {
          setError("Error en el servidor. Por favor, inténtalo de nuevo más tarde.");
        } else if (status === 503) {
          setError("El servicio no está disponible en este momento. Por favor, inténtalo más tarde.");
        } else {
          setError(data?.message || "Error al iniciar sesión. Por favor, inténtalo de nuevo.");
        }
      } else if (err instanceof Error) {
        // Manejar otros errores de JavaScript
        setError(`Error: ${err.message}`);
      } else {
        // Error genérico
        setError("Ocurrió un error inesperado. Por favor, inténtalo de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 sm:py-8 relative overflow-x-hidden" style={{ backgroundColor: colors.background }}>
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
      
      <div className="relative z-10 w-full max-w-md flex flex-col items-center mb-4 sm:mb-8 px-4">
        <div className="mb-4 sm:mb-6 w-full max-w-xs mx-auto">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-full h-auto max-h-32 sm:max-h-48 object-contain" 
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-white text-center">
          Entorno de Aprendizaje Interactivo
        </h1>
        <p className="text-xs sm:text-sm text-center text-white/90 max-w-md mx-auto">
          Fundamentos en Informática - Universidad Nacional Experimental Rómulo
          Gallegos
        </p>
      </div>
      
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm p-4 sm:p-6 shadow-lg relative border-2 border-[#241476] z-10 mx-4">
        <CardHeader className="px-0 sm:px-4 pt-0 sm:pt-4">
          <CardTitle className="text-center text-xl sm:text-2xl" style={{ color: colors.primary }}>
            Iniciar sesión
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label 
                htmlFor="email" 
                className="text-sm sm:text-base"
                style={{ color: colors.text.primary }}
              >
                Correo electrónico
              </Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4DAF6] focus:border-[#1E0A63] w-full text-sm sm:text-base"
                placeholder="Ingrese su correo"
                required={true}
              />
            </div>
            <div className="space-y-2">
              <Label 
                htmlFor="password" 
                className="text-sm sm:text-base"
                style={{ color: colors.text.primary }}
              >
                Contraseña
              </Label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4DAF6] focus:border-[#1E0A63] w-full text-sm sm:text-base"
                placeholder="Ingrese su contraseña"
                required={true}
                minLength={6}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, rememberMe: checked as boolean })
                }
                className="data-[state=checked]:bg-[#1E0A63] border-[#241476] h-4 w-4 sm:h-5 sm:w-5"
              />
              <Label
                htmlFor="rememberMe"
                className="text-xs sm:text-sm font-medium cursor-pointer"
                style={{ color: colors.text.primary }}
              >
                Recordarme
              </Label>
            </div>

            {error && (
              <div className="p-2 text-xs sm:text-sm rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: colors.error }}>
                {error}
              </div>
            )}

            <div className="flex justify-center pt-2">
              <button
                type="submit"
                className="w-full px-4 py-2.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
                style={{
                  backgroundColor: colors.primary,
                  color: colors.text.light,
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.secondary}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = colors.primary}
                disabled={isLoading}
              >
                {isLoading ? "Procesando..." : "Iniciar sesión"}
              </button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="text-center text-xs sm:text-sm px-0 sm:px-4 pb-0">
          <p style={{ color: colors.text.primary }}>
            ¿No tienes una cuenta?{" "}
            <Link 
              href="/pages/auth/register" 
              className="font-medium hover:underline whitespace-nowrap"
              style={{ color: colors.primary }}
            >
              Crear una cuenta
            </Link>
          </p>
        </CardFooter>
      </Card>
      
      {/* Mobile bottom spacing */}
      <div className="h-8 sm:hidden"></div>
    </div>
  );
}