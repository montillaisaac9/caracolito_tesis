import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

const NotificationSchema = z.object({
    title: z.string({required_error: "El título es obligatorio",}).min(1, "El título no puede estar vacío").max(100, "El título no puede exceder 100 caracteres"),
    message: z.string({required_error: "El mensaje es obligatorio",}).min(1, "El mensaje no puede estar vacío"),
    userId: z.string().min(1, "El ID de usuario es obligatorio"),
});

const NotificationUpdateSchema = z.object({
  title: z.string().min(1, "El título no puede estar vacío").max(100, "El título no puede exceder 100 caracteres").optional(),
  message: z.string().min(1, "El mensaje no puede estar vacío").optional(),
  read: z.boolean().optional(),
  userId: z.string().min(1, "El ID de usuario es obligatorio").optional(),
});

// crear notification
export async function POST(request: Request) {
    try {
      const body = await request.json();
      const validation = NotificationSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json({
          status: 400,
          message: "Error de validación",
          errors: validation.error.flatten(),
        }, { status: 400 });
      }
  
      const userExists = await prisma.user.findUnique({
        where: { id: validation.data.userId },
      });
  
      if (!userExists) {
        return NextResponse.json({
          status: 404,
          message: "Usuario no encontrado",
        }, { status: 404 });
      }
  
      const notification = await prisma.notification.create({
        data: validation.data,
      });
  
      return NextResponse.json({
        status: 201,
        message: "Notificación creada exitosamente",
        data: notification,
      }, { status: 201 });
  
    } catch (error) {
      console.error("Error creando la notificación:", error);
      return NextResponse.json({
        status: 500,
        message: "Error interno del servidor al crear la notificación",
      }, { status: 500 });
    }
  }

//   obtener notifications
export async function GET(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");
      const userId = searchParams.get("userId");
      const readParam = searchParams.get("read");
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
  
      if (id && (userId || readParam)) {
        return NextResponse.json({
          status: 400,
          message: "El parámetro 'id' no puede usarse con otros filtros",
        }, { status: 400 });
      }
  
      if (id) {
        const notification = await prisma.notification.findUnique({
          where: { id },
        });
  
        if (!notification) {
          return NextResponse.json({
            status: 404,
            message: "Notificación no encontrada",
          }, { status: 404 });
        }
  
        return NextResponse.json({
          status: 200,
          message: "Notificación obtenida exitosamente",
          data: notification,
        }, { status: 200 });
      }
  
      const where: any = {};
  
      if (userId) {
        where.userId = userId;
      }
  
      if (readParam !== null) {
        where.read = readParam.toLowerCase() === 'true';
      }
  
      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.notification.count({ where }),
      ]);
  
      return NextResponse.json({
        status: 200,
        message: "Notificaciones obtenidas exitosamente",
        data: notifications,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          filters: {
            userId: userId || 'no aplicado',
            read: readParam !== null ? readParam : 'no aplicado',
          },
        },
      }, { status: 200 });
  
    } catch (error) {
      console.error("Error obteniendo notificaciones:", error);
      return NextResponse.json({
        status: 500,
        message: "Error interno del servidor al obtener notificaciones",
      }, { status: 500 });
    }
}

// cambiar de no leido a leido rapidamente
export async function PATCH(request: Request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        const readParam = url.searchParams.get("read"); // Nuevo parámetro

        if (!id) {
            return NextResponse.json({
                status: 400,
                message: "Se requiere el ID de la notificación como query param",
            }, { status: 400 });
        }

        // Validar el parámetro 'read'
        if (readParam === null || !['true', 'false'].includes(readParam)) {
            return NextResponse.json({
                status: 400,
                message: "El parámetro 'read' es requerido y debe ser 'true' o 'false'",
            }, { status: 400 });
        }

        const newReadValue = readParam === 'true';

        // Verificar que la notificación existe
        const existingNotification = await prisma.notification.findUnique({
            where: { id },
        });

        if (!existingNotification) {
            return NextResponse.json({
                status: 404,
                message: "Notificación no encontrada",
            }, { status: 404 });
        }

        // Actualizar con el valor especificado
        const updatedNotification = await prisma.notification.update({
            where: { id },
            data: {
                read: newReadValue
            },
        });

        return NextResponse.json({
            status: 200,
            message: `Estado de lectura actualizado a ${newReadValue}`,
            data: updatedNotification,
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error actualizando el estado de lectura:", error);
        
        if (error.code === 'P2025') {
            return NextResponse.json({
                status: 404,
                message: "Notificación no encontrada",
            }, { status: 404 });
        }

        return NextResponse.json({
            status: 500,
            message: "Error interno del servidor al actualizar el estado de lectura",
        }, { status: 500 });
    }
}

//   actualizar notification
export async function PUT(request: Request) {
    try {
      const url = new URL(request.url);
      const id = url.searchParams.get("id");
  
      if (!id) {
        return NextResponse.json({
          status: 400,
          message: "Se requiere el ID de la notificación como query param",
        }, { status: 400 });
      }
  
      const body = await request.json();
      const validation = NotificationUpdateSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json({
          status: 400,
          message: "Error de validación",
          errors: validation.error.flatten(),
        }, { status: 400 });
      }
  
      // Verificar que la notificación existe
      const existingNotification = await prisma.notification.findUnique({
        where: { id },
      });
  
      if (!existingNotification) {
        return NextResponse.json({
          status: 404,
          message: "Notificación no encontrada",
        }, { status: 404 });
      }
  
      // Verificar que el usuario existe si se está actualizando
      if (validation.data.userId) {
        const userExists = await prisma.user.findUnique({
          where: { id: validation.data.userId },
        });
  
        if (!userExists) {
          return NextResponse.json({
            status: 404,
            message: "Usuario no encontrado",
          }, { status: 404 });
        }
      }
  
      const updatedNotification = await prisma.notification.update({
        where: { id },
        data: validation.data,
      });
  
      return NextResponse.json({
        status: 200,
        message: "Notificación actualizada exitosamente",
        data: updatedNotification,
      }, { status: 200 });
  
    } catch (error: any) {
      console.error("Error actualizando la notificación:", error);
      
      if (error.code === 'P2025') {
        return NextResponse.json({
          status: 404,
          message: "Notificación no encontrada",
        }, { status: 404 });
      }
  
      return NextResponse.json({
        status: 500,
        message: "Error interno del servidor al actualizar la notificación",
      }, { status: 500 });
    }
}

//   borrar notfications
export async function DELETE(request: Request) {
    try {
      const url = new URL(request.url);
      const id = url.searchParams.get("id");
  
      if (!id) {
        return NextResponse.json({
          status: 400,
          message: "Se requiere el ID de la notificación como query param",
        }, { status: 400 });
      }
  
      // Verificar que la notificación existe
      const existingNotification = await prisma.notification.findUnique({
        where: { id },
      });
  
      if (!existingNotification) {
        return NextResponse.json({
          status: 404,
          message: "Notificación no encontrada",
        }, { status: 404 });
      }
  
      await prisma.notification.delete({
        where: { id },
      });
  
      return NextResponse.json({
        status: 200,
        message: "Notificación eliminada exitosamente",
        data: { id },
      }, { status: 200 });
  
    } catch (error: any) {
      console.error("Error eliminando la notificación:", error);
      
      if (error.code === 'P2025') {
        return NextResponse.json({
          status: 404,
          message: "Notificación no encontrada",
        }, { status: 404 });
      }
  
      return NextResponse.json({
        status: 500,
        message: "Error interno del servidor al eliminar la notificación",
      }, { status: 500 });
    }
}