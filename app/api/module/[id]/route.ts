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
          message: "debe agregar un id",
          data: {},
          error: "id NO puede estar vacio",
        })
      );
    }

    client = await new PrismaClient();
    const myModule = await client.module.findUnique({
      where: { id },
      include: { topics: true },
    });

    if (!myModule) {
      return NextResponse.json(
        message({
          status: 400,
          message: "recurso no encontrado",
          data: [],
          error: "recurso no encontrado",
        })
      );
    }

    client.$disconnect();
    return NextResponse.json(
      message({ status: 200, message: `recurso encontrado`, data: [myModule] })
    );
  } catch (error) {
    client?.$disconnect();
    console.log(error);

    return NextResponse.json(
      message({
        status: 400,
        message: "error en endpoint de obtener un modulo",
      })
    );
  }
}
