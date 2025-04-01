// src/stores/useUserStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Definimos la interface para el usuario
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Interface para nuestro estado
interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

// Creamos y exportamos nuestro store
const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: true 
      }),
      
      setToken: (token) => set({ token }),
      
      logout: () => set({ 
        user: null, 
        isAuthenticated: false, 
        token: null 
      }),
    }),
    {
      name: 'user-storage', // nombre para localStorage/sessionStorage
      storage: createJSONStorage(() => localStorage), // podemos usar localStorage o sessionStorage
    }
  )
);

export default useUserStore;