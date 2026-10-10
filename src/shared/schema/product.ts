import { z } from "zod";

export const productItemTypeSchema = z.enum(["TOP", "BOTTOM"]);

export type ProductItemType = z.infer<typeof productItemTypeSchema>;
