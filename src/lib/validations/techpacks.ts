import { z } from "zod";

export const TechPackSchema = z.object({
  order_id: z.string().min(1, "Order is required"),
  merchandiser_id: z.string().optional(),
  fabric_details: z.string().optional(),
  trim_details: z.string().optional(),
  measurements: z.string().optional(),
  construction_notes: z.string().optional(),
});

export const TechPackRevisionSchema = z.object({
  tech_pack_id: z.string().min(1, "Tech pack is required"),
  revision_number: z.number().int().positive("Revision number must be positive"),
  document_path: z.string().min(1, "Document path is required"),
  pm_notes: z.string().optional(),
  status: z.enum(["SUBMITTED", "APPROVED", "REJECTED"]),
  submitted_by_id: z.string().min(1, "Submitter is required"),
  submitted_at: z.string().min(1, "Submission date is required"),
});

export type TechPackInput = z.infer<typeof TechPackSchema>;
export type TechPackRevisionInput = z.infer<typeof TechPackRevisionSchema>;
