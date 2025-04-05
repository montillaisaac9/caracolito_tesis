import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";
import { message } from "../../helpers/responsesMsg";

export async function GET(req: NextRequest) {
  let client;
  try {
    const seach = req.nextUrl.searchParams;
    const id = seach.get("id") || "";

    if (!id) {
      return NextResponse.json(
        message({
          status: 400,
          message: "debe agregar un ID",
          data: {},
          error: "id NO puede estar vacio",
        })
      );
    }

    client = await new PrismaClient();
    const topic = await client.topic.findUnique({
      where: { id: id },
      include: {activities: true}
    });

    if (!topic) {
      return NextResponse.json(
        message({
          status: 400,
          message: "TOPIC no encontrado",
          data: [],
          error: "TOPIC no encontrado",
        })
      );
    }

    client.$disconnect();

    return NextResponse.json(
      message({ status: 200, message: `TOPIC encontrado`, data: [topic] })
    );
  } catch (error) {
    client?.$disconnect();

    return NextResponse.json({
      message: "error al buscar el TOPIC",
      data: error,
      status: 400,
    });
  }
}
