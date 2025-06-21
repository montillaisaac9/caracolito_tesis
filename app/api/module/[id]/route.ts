import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";
import { message } from "../../helpers/responsesMsg";
import { z } from 'zod';

// Esquema para actualizar un módulo
export const UpdateModuleSchema = z.object({
  title: z
    .string()
    .min(1, { message: "El título es obligatorio y no puede estar vacío" })
    .max(100, { message: "El título no puede exceder 100 caracteres" })
    .optional(),
  description: z
    .string()
    .min(1, { message: "La descripción es obligatoria y no puede estar vacía" })
    .max(250, { message: "La descripción no puede exceder 250 caracteres" })
    .optional(),
  isActive: z.boolean().optional(),
  order: z
    .number()
    .int()
    .positive({ message: "El orden debe ser un número entero positivo" })
    .optional(),
});

// Obtener un módulo por ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let client;
  try {
    // Wait for params to be available
    const { id } = await Promise.resolve(params);
    
    if (!id) {
      return NextResponse.json(
        message({
          status: 400,
          message: "ID de módulo no proporcionado",
          data: null,
          error: "El parámetro ID es requerido"
        }),
        { status: 400 }
      );
    }

    client = new PrismaClient();
    
    const myModule = await client.module.findUnique({
      where: { id },
      include: { 
        topics: {
          orderBy: { order: 'asc' },
          // Removed invalid 'resources' relation
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
    });

    if (!myModule) {
      return NextResponse.json(
        message({
          status: 404,
          message: "Módulo no encontrado",
          data: null,
          error: `No se encontró ningún módulo con ID: ${id}`
        }),
        { status: 404 }
      );
    }

    return NextResponse.json(
      message({ 
        status: 200, 
        message: "Módulo obtenido exitosamente", 
        data: myModule 
      }),
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Error al obtener el módulo:", error);
    return NextResponse.json(
      message({
        status: 500,
        message: "Error interno del servidor",
        data: null,
        error: error instanceof Error ? error.message : "Error desconocido al obtener el módulo",
      }),
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.$disconnect().catch(console.error);
    }
  }
}

// Actualizar un módulo
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let client;
  try {
    const id = params.id;
    const body = await req.json();

    if (!id) {
      return NextResponse.json(
        message({
          status: 400,
          message: "Debe proporcionar un ID de módulo",
          data: null,
          error: "ID es requerido",
        }),
        { status: 400 }
      );
    }
    
    // Validar el cuerpo de la solicitud
    const validation = UpdateModuleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        message({
          status: 400,
          message: "Datos de entrada no válidos",
          data: null,
          error: validation.error.errors,
        }),
        { status: 400 }
      );
    }

    client = new PrismaClient();

    // Verificar si el módulo existe
    const existingModule = await client.module.findUnique({
      where: { id },
    });

    if (!existingModule) {
      return NextResponse.json(
        message({
          status: 404,
          message: "Módulo no encontrado",
          data: null,
          error: "El módulo especificado no existe",
        }),
        { status: 404 }
      );
    }


    // Actualizar el módulo
    const updatedModule = await client.module.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
      include: {
        topics: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
    });

    return NextResponse.json(
      message({
        status: 200,
        message: "Módulo actualizado exitosamente",
        data: updatedModule,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al actualizar el módulo:", error);
    return NextResponse.json(
      message({
        status: 500,
        message: "Error al actualizar el módulo",
        data: null,
        error: error.message || "Error desconocido",
      }),
      { status: 500 }
    );
  } finally {
    await client?.$disconnect();
  }
}

// Eliminar un módulo y todo su contenido relacionado
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let client;
  try {
    const id = params?.id;

    if (!id) {
      return NextResponse.json(
        message({
          status: 400,
          message: "Debe proporcionar un ID de módulo",
          data: null,
          error: "ID es requerido",
        }),
        { status: 400 }
      );
    }

    client = new PrismaClient();

    // Verificar si el módulo existe
    const existingModule = await client.module.findUnique({
      where: { id },
      include: {
        topics: {
          include: {
            activities: true
          }
        },
      },
    });

    if (!existingModule) {
      return NextResponse.json(
        message({
          status: 404,
          message: "Módulo no encontrado",
          data: null,
          error: "El módulo especificado no existe",
        }),
        { status: 404 }
      );
    }


    // Iniciar una transacción para eliminar todo el contenido relacionado
    await client.$transaction(async (prisma) => {
      // Primero, obtener todos los IDs de actividades
      const activityIds = existingModule.topics.flatMap(topic => 
        topic.activities.map(activity => activity.id)
      );

      // Eliminar registros de progreso relacionados con las actividades
      if (activityIds.length > 0) {
        await prisma.progress.deleteMany({
          where: {
            activityId: {
              in: activityIds
            }
          }
        });
      }

      // Luego eliminar las actividades
      for (const topic of existingModule.topics) {
        await prisma.activity.deleteMany({
          where: { topicId: topic.id },
        });
      }

      // Luego eliminar los tópicos
      await prisma.topic.deleteMany({
        where: { moduleId: id },
      });

      // Finalmente, eliminar el módulo
      await prisma.module.delete({
        where: { id },
      });
    });

    return NextResponse.json(
      message({
        status: 200,
        message: "Módulo y todo su contenido eliminados exitosamente",
        data: { moduleId: id },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar el módulo:", error);
    return NextResponse.json(
      message({
        status: 500,
        message: "Error al eliminar el módulo",
        data: null,
        error: error.message || "Error desconocido",
      }),
      { status: 500 }
    );
  } finally {
    await client?.$disconnect();
  }
}
