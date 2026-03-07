import { z } from "zod";

export const OrderLineSchema = z.object({
  style_id: z.string().min(1, "Style is required"),
  description: z.string().optional(),
  quantity: z.number().positive("Quantity must be positive"),
  rate: z.number().nonnegative("Rate must be non-negative"),
  amount: z.number().nonnegative("Amount must be non-negative"),
});

export const CreateOrderSchema = z.object({
  buyer_id: z.string().min(1, "Buyer is required"),
  order_date: z.string().min(1, "Order date is required"),
  shipping_date: z.string().min(1, "Shipping date is required"),
  order_type: z.enum(["SAMPLE", "PRODUCTION"]),
  remarks: z.string().optional(),
  lines: z
    .array(OrderLineSchema)
    .min(1, "At least one order line is required"),
});

export type OrderLineInput = z.infer<typeof OrderLineSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
