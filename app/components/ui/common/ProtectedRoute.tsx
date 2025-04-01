// src/components/ProtectedRoute.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useUserStore from '@/app/stores/useUserStore';
import Spinner from './progresBar';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Roles permitidos para esta ruta
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const { isAuthenticated, user } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    // Si no está autenticado, redirigir al login
    if (!isAuthenticated) {
      router.push('/pages/auth/login');
      return;
    }

    // Si hay roles específicos permitidos y el usuario no tiene uno de ellos
    if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
      // Redirigir a una página de acceso denegado o al dashboard general
      router.push('/acceso-denegado');
    }
  }, [isAuthenticated, user, router, allowedRoles]);

  // No renderizar nada mientras se verifica la autenticación
  if (!isAuthenticated) {
    return (
        <Spinner isLoading={true}></Spinner>
    );
  }

  // Si hay roles permitidos especificados y el usuario no tiene uno de ellos
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return null; // No renderizar nada ya que se redirigirá
  }

  // Si el usuario está autenticado y tiene los permisos correctos
  return <>{children}</>;
};

export default ProtectedRoute;