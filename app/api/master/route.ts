import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod"; // Para validación de parámetros opcionales

const prisma = new PrismaClient();

// Esquema para filtros opcionales (ejemplo)
const filterSchema = z.object({
  role: z.string().optional(),
}).optional();

export async function GET(req: Request) {
  try {
    // Opcional: Leer parámetros de consulta (query params)
    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get('role') || undefined;

    // Validar parámetros (si los hay)
    const validatedFilters = filterSchema.safeParse({ role: roleFilter });
    if (!validatedFilters.success) {
      return NextResponse.json(
        { error: "Parámetros inválidos" },
        { status: 400 }
      );
    }

    // Consulta a la base de datos (sin verificación de sesión)
    const userCount = await prisma.user.count({
      where: {
        role: validatedFilters.data?.role, // Filtro opcional por rol
      },
    });

    return NextResponse.json(
      { count: userCount },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error al contar usuarios:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect(); // Cerrar conexión
  }
}