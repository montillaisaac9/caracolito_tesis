import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";
import { message } from "../helpers/responsesMsg";


// OBTENER TODAS LOS MODULOS CON PAGINADO Y FILTRADO POR ID
export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams;
    const page = search.get("page") || "1";
    const limit = search.get("limit") || "10";
    const id = search.get("id");
    const role = search.get("role") as "ADMIN" | "TEACHER" | "STUDER" | null;
    const searchQuery = search.get("search") || "";
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    const prisma = new PrismaClient();
    
    let whereClause: any = {};
    
    // Filtro por rol si se especifica
    if (role) {
      whereClause.role = role;
    }
    
    // Búsqueda por nombre o email
    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } }
      ];
    }

    let modules;
    let totalCount;

    // Si se proporciona un ID específico, buscar solo ese módulo
    if (id) {
      const user = await prisma.user.findUnique({
        where: { id }
      });
      
      if (!user) {
        prisma.$disconnect();
        return NextResponse.json(
          message({ status: 404, message: "Usuario no encontrado", data: null })
        );
      }
      modules = [user];
      totalCount = 1;
    } else {
      // Obtener el total de registros para la paginación
      totalCount = await prisma.user.count({ where: whereClause });
      
      // Obtener los usuarios paginados
      modules = await prisma.user.findMany({
        where: whereClause,
        skip: offset,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      });
    }

    prisma.$disconnect();

    const totalPages = Math.ceil(totalCount / limitNum);
    
    return NextResponse.json(
      message({
        status: 200,
        message: "Usuarios encontrados",
        data: { 
          modules,
          totalCount,
          totalPages,
          currentPage: pageNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
      })
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      message({ status: 400, message: "error General", data: error })
    );
  }
}