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
import { X } from "lucide-react";
import Link from "next/link";
import useUserStore from "@/app/stores/useUserStore";

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
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post('/api/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      // Extraemos los datos relevantes de la respuesta
      const { user, session } = response.data;
      
      // Guardamos el usuario en nuestro store
      setUser(user);
      
      // Si la API devuelve un token, lo guardamos también
      if (session?.token) {
        setToken(session.token);
      }

      // Redirigimos según el rol del usuario
        router.push("/pages/dashboard");
      
      
    } catch (err) {
      console.error("Error de login:", err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Error al iniciar sesión");
      } else {
        setError("Error inesperado al iniciar sesión");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <Card className="w-full max-w-md bg-gray-800 text-white p-6 shadow-lg relative border-2 border-gray-200">
        <button className="absolute top-4 right-4">
          <X className="h-5 w-5 text-gray-400" />
        </button>
        
        <CardHeader>
          <CardTitle className="text-center text-xl">Iniciar sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Correo electrónico
              </Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Ingrese su correo"
                required={true}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                Contraseña
              </Label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="bg-gray-700 border-gray-600 text-white"
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
                className="data-[state=checked]:bg-green-500"
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm font-medium text-gray-300 cursor-pointer"
              >
                Recordarme
              </Label>
            </div>

            {error && (
              <div className="p-2 text-red-400 text-sm bg-red-900/30 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-center">
              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? "Procesando..." : "Entrar"}
              </button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-gray-400">
          <p>
            ¿No tienes una cuenta?{" "}
            <Link href="/pages/auth/register" className="text-green-400 hover:underline">
              Crea una cuenta
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}