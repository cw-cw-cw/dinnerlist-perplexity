"use server";

import { prisma } from "@/lib/prisma";

interface ManageRsvpResult { success: boolean; error?: string; }

export async function cancelRsvp(manageToken: string): Promise<ManageRsvpResult> {
  if (!manageToken) return { success: false, error: "Invalid token" };

  try {
    const rsvp = await prisma.rSVP.findUnique({ where: { manageToken } });
    if (!rsvp) return { success: false, error: "RSVP not found" };
    if (rsvp.status === "CANCELLED") return { success: true };

    await prisma.rSVP.update({
      where: { id: rsvp.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    return { success: true };
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message };
    return { success: false, error: "An unexpected error occurred" };
  }
}

interface UpdateRsvpData {
  bringingGuest: boolean; guestFirstName?: string | null; guestLastName?: string | null;
  phoneNumber: string; dietaryRestrictions?: string | null;
}

export async function updateRsvp(manageToken: string, data: UpdateRsvpData): Promise<ManageRsvpResult> {
  if (!manageToken) return { success: false, error: "Invalid token" };

  try {
    const rsvp = await prisma.rSVP.findUnique({ where: { manageToken } });
    if (!rsvp) return { success: false, error: "RSVP not found" };
    if (rsvp.status === "CANCELLED") return { success: false, error: "Cannot update a cancelled RSVP" };

    const guestName = data.bringingGuest
      ? [data.guestFirstName, data.guestLastName].filter(Boolean).join(" ") || null
      : null;

    await prisma.rSVP.update({
      where: { id: rsvp.id },
      data: {
        bringingGuest: data.bringingGuest,
        guestName,
        guestFirstName: data.bringingGuest ? (data.guestFirstName ?? null) : null,
        guestLastName: data.bringingGuest ? (data.guestLastName ?? null) : null,
        phoneNumber: data.phoneNumber || rsvp.phoneNumber,
        dietaryRestrictions: data.dietaryRestrictions ?? rsvp.dietaryRestrictions,
      },
    });
    return { success: true };
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message };
    return { success: false, error: "An unexpected error occurred" };
  }
}
