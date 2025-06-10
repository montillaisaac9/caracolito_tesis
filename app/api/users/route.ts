import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";
import { message } from "../helpers/responsesMsg";

// Esquema Zod para validar el body de creación de un módulo
export const ModuleSchema = z.object({
  title: z
    .string()
    .min(1, { message: "El título es obligatorio y no puede estar vacío" })
    .max(100, { message: "El título no puede exceder 100 caracteres" }),
  description: z
    .string()
    .min(1, { message: "La descripción es obligatoria y no puede estar vacía" })
    .max(250, { message: "La descripción no puede exceder 250 caracteres" }),
  isActive: z.boolean().default(true), // Por defecto, el módulo estará activo
  order: z
    .number()
    .int()
    .positive({ message: "El orden debe ser un número entero positivo" }),
  createdById: z.string().min(1, {
    message: "El createdById es obligatorio y no puede estar vacío",
  }),
});

// OBTENER TODAS LOS MODULOS CON PAGINADO Y FILTRADO POR ID
export async function GET(req: NextRequest) {
  try {
    const seach = req.nextUrl.searchParams;
    const page = seach.get("page") || "";
    const limit = seach.get("limit") || "";
    const id = seach.get("id");
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const prisma = new PrismaClient();
    
    let modules;

    // Si se proporciona un ID específico, buscar solo ese módulo
    if (id ) {
      const module = await prisma.user.findUnique({
        where: { id }
      });
      
      if (!module) {
        prisma.$disconnect();
        return NextResponse.json(
          message({ status: 404, message: "Módulo no encontrado", data: null })
        );
      }
      
      modules = [module]; // Mantener como array para consistencia con la respuesta original
    } 
    else {
      modules = await prisma.user.findMany({
        skip: offset,
        take: parseInt(limit),
      });
    }

    prisma.$disconnect();

    return NextResponse.json(
      message({
        status: 200,
        message: "modulos encontrados",
        data: { modules },
      })
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      message({ status: 400, message: "error General", data: error })
    );
  }
}