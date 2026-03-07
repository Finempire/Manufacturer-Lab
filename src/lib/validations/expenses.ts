import { z } from "zod";

export const ExpenseRequestSchema = z.object({
  buyer_id: z.string().min(1, "Buyer is required"),
  order_id: z.string().min(1, "Order is required"),
  style_id: z.string().optional(),
  expense_date: z.string().min(1, "Expense date is required"),
  expense_category: z.enum([
    "JOB_WORK",
    "COURIER_SHIPPING",
    "LABOUR_OVERTIME",
    "MACHINE_REPAIR",
    "TESTING_LAB",
    "PACKAGING",
    "TRANSPORTATION",
    "WASHING_DYEING",
    "EMBROIDERY_PRINTING",
    "CUTTING_CHARGES",
    "FINISHING_CHARGES",
    "MISCELLANEOUS",
  ]),
  job_work_type: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  vendor_name: z.string().optional(),
  vendor_id: z.string().optional(),
  expected_amount: z.number().positive("Expected amount must be positive"),
  attachment_path: z.string().optional(),
});

export type ExpenseRequestInput = z.infer<typeof ExpenseRequestSchema>;
