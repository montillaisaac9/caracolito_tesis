import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const ResourceSchema = z.object({
  idActivitie: z.string().nonempty("idActivitie is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationBody = ResourceSchema.safeParse(body);

    if (!validationBody.success) {
      return NextResponse.json(
        { success: false, error: validationBody.error.format() },
        { status: 400 }
      );
    }
    const client = new PrismaClient();

    const content: { idActivitie: string } = validationBody?.data;
    const progressRecords = await client.progress.findMany({
      where: {
        activityId: content.idActivitie,
      },
      select: {
        feedback: true,
        completed:true,
        id:true,
        student: true,
        activity:{
            select:{
                title:true,
                type:true,
                isActive:true
            }
        }
      },
    });

    if(!progressRecords.length){
        return NextResponse.json(
            { success: false, error: 'Actividad no existe' },
            { status: 400 }
          );
    }
    return NextResponse.json({code:200, message:"progreso de estudiantes en la actividad", data:progressRecords });
  } catch (error) {
    return NextResponse.json({message:"error al obtener progreso", data:error })
  }
}
