import { z } from "zod/v4";

export const createAdminUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER"]),
});

export const updateAdminUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.email("Valid email is required"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER"]),
});

export const resetPasswordSchema = z.object({
  id: z.string(),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
export type UpdateAdminUserInput = z.infer<typeof updateAdminUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
