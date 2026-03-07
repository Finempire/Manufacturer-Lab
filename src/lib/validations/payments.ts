import { z } from "zod";

export const PaymentSchema = z.object({
  purchase_id: z.string().min(1, "Purchase is required"),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_method: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE"]),
  amount_paid: z.number().positive("Amount must be positive"),
  reference_id: z.string().optional(),
  payment_proof_path: z.string().min(1, "Payment proof is required"),
  notes: z.string().optional(),
});

export type PaymentInput = z.infer<typeof PaymentSchema>;
