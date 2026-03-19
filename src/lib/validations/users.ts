import { z } from "zod";

const RoleEnum = z.enum([
  "ACCOUNTANT",
  "SENIOR_MERCHANDISER",
  "PRODUCTION_MANAGER",
  "MERCHANDISER",
  "STORE_MANAGER",
  "RUNNER",
  "CEO",
]);

export const CreateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: RoleEnum,
});

export const EditUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  role: RoleEnum.optional(),
  is_active: z.boolean().optional(),
});

export const ResetPasswordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(6, "New password must be at least 6 characters"),
  confirm_password: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type EditUserInput = z.infer<typeof EditUserSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
