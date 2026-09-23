import { z } from "zod";

function responseSchema<T>(dataSchema: z.ZodType<T>) {
  return z.object({
    code: z.string(),
    data: dataSchema,
    message: z.string(),
  });
}

export async function parseResponse<T>(
  response: Response,
  dataSchema: z.ZodType<T>,
): Promise<T> {
  const json: unknown = await response.json();
  const result = responseSchema(dataSchema).parse(json);

  return result.data;
}
