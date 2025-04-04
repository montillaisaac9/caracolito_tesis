import { CreateModuleResponse } from "@/app/types/response";
import { ZodFormattedError } from "zod";

interface messageParams {
  status: number;
  message: string;
  data?: CreateModuleResponse | unknown;
  error?: Error | ZodFormattedError<string> | string | unknown;
}

export function message({ status, message, data, error }: messageParams) {
  if (status == 200) {
    return {
      status,
      message: message,
      data,
    };
  }

  return {
    message,
    status,
    data: {
      error,
    },
  };

  return;
}
