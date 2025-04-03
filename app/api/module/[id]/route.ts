import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { message } from "../../helpers/responsesMsg";

// Instancia global de Prisma para evitar múltiples conexiones
const prisma = new PrismaClient();

// Handler para GET
export async function GET(
  request: Request,
  context: { params: { id?: string } }
) {
  try {
    // Extraer los parámetros correctamente
    const { id } = await context.params;

    if (!id || id.trim() === "") {
      return NextResponse.json(
        message({
          status: 400,
          message: "Debe agregar un ID válido",
          data: {},
          error: "El ID no puede estar vacío",
        })
      );
    }

    const module = await prisma.module.findUnique({
      where: { id },
      include: { topics: true },
    });

    console.log(module)

    if (!module) {
      return NextResponse.json(
        message({
          status: 404,
          message: "Recurso no encontrado",
          data: {},
          error: "Recurso no encontrado",
        })
      );
    }

    return NextResponse.json(
      message({
        status: 200,
        message: "Recurso encontrado",
        data: { module },
      })
    );
  } catch (error) {
    console.error("Error en el endpoint de obtener un módulo:", error);
    return NextResponse.json(
      message({
        status: 500,
        message: "Error interno del servidor",
        data: {},
        error: error instanceof Error ? error.message : error,
      })
    );
  }
}
