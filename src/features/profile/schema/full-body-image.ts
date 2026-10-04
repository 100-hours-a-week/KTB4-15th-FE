import { z } from "zod";

export const fullBodyImageValidationSchema = z.object({
  validationId: z.number().int().positive(),
  fullBodyImageUrl: z.string().url(),
});
