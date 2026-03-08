import { z } from "zod";

export const VendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  gstin: z.string().optional(),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const BuyerSchema = z.object({
  name: z.string().min(1, "Buyer name is required"),
  brand_code: z.string().optional(),
  address: z.string().optional(),
  shipping_address: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const MaterialSchema = z.object({
  sku_code: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  unit_of_measure: z.string().min(1, "Unit of measure is required"),
  default_rate: z.number().nonnegative("Default rate must be non-negative").optional(),
});

export const StyleSchema = z.object({
  style_code: z.string().min(1, "Style code is required"),
  style_name: z.string().min(1, "Style name is required"),
  category: z.string().optional(),
  description: z.string().optional(),
});

export type VendorInput = z.infer<typeof VendorSchema>;
export type BuyerInput = z.infer<typeof BuyerSchema>;
export type MaterialInput = z.infer<typeof MaterialSchema>;
export type StyleInput = z.infer<typeof StyleSchema>;
