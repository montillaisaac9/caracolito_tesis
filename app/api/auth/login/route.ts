import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route"; 
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Esquema de validación con Zod
const loginSchema = z.object({
  email: z.string().email({ message: "Correo inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

// Controlador del endpoint POST
export async function POST(req: Request) {
  try {
    // Parsear y validar datos del request con Zod
    const body = await req.json();
    const parsedData = loginSchema.safeParse(body);
    
    if (!parsedData.success) {
      return NextResponse.json({ error: parsedData.error.format() }, { status: 400 });
    }

    const { email, password } = parsedData.data;

    // Buscar usuario en la base de datos
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });
    }

    // Obtener sesión de NextAuth
    const session = await getServerSession(authOptions);
    
    return NextResponse.json(
      { message: "Login exitoso", session, user: { id: user.id, email: user.email, name: user.name, role: user.role  } },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error en el login:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
