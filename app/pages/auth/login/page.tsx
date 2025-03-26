'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/app/components/ui/cards";
import Input from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";
import { X } from "lucide-react";
import Link from "next/link";

export default function LoginForm() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.username.toLowerCase().includes("profesor")) {
      router.push("/profesor/dashboard");
    } else {
      router.push("/estudiante/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      {/* Card component */}
      <Card className="w-full max-w-md bg-gray-800 text-white p-6 shadow-lg relative border-2 border-gray-200">
        {/* Close button */}
        <button className="absolute top-4 right-4">
          <X className="h-5 w-5 text-gray-400" />
        </button>
        
        {/* Card Header */}
        <CardHeader>
          <CardTitle className="text-center text-xl">Iniciar sesión</CardTitle>
        </CardHeader>

        {/* Card Content */}
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username input */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">
                Nombre de usuario
              </Label>
              <Input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Ingrese su usuario"
              />
            </div>

            {/* Password input */}
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
              />
            </div>

            {/* Remember me checkbox */}
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

            {/* Login button */}
            <div className="flex justify-center">
              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
              >
                Entrar
              </button>
            </div>
          </form>
        </CardContent>

        {/* Card Footer */}
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
