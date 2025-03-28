import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";
import { message } from "../../helpers/responsesMsg";

export async function GET(req: NextRequest) {
  try {
    const seach = req.nextUrl.searchParams;
    const idUser = seach.get("id") || "";

    if (!idUser) {
      return NextResponse.json(
        message({
          status: 400,
          message: "debe agregar un id",
          data: {},
          error: "id NO puede estar vacio",
        })
      );
    }

    const client = await new PrismaClient();
    const resource = await client.resource.findUnique({
      where: { id: idUser },
    });

    if (!resource) {
      return NextResponse.json(
        message({
          status: 400,
          message: "recurso no encontrado",
          data: [],
          error: "recurso no encontrado",
        })
      );
    }

    console.log(resource);

    return NextResponse.json(
      message({ status: 200, message: `recurso encontrado`, data: [resource] })
    );
  } catch (error) {
    return NextResponse.json({
      message: "error al buscar el recurso",
      data: error,
      status: 400,
    });
  }
}
