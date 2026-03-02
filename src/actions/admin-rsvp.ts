"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type ActionSuccess<T = undefined> = T extends undefined ? { success: true } : { success: true; data: T };
type ActionError = { error: string };
type ActionResult<T = undefined> = ActionSuccess<T> | ActionError;

export async function adminSetRsvpStatus(rsvpId: string, newStatus: string): Promise<ActionResult> {
  const session = await auth();
  const orgId = session?.user?.organizationId;
  if (!orgId) return { error: "Unauthorized" };

  const validStatuses = ["CONFIRMED", "WAITLISTED", "DECLINED", "CANCELLED", "CHECKED_IN", "NO_SHOW"];
  if (!validStatuses.includes(newStatus)) return { error: "Invalid status" };

  try {
    const rsvp = await prisma.rSVP.findUnique({
      where: { id: rsvpId },
      include: { event: { select: { id: true, organizationId: true } } },
    });

    if (!rsvp) return { error: "RSVP not found" };
    if (rsvp.event.organizationId !== orgId) return { error: "Unauthorized" };

    const now = new Date();
    const timestampUpdates: Record<string, Date | null> = {};

    switch (newStatus) {
      case "CONFIRMED":
        timestampUpdates.confirmedAt = now;
        timestampUpdates.cancelledAt = null;
        timestampUpdates.waitlistPosition = null as unknown as Date;
        break;
      case "CANCELLED":
        timestampUpdates.cancelledAt = now;
        break;
      case "CHECKED_IN":
        timestampUpdates.checkedInAt = now;
        timestampUpdates.confirmedAt = rsvp.confirmedAt ?? now;
        break;
      case "WAITLISTED": {
        const waitlistCount = await prisma.rSVP.count({
          where: { eventId: rsvp.eventId, status: "WAITLISTED" },
        });
        timestampUpdates.waitlistPosition = (waitlistCount + 1) as unknown as Date;
        timestampUpdates.confirmedAt = null;
        timestampUpdates.cancelledAt = null;
        break;
      }
      case "DECLINED":
        timestampUpdates.cancelledAt = null;
        timestampUpdates.confirmedAt = null;
        break;
    }

    await prisma.rSVP.update({
      where: { id: rsvpId },
      data: {
        status: newStatus as "CONFIRMED" | "WAITLISTED" | "DECLINED" | "CANCELLED" | "CHECKED_IN" | "NO_SHOW",
        ...timestampUpdates,
      },
    });

    revalidatePath(`/admin/events/${rsvp.event.id}/invitees`);
    revalidatePath(`/admin/events/${rsvp.event.id}`);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "An unexpected error occurred" };
  }
}

export async function adminCreateManualRsvp(
  invitationId: string, status: string,
  opts?: { eventId: string; inviteeId: string }
): Promise<ActionResult<{ invitation: unknown }>> {
  const session = await auth();
  const orgId = session?.user?.organizationId;
  if (!orgId) return { error: "Unauthorized" };

  try {
    let eventId: string;
    let inviteeId: string;

    if (opts) {
      eventId = opts.eventId;
      inviteeId = opts.inviteeId;
    } else {
      const inv = await prisma.invitation.findUnique({ where: { id: invitationId } });
      if (!inv) return { error: "Invitation not found" };
      eventId = inv.eventId;
      inviteeId = inv.inviteeId;
    }

    const event = await prisma.event.findFirst({ where: { id: eventId, organizationId: orgId } });
    if (!event) return { error: "Event not found" };

    const result = await prisma.$transaction(async (tx) => {
      const existingRsvp = await tx.rSVP.findUnique({
        where: { eventId_inviteeId: { eventId, inviteeId } },
      });

      if (existingRsvp) {
        await tx.rSVP.update({
          where: { id: existingRsvp.id },
          data: {
            status: status as "CONFIRMED" | "WAITLISTED" | "DECLINED" | "CANCELLED" | "CHECKED_IN" | "NO_SHOW",
            confirmedAt: status === "CONFIRMED" ? new Date() : existingRsvp.confirmedAt,
          },
        });
      } else {
        let inv = await tx.invitation.findUnique({ where: { eventId_inviteeId: { eventId, inviteeId } } });
        if (!inv) {
          inv = await tx.invitation.create({ data: { eventId, inviteeId, status: "RESPONDED" } });
        } else {
          await tx.invitation.update({ where: { id: inv.id }, data: { status: "RESPONDED" } });
        }
        await tx.rSVP.create({
          data: {
            eventId, inviteeId,
            status: status as "CONFIRMED" | "WAITLISTED" | "DECLINED" | "CANCELLED" | "CHECKED_IN" | "NO_SHOW",
            confirmedAt: status === "CONFIRMED" ? new Date() : null,
            respondedAt: new Date(), bringingGuest: false,
          },
        });
      }

      const invitation = await tx.invitation.findUnique({
        where: { eventId_inviteeId: { eventId, inviteeId } },
        include: { invitee: true, rsvp: true },
      });
      return { invitation };
    });

    revalidatePath(`/admin/events/${eventId}/invitees`);
    revalidatePath(`/admin/events/${eventId}`);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "An unexpected error occurred" };
  }
}

export async function adminCreateInviteeAndRsvp(opts: {
  eventId: string; firstName: string; lastName: string; email: string;
  phone?: string; specialty?: string; rsvpStatus: string;
}): Promise<ActionResult<{ invitation: unknown }>> {
  const session = await auth();
  const orgId = session?.user?.organizationId;
  if (!orgId) return { error: "Unauthorized" };

  if (!opts.firstName || !opts.lastName || !opts.email) {
    return { error: "First name, last name, and email are required" };
  }

  try {
    const event = await prisma.event.findFirst({ where: { id: opts.eventId, organizationId: orgId } });
    if (!event) return { error: "Event not found" };

    const result = await prisma.$transaction(async (tx) => {
      let invitee = await tx.invitee.findUnique({
        where: { email_organizationId: { email: opts.email.toLowerCase().trim(), organizationId: orgId } },
      });

      if (!invitee) {
        invitee = await tx.invitee.create({
          data: {
            firstName: opts.firstName.trim(), lastName: opts.lastName.trim(),
            email: opts.email.toLowerCase().trim(), phone: opts.phone?.trim() || null,
            specialty: opts.specialty?.trim() || null, source: "manual", organizationId: orgId,
          },
        });
      }

      let inv = await tx.invitation.findUnique({
        where: { eventId_inviteeId: { eventId: opts.eventId, inviteeId: invitee.id } },
      });

      if (!inv) {
        inv = await tx.invitation.create({ data: { eventId: opts.eventId, inviteeId: invitee.id, status: "RESPONDED" } });
      } else {
        await tx.invitation.update({ where: { id: inv.id }, data: { status: "RESPONDED" } });
      }

      const existingRsvp = await tx.rSVP.findUnique({
        where: { eventId_inviteeId: { eventId: opts.eventId, inviteeId: invitee.id } },
      });

      if (existingRsvp) {
        await tx.rSVP.update({
          where: { id: existingRsvp.id },
          data: {
            status: opts.rsvpStatus as "CONFIRMED" | "WAITLISTED" | "DECLINED" | "CANCELLED" | "CHECKED_IN" | "NO_SHOW",
            confirmedAt: opts.rsvpStatus === "CONFIRMED" ? new Date() : existingRsvp.confirmedAt,
          },
        });
      } else {
        await tx.rSVP.create({
          data: {
            eventId: opts.eventId, inviteeId: invitee.id,
            status: opts.rsvpStatus as "CONFIRMED" | "WAITLISTED" | "DECLINED" | "CANCELLED" | "CHECKED_IN" | "NO_SHOW",
            confirmedAt: opts.rsvpStatus === "CONFIRMED" ? new Date() : null,
            respondedAt: new Date(), bringingGuest: false,
          },
        });
      }

      const invitation = await tx.invitation.findUnique({
        where: { eventId_inviteeId: { eventId: opts.eventId, inviteeId: invitee.id } },
        include: { invitee: true, rsvp: true },
      });
      return { invitation };
    });

    revalidatePath(`/admin/events/${opts.eventId}/invitees`);
    revalidatePath(`/admin/events/${opts.eventId}`);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "An unexpected error occurred" };
  }
}
