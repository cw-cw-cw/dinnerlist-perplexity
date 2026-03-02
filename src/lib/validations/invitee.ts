import { z } from "zod/v4";

export const inviteeRowSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Invalid email address"),
  phone: z.string().optional(),
  title: z.string().optional(),
  credentials: z.string().optional(),
  specialty: z.string().optional(),
  practiceName: z.string().optional(),
  npiNumber: z.string().optional(),
  inviteeType: z.enum(["IN_PRACTICE", "RESIDENT_FELLOW"]).default("IN_PRACTICE"),
  yearStartedPractice: z.coerce.number().int().optional(),
});

export const csvUploadSchema = z.array(inviteeRowSchema);

export const inviteeUpdateSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Invalid email address"),
  phone: z.string().optional(),
  title: z.string().optional(),
  credentials: z.string().optional(),
  specialty: z.string().optional(),
  practiceName: z.string().optional(),
  npiNumber: z.string().optional(),
  inviteeType: z.enum(["IN_PRACTICE", "RESIDENT_FELLOW"]).default("IN_PRACTICE"),
  yearStartedPractice: z.coerce.number().int().optional(),
});

export type InviteeRowInput = z.infer<typeof inviteeRowSchema>;
export type InviteeUpdateInput = z.infer<typeof inviteeUpdateSchema>;
