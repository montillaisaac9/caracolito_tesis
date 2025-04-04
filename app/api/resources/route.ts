import { ResourceType } from "@/app/types/resources";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";

const ResourceSchema = z.object({
  title: z.string().nonempty("Title is required"),
  type: z.enum(["DOCUMENT", "VIDEO", "LINK", "IMAGE"]),
  url: z.string(),
  content: z.string(),
});

//Agregar recurso
export async function POST(req: Request) {
  try {
    const body: ResourceType = await req.json();
    const validationBody = ResourceSchema.safeParse(body);

    if (!validationBody.success) {
      return NextResponse.json(
        { success: false, error: validationBody.error.format() },
        { status: 400 }
      );
    }

    const prisma = await new PrismaClient();
    const content: ResourceType = validationBody?.data;
    const newResourse =
      (await prisma.resource.create({ data: { ...content } })) ?? {};

    return NextResponse.json({
      status: 200,
      message: "Recurso creado correctamente",
      data: {
        element: { ...newResourse },
      },
    });
  } catch (error) {
    return NextResponse.json({
      message: "error al crear recurso",
      data: error,
      status: 400,
    });
  }
}
