import { z } from "zod";

export const NeedLineSchema = z.object({
  material_name: z.string().min(1, "Material name is required"),
  description: z.string().optional(),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
});

export const MaterialNeedRequestSchema = z.object({
  order_id: z.string().min(1, "Order is required"),
  buyer_id: z.string().min(1, "Buyer is required"),
  style_id: z.string().min(1, "Style is required"),
  required_by_date: z.string().min(1, "Required by date is required"),
  special_instructions: z.string().optional(),
  lines: z
    .array(NeedLineSchema)
    .min(1, "At least one material line is required"),
});

export type NeedLineInput = z.infer<typeof NeedLineSchema>;
export type MaterialNeedRequestInput = z.infer<typeof MaterialNeedRequestSchema>;
