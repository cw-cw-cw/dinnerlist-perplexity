"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventCreateSchema, eventUpdateSchema } from "@/lib/validations/event";
import type { EventStatus } from "@/generated/prisma";

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { error: string; fieldErrors?: Record<string, string[]> };

function parseFormDataToObject(formData: FormData): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      if (value === "") { raw[key] = undefined; continue; }
      if (key === "waitlistEnabled") { raw[key] = value === "on" || value === "true"; continue; }
      raw[key] = value;
    }
  }
  if (!formData.has("waitlistEnabled")) raw.waitlistEnabled = false;
  return raw;
}

function buildDateTimeFromForm(raw: Record<string, unknown>): Record<string, unknown> {
  const result = { ...raw };
  if (raw.date && raw.startTime) {
    result.startTime = new Date(`${raw.date as string}T${raw.startTime as string}`);
    result.date = new Date(`${raw.date as string}T00:00:00`);
  } else if (raw.date) {
    result.date = new Date(`${raw.date as string}T00:00:00`);
  }
  if (raw.date && raw.endTime) {
    result.endTime = new Date(`${raw.date as string}T${raw.endTime as string}`);
  }
  if (raw.rsvpDeadline && typeof raw.rsvpDeadline === "string") {
    result.rsvpDeadline = new Date(raw.rsvpDeadline);
  }
  return result;
}

export async function createEvent(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "You must be logged in to create an event." };

  const raw = parseFormDataToObject(formData);
  const processed = buildDateTimeFromForm(raw);
  const parsed = eventCreateSchema.safeParse(processed);

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.map(String).join(".");
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    return { error: "Please fix the validation errors below.", fieldErrors };
  }

  try {
    const data = parsed.data;
    const internalNotes = (formData.get("internalNotes") as string) || null;
    const event = await prisma.event.create({
      data: {
        name: data.name, eventType: data.eventType, status: data.status,
        date: data.date, startTime: data.startTime, endTime: data.endTime ?? null,
        venueName: data.venueName, venueAddress: data.venueAddress,
        venueCity: data.venueCity ?? null, venueState: data.venueState ?? null,
        venueImageUrl: data.venueImageUrl && data.venueImageUrl !== "" ? data.venueImageUrl : null,
        publicCapacity: data.publicCapacity, privateCapacity: data.privateCapacity,
        waitlistEnabled: data.waitlistEnabled, rsvpDeadline: data.rsvpDeadline ?? null,
        hostName: data.hostName ?? null,
        hostPhotoUrl: data.hostPhotoUrl && data.hostPhotoUrl !== "" ? data.hostPhotoUrl : null,
        hostBio: data.hostBio ?? null, description: data.description ?? null,
        invitationHeadline: data.invitationHeadline ?? null,
        invitationBody: data.invitationBody ?? null,
        confirmationMessage: data.confirmationMessage ?? null,
        internalNotes, seriesId: data.seriesId || null, templateId: data.templateId || null,
        organizationId: session.user.organizationId,
      },
    });
    revalidatePath("/admin/events");
    return { success: true, data: { id: event.id } };
  } catch (err) {
    console.error("Error creating event:", err);
    return { error: "Failed to create event. Please try again." };
  }
}

export async function updateEvent(eventId: string, formData: FormData): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "You must be logged in to update an event." };

  const existing = await prisma.event.findFirst({
    where: { id: eventId, organizationId: session.user.organizationId },
  });
  if (!existing) return { error: "Event not found." };

  const raw = parseFormDataToObject(formData);
  const processed = buildDateTimeFromForm(raw);
  const parsed = eventUpdateSchema.safeParse(processed);

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.map(String).join(".");
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    return { error: "Please fix the validation errors below.", fieldErrors };
  }

  try {
    const data = parsed.data;
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.eventType !== undefined) updateData.eventType = data.eventType;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.startTime !== undefined) updateData.startTime = data.startTime;
    if (data.endTime !== undefined) updateData.endTime = data.endTime;
    if (data.venueName !== undefined) updateData.venueName = data.venueName;
    if (data.venueAddress !== undefined) updateData.venueAddress = data.venueAddress;
    if (data.venueCity !== undefined) updateData.venueCity = data.venueCity;
    if (data.venueState !== undefined) updateData.venueState = data.venueState;
    if (data.venueImageUrl !== undefined) updateData.venueImageUrl = data.venueImageUrl && data.venueImageUrl !== "" ? data.venueImageUrl : null;
    if (data.publicCapacity !== undefined) updateData.publicCapacity = data.publicCapacity;
    if (data.privateCapacity !== undefined) updateData.privateCapacity = data.privateCapacity;
    if (data.waitlistEnabled !== undefined) updateData.waitlistEnabled = data.waitlistEnabled;
    if (data.rsvpDeadline !== undefined) updateData.rsvpDeadline = data.rsvpDeadline;
    if (data.hostName !== undefined) updateData.hostName = data.hostName;
    if (data.hostPhotoUrl !== undefined) updateData.hostPhotoUrl = data.hostPhotoUrl && data.hostPhotoUrl !== "" ? data.hostPhotoUrl : null;
    if (data.hostBio !== undefined) updateData.hostBio = data.hostBio;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.invitationHeadline !== undefined) updateData.invitationHeadline = data.invitationHeadline;
    if (data.invitationBody !== undefined) updateData.invitationBody = data.invitationBody;
    if (data.confirmationMessage !== undefined) updateData.confirmationMessage = data.confirmationMessage;
    if (data.seriesId !== undefined) updateData.seriesId = data.seriesId || null;
    if (data.templateId !== undefined) updateData.templateId = data.templateId || null;
    if (formData.has("internalNotes")) updateData.internalNotes = (formData.get("internalNotes") as string) || null;

    const event = await prisma.event.update({ where: { id: eventId }, data: updateData });
    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${eventId}`);
    return { success: true, data: { id: event.id } };
  } catch (err) {
    console.error("Error updating event:", err);
    return { error: "Failed to update event. Please try again." };
  }
}

export async function deleteEvent(eventId: string): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "You must be logged in to delete an event." };

  const existing = await prisma.event.findFirst({ where: { id: eventId, organizationId: session.user.organizationId } });
  if (!existing) return { error: "Event not found." };
  if (existing.status !== "DRAFT") return { error: "Only draft events can be deleted. Change status to Draft first." };

  try {
    await prisma.event.delete({ where: { id: eventId } });
    revalidatePath("/admin/events");
    return { success: true, data: { id: eventId } };
  } catch (err) {
    console.error("Error deleting event:", err);
    return { error: "Failed to delete event. Please try again." };
  }
}

export async function updateEventStatus(
  eventId: string, status: string
): Promise<ActionResult<{ id: string; status: string }>> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "You must be logged in to update event status." };

  const existing = await prisma.event.findFirst({ where: { id: eventId, organizationId: session.user.organizationId } });
  if (!existing) return { error: "Event not found." };

  try {
    const event = await prisma.event.update({
      where: { id: eventId },
      data: { status: status as EventStatus },
    });
    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${eventId}`);
    return { success: true, data: { id: event.id, status: event.status } };
  } catch (err) {
    console.error("Error updating event status:", err);
    return { error: "Failed to update event status. Please try again." };
  }
}
