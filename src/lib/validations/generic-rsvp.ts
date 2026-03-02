import { z } from "zod/v4";

export const genericRsvpSchema = z.object({
  eventId: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Valid email is required"),
  phone: z.string().optional(),
  credentials: z.string().optional(),
  specialty: z.string().optional(),
  bringingGuest: z.boolean().optional(),
  guestFirstName: z.string().optional(),
  guestLastName: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
});

export type GenericRsvpInput = z.infer<typeof genericRsvpSchema>;
