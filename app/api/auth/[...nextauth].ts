import NextAuth, { DefaultSession }  from "next-auth";

import { PrismaClient } from "@prisma/client";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";

// Extiende el tipo de usuario en la sesión
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}


const prisma = new PrismaClient();

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Aquí implementarías tu propia lógica de autenticación
        if (!credentials?.email || !credentials.password) return null;
        
        // Ejemplo básico (deberías usar hashing real y verificación)
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        
        // Comprueba el usuario y la contraseña
        if (user) {
          // Retorna el usuario si la autenticación es exitosa
          return { 
            id: user.id,
            email: user.email,
            name: user.name
          };
        }
        return null;
      }
    }),
    // Puedes añadir más proveedores aquí
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    }
  }
});