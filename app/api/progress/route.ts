import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// Esquema para validación de creación
const ProgressCreateSchema = z.object({
    studentId: z.string({ required_error: "El ID del estudiante es obligatorio" }).min(1, "El ID del estudiante no puede estar vacío"),
    activityId: z.string({ required_error: "El ID de la actividad es obligatorio" }).min(1, "El ID de la actividad no puede estar vacío"),
    score: z.number().int("El puntaje debe ser un número entero").min(0, "El puntaje no puede ser negativo").default(0),
    completed: z.boolean().default(false),
    timeSpent: z.number().int("El tiempo dedicado debe ser un número entero").min(0, "El tiempo dedicado no puede ser negativo").optional(),
    attempts: z.number().int("Los intentos deben ser un número entero").min(0, "Los intentos no pueden ser negativos").default(0),
    lastAttempt: z.date().optional(),
    feedback: z.string().max(500, "El feedback no puede exceder los 500 caracteres").optional(),
});

// Esquema para validación de actualización
const ProgressUpdateSchema = z.object({
    score: z.number().int("El puntaje debe ser un número entero").min(0, "El puntaje no puede ser negativo").optional(),
    completed: z.boolean().optional(),
    timeSpent: z.number().int("El tiempo dedicado debe ser un número entero").min(0, "El tiempo dedicado no puede ser negativo").optional().nullable(),
    attempts: z.number().int("Los intentos deben ser un número entero").min(0, "Los intentos no pueden ser negativos").optional(),
    lastAttempt: z.date().optional(),
    feedback: z.string().max(500, "El feedback no puede exceder los 500 caracteres").optional().nullable(),
});

// crear progress
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const existingProgress = await prisma.progress.findFirst({
      where: {
        studentId: body.data.studentId,
        activityId: body.data.activityId,
      },
    });

    if (existingProgress) {
      return NextResponse.json({
        status: 400,
        message: "Ya existe un registro de progreso para este estudiante y actividad",
        data: existingProgress,
      }, { status: 400 });
    }

    const [student, activity] = await Promise.all([
      prisma.user.findUnique({ where: { id: body.data.studentId } }),
      prisma.activity.findUnique({ where: { id: body.data.activityId } }),
    ]);

    if (!student) {
      return NextResponse.json({
        status: 404,
        message: "Estudiante no encontrado",
      }, { status: 404 });
    }

    if (!activity) {
      return NextResponse.json({
        status: 404,
        message: "Actividad no encontrada",
      }, { status: 404 });
    }

    const progress = await prisma.progress.create({
      data: {
        ...body.data,
        lastAttempt: body.data.lastAttempt || new Date(),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        activity: {
          select: {
            id: true,
            title: true,
            points: true,
          },
        },
      },
    });

    return NextResponse.json({
      status: 201,
      message: `Progreso creado exitosamente para el estudiante ${student.name}`,
      data: progress,
    }, { status: 201 });

  } catch (error) {
    console.error("Error creando el progreso:", error);
    return NextResponse.json({
      status: 500,
      message: "Error interno del servidor al crear el progreso",
    }, { status: 500 });
  }
}

// obtener progress
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const studentId = searchParams.get("studentId");
    const activityId = searchParams.get("activityId");
    const completed = searchParams.get("completed");
    const minScore = searchParams.get("minScore");
    const maxScore = searchParams.get("maxScore");

    if (id && (studentId || activityId || completed || minScore || maxScore)) {
      return NextResponse.json({
        status: 400,
        message: "El parámetro 'id' no puede usarse con otros filtros",
      }, { status: 400 });
    }

    if (id) {
      const progress = await prisma.progress.findUnique({
        where: { id },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          activity: {
            select: {
              id: true,
              title: true,
              type: true,
              points: true,
              difficulty: true,
            },
          },
        },
      });

      if (!progress) {
        return NextResponse.json({
          status: 404,
          message: "Registro de progreso no encontrado",
        }, { status: 404 });
      }

      return NextResponse.json({
        status: 200,
        message: "Progreso obtenido exitosamente",
        data: progress,
      }, { status: 200 });
    }

    const where: any = {};

    if (studentId) {
      where.studentId = studentId;
    }

    if (activityId) {
      where.activityId = activityId;
    }

    if (completed !== null) {
      where.completed = completed.toLowerCase() === 'true';
    }

    if (minScore) {
      where.score = {
        gte: parseInt(minScore),
      };
    }

    if (maxScore) {
      where.score = {
        ...where.score,
        lte: parseInt(maxScore),
      };
    }

    const progressRecords = await prisma.progress.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
          },
        },
        activity: {
          select: {
            id: true,
            title: true,
            type: true,
            points: true,
          },
        },
      },
      orderBy: {
        lastAttempt: "desc",
      },
    });

    return NextResponse.json({
      status: 200,
      message: "Registros de progreso obtenidos exitosamente",
      data: progressRecords,
      meta: {
        count: progressRecords.length,
        filters: {
          studentId: studentId || "no aplicado",
          activityId: activityId || "no aplicado",
          completed: completed || "no aplicado",
          minScore: minScore || "no aplicado",
          maxScore: maxScore || "no aplicado",
        },
      },
    }, { status: 200 });

  } catch (error) {
    console.error("Error obteniendo el progreso:", error);
    return NextResponse.json({
      status: 500,
      message: "Error interno del servidor al obtener el progreso",
    }, { status: 500 });
  }
}

// actualizar progress
export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({
        status: 400,
        message: "Se requiere el ID del progreso como query param",
      }, { status: 400 });
    }

    const body = await request.json();
    const validation = ProgressUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        status: 400,
        message: "Error de validación",
        errors: validation.error.flatten(),
      }, { status: 400 });
    }

    const existingProgress = await prisma.progress.findUnique({
      where: { id },
    });

    if (!existingProgress) {
      return NextResponse.json({
        status: 404,
        message: "Registro de progreso no encontrado",
      }, { status: 404 });
    }

    const updatedProgress = await prisma.progress.update({
      where: { id },
      data: {
        ...validation.data,
        lastAttempt: validation.data.lastAttempt || new Date(),
        updatedAt: new Date(),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
          },
        },
        activity: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      status: 200,
      message: "Progreso actualizado exitosamente",
      data: updatedProgress,
    }, { status: 200 });

  } catch (error) {
    console.error("Error actualizando el progreso:", error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({
        status: 404,
        message: "Registro de progreso no encontrado",
      }, { status: 404 });
    }

    return NextResponse.json({
      status: 500,
      message: "Error interno del servidor al actualizar el progreso",
    }, { status: 500 });
  }
}

// Eliminar progress
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({
        status: 400,
        message: "Se requiere el ID del progreso como query param",
      }, { status: 400 });
    }

    const existingProgress = await prisma.progress.findUnique({
      where: { id },
    });

    if (!existingProgress) {
      return NextResponse.json({
        status: 404,
        message: "Registro de progreso no encontrado",
      }, { status: 404 });
    }

    await prisma.progress.delete({
      where: { id },
    });

    return NextResponse.json({
      status: 200,
      message: "Progreso eliminado exitosamente",
      data: { id },
    }, { status: 200 });

  } catch (error) {
    console.error("Error eliminando el progreso:", error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({
        status: 404,
        message: "Registro de progreso no encontrado",
      }, { status: 404 });
    }

    return NextResponse.json({
      status: 500,
      message: "Error interno del servidor al eliminar el progreso",
    }, { status: 500 });
  }
}