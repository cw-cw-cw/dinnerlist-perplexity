import { z } from "zod/v4";

export const rsvpSubmitSchema = z.object({
  eventId: z.string(),
  inviteeId: z.string(),
  invitationId: z.string(),
  response: z.enum(["accept", "decline"]),
  bringingGuest: z.boolean().optional(),
  guestFirstName: z.string().optional(),
  guestLastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
});

export type RsvpSubmitInput = z.infer<typeof rsvpSubmitSchema>;
