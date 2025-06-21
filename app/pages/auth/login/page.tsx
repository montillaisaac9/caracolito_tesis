'use client';
import { useState, useRef, useEffect } from "react";
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
import Draggable from 'react-draggable';
import { Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-react';

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

// Componente separado para el video arrastrable
const DraggableVideo = () => {
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error al intentar entrar en pantalla completa: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const { currentTime, duration } = videoRef.current;
      setProgress((currentTime / duration) * 100);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <Draggable 
      nodeRef={nodeRef} 
      bounds="parent" 
      handle=".drag-handle"
      disabled={isFullscreen}
    >
      <div 
        ref={nodeRef}
        className={`fixed bottom-4 right-4 ${isFullscreen ? 'w-full h-full inset-0 m-0' : 'w-80'} bg-black rounded-lg shadow-2xl overflow-hidden z-50 transition-all duration-300`}
        style={{ 
          cursor: isFullscreen ? 'default' : 'move',
          maxWidth: isFullscreen ? 'none' : '24rem',
          maxHeight: isFullscreen ? 'none' : '24rem',
        }}
      >
        <div 
          ref={containerRef}
          className="relative w-full h-full"
          onDoubleClick={toggleFullscreen}
        >
          {/* Barra superior */}
          <div className="drag-handle bg-black/70 text-white p-2 flex justify-between items-center cursor-move">
            <span className="text-sm font-medium">Tutorial</span>
            <div className="flex space-x-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className="p-1 hover:bg-white/20 rounded-full"
                title={isMuted ? "Activar sonido" : "Silenciar"}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="p-1 hover:bg-white/20 rounded-full"
                title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>

          {/* Video */}
          <video 
            ref={videoRef}
            className="w-full h-full object-contain" 
            autoPlay 
            loop 
            muted={isMuted}
            playsInline
            onClick={togglePlay}
            onTimeUpdate={handleTimeUpdate}
          >
            <source src="/tutorial.mp4" type="video/mp4" />
            Tu navegador no soporta el elemento de video.
          </video>

          {/* Barra de progreso */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
            <div 
              className="h-full bg-blue-500" 
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controles flotantes */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button 
                onClick={togglePlay}
                className="bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                aria-label="Reproducir"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </Draggable>
  );
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
      if (user?.role === "ADMIN" && user?.role !== "TEACHER") {
        router.push("/pages/dashboard");
      } else router.push("/pages/dashboard/module");
      
      
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative" style={{ backgroundColor: colors.background }}>
      {/* Video Tutorial Flotante */}
      <DraggableVideo />

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
        <p className="text-sm text-center text-white">
          Fundamentos en Informática - Universidad Nacional Experimental Rómulo
          Gallegos
        </p>
      </div>
      
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm p-6 shadow-lg relative border-2 border-[#241476] z-10">
        <button className="absolute top-4 right-4" style={{ color: colors.secondary }}>
          <X className="h-5 w-5" />
        </button>
        
        <CardHeader>
          <CardTitle className="text-center text-xl" style={{ color: colors.primary }}>Iniciar sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" style={{ color: colors.text.primary }}>
                Correo electrónico
              </Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4DAF6] focus:border-[#1E0A63] w-full"
                placeholder="Ingrese su correo"
                required={true}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" style={{ color: colors.text.primary }}>
                Contraseña
              </Label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4DAF6] focus:border-[#1E0A63] w-full"
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
                className="data-[state=checked]:bg-[#1E0A63] border-[#241476]"
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm font-medium cursor-pointer"
                style={{ color: colors.text.primary }}
              >
                Recordarme
              </Label>
            </div>

            {error && (
              <div className="p-2 text-sm rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: colors.error }}>
                {error}
              </div>
            )}

            <div className="flex justify-center">
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
                disabled={isLoading}
              >
                {isLoading ? "Procesando..." : "Entrar"}
              </button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p style={{ color: colors.text.primary }}>
            ¿No tienes una cuenta?{" "}
            <Link 
              href="/pages/auth/register" 
              className="font-medium hover:underline"
              style={{ color: colors.primary }}
            >
              Crea una cuenta
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}