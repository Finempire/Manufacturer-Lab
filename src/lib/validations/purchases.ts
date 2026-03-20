import { z } from "zod";

export const PurchaseLineSchema = z.object({
  material_id: z.string().min(1, "Material is required"),
  style_id: z.string().optional(),
  quantity: z.number().positive("Quantity must be positive"),
  rate: z.number().nonnegative("Rate must be non-negative"),
  amount: z.number().nonnegative("Amount must be non-negative"),
});

export const PurchaseSchema = z.object({
  request_id: z.string().min(1, "Material request is required"),
  vendor_id: z.string().min(1, "Vendor is required"),
  invoice_no: z.string().min(1, "Invoice number is required"),
  invoice_date: z.string().min(1, "Invoice date is required"),
  invoice_amount: z.number().positive("Invoice amount must be positive"),
  invoice_files: z.array(z.string()).optional(),
  lines: z
    .array(PurchaseLineSchema)
    .min(1, "At least one purchase line is required"),
});

export type PurchaseLineInput = z.infer<typeof PurchaseLineSchema>;
export type PurchaseInput = z.infer<typeof PurchaseSchema>;
