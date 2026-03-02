import { z } from "zod/v4";

export const eventCreateSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  eventType: z.enum(["IN_PRACTICE", "RESIDENT_FELLOW"]),
  status: z.enum(["DRAFT", "OPEN", "FULL", "WAITLIST_ONLY", "CLOSED", "COMPLETED"]).default("DRAFT"),
  date: z.coerce.date(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional(),
  venueName: z.string().min(1, "Venue name is required"),
  venueAddress: z.string().min(1, "Venue address is required"),
  venueCity: z.string().optional(),
  venueState: z.string().optional(),
  venueImageUrl: z.string().optional(),
  publicCapacity: z.coerce.number().int().min(1, "Public capacity must be at least 1"),
  privateCapacity: z.coerce.number().int().min(1, "Private capacity must be at least 1"),
  waitlistEnabled: z.boolean().default(true),
  rsvpDeadline: z.coerce.date().optional(),
  hostName: z.string().optional(),
  hostPhotoUrl: z.string().optional(),
  hostBio: z.string().optional(),
  description: z.string().optional(),
  invitationHeadline: z.string().optional(),
  invitationBody: z.string().optional(),
  confirmationMessage: z.string().optional(),
  seriesId: z.string().optional(),
  templateId: z.string().optional(),
}).refine(
  (data) => data.privateCapacity >= data.publicCapacity,
  { message: "Private capacity must be >= public capacity", path: ["privateCapacity"] }
);

export const eventUpdateSchema = eventCreateSchema.partial();

export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
