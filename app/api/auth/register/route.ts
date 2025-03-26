import { NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { toUserDTO } from "@/app/types/register";

const prisma = new PrismaClient();

// Esquema de validación con Zod
const registerSchema = z.object({
  firstName: z.string().min(1, { message: "El primer nombre es requerido" }),
  lastName: z.string().min(1, { message: "El apellido es requerido" }),
  email: z.string().email({ message: "Correo inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  role: z.enum(["STUDENT", "TEACHER"]).optional(), // Opcional, coincide con tu enum de Prisma
});

export async function POST(req: Request) {

  try {
    // Parsear y validar datos del request con Zod
    const body = await req.json();
    const parsedData = registerSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(
        { success: false, error: parsedData.error.format() },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password, role } = parsedData.data;

    // Concatenar firstName y lastName para el campo 'name'
    const name = `${firstName} ${lastName}`;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "El email ya está registrado", code: "EMAIL_ALREADY_EXISTS" },
        },
        { status: 409 }
      );
    }

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        name,        // Usamos el nombre concatenado
        email,
        password,    // En texto plano como solicitaste
        role: role || "STUDENT"|| "TEACHER" ,
      },
    });

    // Transformar a DTO
    const userDTO = toUserDTO(user);

    return NextResponse.json(
      {
        success: true,
        data: userDTO,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Error en el servidor", code: "INTERNAL_SERVER_ERROR" },
      },
      { status: 500 }
    );
  }
}
