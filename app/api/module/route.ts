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
    const idUser = seach.get("userId");
    const id = seach.get("id");
    const offset = (parseInt(page) - 1) * parseInt(limit);

    console.log(idUser)
    const prisma = new PrismaClient();
    
    let modules;

    // Si se proporciona un ID específico, buscar solo ese módulo
    if (id ) {
      const module = await prisma.module.findUnique({
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
    // Si hay filtro por usuario
    else if (idUser != undefined) {
      modules = await prisma.module.findMany({
        where: {
          createdById: idUser
        },
        skip: offset,
        take: parseInt(limit),
      });
    } 
    // Sin filtros, obtener todos
    else {
      modules = await prisma.module.findMany({
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
    return NextResponse.json(
      message({ status: 400, message: "error General", data: error })
    );
  }
}
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validationBody = ModuleSchema.safeParse(body);
    console.log({ validationBody });

    if (!validationBody.success) {
      return NextResponse.json(
        message({
          status: 400,
          message: "error en el body",
          error: validationBody.error.format(),
        })
      );
    }

    const prisma = new PrismaClient();
    const { title, description, order, isActive, createdById } =
      validationBody.data;

    const newModule = await prisma.module.create({
      data: { title, description, order, isActive, createdById },
    });

    console.log(newModule);
    prisma.$disconnect();

    return NextResponse.json(
      message({
        status: 200,
        message: "Modulo creado",
        data: { moduleData: newModule },
      })
    );
  } catch (error) {
    return NextResponse.json(
      message({
        status: 400,
        message: "Error en endpoint de creación de modulo",
        error,
        data: { error },
      })
    );
  }
}
