import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

const ActivitySchema = z.object({
  title: z.string({required_error: "El título es obligatorio"}).min(1, "El título no puede estar vacío").max(100, "El título no puede exceder 100 caracteres"),
  type: z.enum(["WORD_SEARCH", "QUIZ", "MATCHING", "EXERCISE"], {required_error: "El tipo de actividad es obligatorio"}),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
  config: z.object({
    instructions: z.string().min(1, "Las instrucciones son obligatorias"),
    wordSearch: z.object({
      words: z.array(z.string().min(1, "Las palabras no pueden estar vacías")).min(1, "Debe haber al menos una palabra"),
      gridSize: z.number().int("El tamaño de la cuadrícula debe ser un entero").min(5, "El tamaño mínimo de la cuadrícula es 5").max(20, "El tamaño máximo de la cuadrícula es 20"),
      allowDiagonal: z.boolean().default(false),
      allowBackwards: z.boolean().default(false)
    }).optional(),
    matching: z.object({
      pairs: z.array(
        z.object({
          left: z.string().min(1, "El elemento izquierdo no puede estar vacío"),
          right: z.string().min(1, "El elemento derecho no puede estar vacío")
        })
      ).min(2, "Debe haber al menos dos pares para la actividad de emparejamiento"),
      shuffle: z.boolean().default(true)
    }).optional()
  }).refine((data) => {
    // Validar que solo haya una configuración según el tipo de actividad
    const configCount = [
      data.wordSearch,
      data.matching,
    ].filter(Boolean).length;
    return configCount === 1;
  }, {
    message: "Debe haber exactamente una configuración según el tipo de actividad"
  }),
  points: z.number().int("Los puntos deben ser un entero").min(0, "Los puntos no pueden ser negativos").default(10),
  timeLimit: z.number().int("El tiempo límite debe ser un entero").positive("El tiempo límite debe ser positivo").optional(),
  isActive: z.boolean().default(true),
  topicId: z.string().min(1, "El ID del tema es obligatorio"),
  createdById: z.string().min(1, "El ID del creador es obligatorio").optional(),
});


// crear activity
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Request body:", body);
    
    // Verificar que el ID del usuario esté presente
    if (!body.createdById) {
      return NextResponse.json({
        status: 400,
        message: "El ID del creador es requerido",
      }, { status: 400 });
    }
    
    const validation = ActivitySchema.safeParse(body);
    
    if (!validation.success) {
      console.log("Validation errors:", validation.error.flatten());
      return NextResponse.json({
        status: 400,
        message: "Error de validación",
        errors: validation.error.flatten(),
      }, { status: 400 });
    }

    const activity = await prisma.activity.create({
      data: {
        ...validation.data,
        config: validation.data.config,
      },
    });

    return NextResponse.json({
      status: 201,
      message: "Actividad creada exitosamente",
      data: activity,
    }, { status: 201 });

  } catch (error) {
    console.error("Error creando la activity:", error);
    return NextResponse.json({
      status: 500,
      message: "Error interno del servidor al crear la actividad",
    }, { status: 500 });
  }
}

// obtener activity (simgular, prural, compuesta)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const createdById = searchParams.get("createdById");
    const topicId = searchParams.get("topicId");
    const isActiveParam = searchParams.get("isActive");

    if (id && (createdById || topicId || isActiveParam)) {
      return NextResponse.json({
          status: 400,
          message: "El parámetro 'id' no puede usarse con otros filtros",
        },
        { status: 400 }
      );
    }

    if (id) {
      const activity = await prisma.activity.findUnique({
        where: { id },
        include: {
          topic: {
            select: {
              id: true,
              title: true,
              module: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
        },
      });

      if (!activity) {
        return NextResponse.json({
            status: 404,
            message: "Actividad no encontrada",
            error: `No se encontró actividad con ID: ${id}`
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
          status: 200,
          message: "Actividad obtenida exitosamente",
          data: activity,
        },
        { status: 200 }
      );
    }

    const where: Record<string, string | boolean> = {};

    if (createdById) {
      where.createdById = createdById;
    }

    if (topicId) {
      where.topicId = topicId;
    }

    if (isActiveParam !== null) {
      where.isActive = isActiveParam.toLowerCase() === 'true';
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        topic: {
          select: {
            id: true,
            title: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(
      {
        status: 200,
        message: "Actividades obtenidas exitosamente",
        data: activities,
        meta: {
          count: activities.length,
          filters: {
            createdById: createdById || 'no aplicado',
            topicId: topicId || 'no aplicado',
            isActive: isActiveParam !== null ? isActiveParam : 'no aplicado'
          }
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error en GET /api/activities:", error);
    return NextResponse.json(
      {
        status: 500,
        message: "Error en los Query-params",
      },
      { status: 500 }
    );
  }
}

const ActivityUpdateSchema = z.object({
  title: z.string().min(1, "El título no puede estar vacío").max(100, "El título no puede exceder 100 caracteres").optional(),
  type: z.enum(["WORD_SEARCH", "QUIZ", "MATCHING", "EXERCISE"]).optional(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  config: z.object({
    instructions: z.string().min(1, "Las instrucciones son obligatorias"),
    wordSearch: z.object({
      words: z.array(z.string().min(1, "Las palabras no pueden estar vacías")),
      gridSize: z.number().int().min(5).max(20),
      allowDiagonal: z.boolean(),
      allowBackwards: z.boolean()
    }).optional(),
    quiz: z.object({
      question: z.string().min(1, "La pregunta es obligatoria"),
      options: z.array(z.string().min(1, "Las opciones no pueden estar vacías")).min(2, "Debe haber al menos 2 opciones"),
      correctAnswer: z.number().int().min(0, "La respuesta correcta debe ser un índice válido"),
      explanation: z.string().min(1, "La explicación es obligatoria")
    }).optional(),
    matching: z.object({
      pairs: z.array(z.object({
        left: z.string().min(1, "El lado izquierdo no puede estar vacío"),
        right: z.string().min(1, "El lado derecho no puede estar vacío")
      })).min(2, "Debe haber al menos 2 pares"),
      shuffle: z.boolean()
    }).optional(),
    exercise: z.object({
      text: z.string().min(1, "El texto es obligatorio"),
      correctAnswer: z.string().min(1, "La respuesta correcta es obligatoria"),
      caseSensitive: z.boolean(),
      allowPartial: z.boolean()
    }).optional()
  }).refine((data) => {
    const configCount = [
      data.wordSearch,
      data.quiz,
      data.matching,
      data.exercise
    ].filter(Boolean).length;
    return configCount === 1;
  }, {
    message: "Debe haber exactamente una configuración según el tipo de actividad"
  }).optional(),
  points: z.number().int("Los puntos deben ser un entero").min(0, "Los puntos no pueden ser negativos").optional(),
  timeLimit: z.number().int("El tiempo límite debe ser un entero").positive("El tiempo límite debe ser positivo").optional().nullable(),
  isActive: z.boolean().optional(),
  topicId: z.string().min(1, "El ID del tema es obligatorio").optional(),
});

// actualizar activity
export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({
        status: 400,
        message: "Se requiere el ID de la actividad como query param",
      }, { status: 400 });
    }
    const body: unknown = await request.json();
    
    const validation = ActivityUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        status: 400,
        message: "Error de validación",
        errors: validation.error.flatten(),
      }, { status: 400 });
    }

    const existingActivity = await prisma.activity.findUnique({
      where: { id }
    });

    if (!existingActivity) {
      return NextResponse.json({
        status: 404,
        message: "Actividad no encontrada",
      }, { status: 404 });
    }

    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: {
        ...validation.data,
        config: validation.data.config ?? undefined,
      },
    });

    return NextResponse.json({
      status: 200,
      message: "Actividad actualizada exitosamente",
      data: updatedActivity,
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("Error actualizando la actividad:", error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({
        status: 404,
        message: "Actividad no encontrada",
      }, { status: 404 });
    }

    return NextResponse.json({
      status: 500,
      message: "Error interno del servidor al actualizar la actividad",
    }, { status: 500 });
  }
}

// borrar activity
export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({
        status: 400,
        message: "Se requiere el ID de la actividad como query param",
      }, { status: 400 });
    }

    const existingActivity = await prisma.activity.findUnique({
      where: { id }
    });

    if (!existingActivity) {
      return NextResponse.json({
        status: 404,
        message: "Actividad no encontrada",
      }, { status: 404 });
    }

    await prisma.activity.delete({
      where: { id }
    });

    return NextResponse.json({
      status: 200,
      message: "Actividad eliminada exitosamente",
      data: { id }
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("Error eliminando la actividad:", error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({
        status: 404,
        message: "Actividad no encontrada",
      }, { status: 404 });
    }

    return NextResponse.json({
      status: 500,
      message: "Error interno del servidor al eliminar la actividad",
    }, { status: 500 });
  }
}
