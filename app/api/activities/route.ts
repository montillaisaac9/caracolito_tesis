import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { message } from "../helpers/responsesMsg";

 
// {
//     "title": "Curso de Introducción a Prisma",
//     "type": "LEARNING", 
//     "difficulty": "BEGINNER",
//     "config": {
//       "language": "ES",
//       "requirements": ["Computadora", "Conexión a Internet"]
//     },
//     "points": 15,
//     "timeLimit": 120,
//     "isActive": true,
//     "topicId": "abc123",
//     "createdById": "user567"
//   }

// Esquema Zod para validar el body de creación de una actividad
const ResourceSchema = z.object({
  title: z.string()
    .min(1, { message: "El título es obligatorio y no puede estar vacío" })
    .max(100, { message: "El título no puede tener más de 100 caracteres" }),
  type: z.enum(["LEARNING", "QUIZ", "PRACTICE"]), // Enum creado en línea
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]), // Enum creado en línea
  config: z
    .record(z.string(), z.any()) // Configuración flexible en formato JSON
    .optional(),
  points: z.number()
    .int()
    .min(0, { message: "Los puntos deben ser un número entero positivo" })
    .default(10),
  timeLimit: z.number()
    .int()
    .positive({ message: "El límite de tiempo debe ser un número positivo" })
    .optional(),
  isActive: z.boolean().default(true),
  topicId: z.string().min(1, { message: "El topicId es obligatorio" }),
  createdById: z.string().min(1, { message: "El createdById es obligatorio" }),
});


export async function POST(req:Request){
    try {
        const body = req.json()
        const validationBody = ResourceSchema.safeParse(body)

        if(!validationBody.success){
            return NextResponse.json(message({status:400,message:"error en el body",error:validationBody.error.format()}))
        }

        

    } catch (error) {
        return NextResponse.json(message({status:400, message:"error en el endpoint de activitie",data:{error}, error}))
    }  
}
