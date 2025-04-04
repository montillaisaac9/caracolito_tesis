import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { message } from "../helpers/responsesMsg";

const topicSchema = z.object({
  title: z.string().min(1, "El título es obligatorio."),
  content: z.string().min(1, "El contenido es obligatorio."),
  order: z
    .number()
    .int()
    .positive("El orden debe ser un número entero positivo."),
  moduleId: z.string().min(1, "El módulo ID es obligatorio."),
});

//Obtener todos los topicos
export async function GET(req: NextRequest) {
  let client;

  try {
    const seach = req.nextUrl.searchParams;
    const page = seach.get("page") || "";
    const limit = seach.get("limit") || "";
    const offset = (parseInt(page) - 1) * parseInt(limit);

    client = await new PrismaClient();
    const topic = await client.topic.findMany({
      skip: offset,
      take: parseInt(limit),
    });

    client.$disconnect();

    return NextResponse.json(
      message({
        status: 200,
        message: "Topicos encontrados",
        data: { topic },
      })
    );
  } catch (error) {
    client?.$disconnect();
    return NextResponse.json(
      message({
        status: 400,
        message: "error General en creación de topico",
        data: error,
      })
    );
  }
}

export async function POST(req: Request) {
  let client;
  try {
    const body = await req.json();
    const validationBody = topicSchema.safeParse(body);

    if (!validationBody.success) {
      return NextResponse.json(
        message({
          status: 400,
          message: "error en el body",
          error: validationBody.error.format(),
        })
      );
    }

    const { title, content, order, moduleId } = validationBody.data;

    client = await new PrismaClient();

    const newTopic = await client.topic.create({
      data: { title, content, order, moduleId },
    });

    console.log("data topic", newTopic);
    client.$disconnect();
    return NextResponse.json(
      message({
        status: 200,
        message: "Topico creado",
        data: { createdTopic: newTopic },
      })
    );
  } catch (error) {
    client?.$disconnect();

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
