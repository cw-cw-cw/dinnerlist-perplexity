"use server";

import { prisma } from "@/lib/prisma";
import { rsvpSubmitSchema, type RsvpSubmitInput } from "@/lib/validations/rsvp";

interface ActionResult {
  success: boolean;
  data?: { rsvpId: string; status: string; waitlistPosition?: number | null; manageToken?: string | null; };
  error?: string;
}

export async function submitRSVP(input: RsvpSubmitInput): Promise<ActionResult> {
  const parsed = rsvpSubmitSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { eventId, inviteeId, invitationId, response, bringingGuest,
    guestFirstName, guestLastName, phoneNumber, dietaryRestrictions } = parsed.data;

  const guestName = [guestFirstName, guestLastName].filter(Boolean).join(" ") || null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingRsvp = await tx.rSVP.findUnique({
        where: { eventId_inviteeId: { eventId, inviteeId } },
      });

      if (existingRsvp) {
        const updatedRsvp = await tx.rSVP.update({
          where: { id: existingRsvp.id },
          data: {
            status: response === "decline" ? "DECLINED" : existingRsvp.status,
            bringingGuest: response === "accept" ? (bringingGuest ?? false) : false,
            guestName: response === "accept" ? guestName : null,
            guestFirstName: response === "accept" ? (guestFirstName ?? null) : null,
            guestLastName: response === "accept" ? (guestLastName ?? null) : null,
            phoneNumber: phoneNumber ?? existingRsvp.phoneNumber,
            dietaryRestrictions: dietaryRestrictions ?? existingRsvp.dietaryRestrictions,
          },
        });

        if (response === "accept" && existingRsvp.status !== "CONFIRMED") {
          const confirmedRsvps = await tx.rSVP.findMany({
            where: { eventId, status: { in: ["CONFIRMED", "CHECKED_IN"] } },
            select: { bringingGuest: true, id: true },
          });
          const currentOccupancy = confirmedRsvps.reduce((sum, r) => sum + 1 + (r.bringingGuest ? 1 : 0), 0);
          const event = await tx.event.findUniqueOrThrow({ where: { id: eventId } });
          const newGuestCount = 1 + (bringingGuest ? 1 : 0);

          if (currentOccupancy + newGuestCount <= event.privateCapacity) {
            const confirmed = await tx.rSVP.update({
              where: { id: existingRsvp.id },
              data: {
                status: "CONFIRMED", confirmedAt: new Date(),
                bringingGuest: bringingGuest ?? false, guestName, guestFirstName: guestFirstName ?? null,
                guestLastName: guestLastName ?? null, phoneNumber: phoneNumber ?? null,
                dietaryRestrictions: dietaryRestrictions ?? null, cancelledAt: null, waitlistPosition: null,
              },
            });
            return { rsvpId: confirmed.id, status: confirmed.status, waitlistPosition: null, manageToken: confirmed.manageToken };
          } else if (event.waitlistEnabled) {
            const waitlistCount = await tx.rSVP.count({ where: { eventId, status: "WAITLISTED" } });
            const waitlisted = await tx.rSVP.update({
              where: { id: existingRsvp.id },
              data: {
                status: "WAITLISTED", waitlistPosition: waitlistCount + 1,
                bringingGuest: bringingGuest ?? false, guestName, guestFirstName: guestFirstName ?? null,
                guestLastName: guestLastName ?? null, phoneNumber: phoneNumber ?? null,
                dietaryRestrictions: dietaryRestrictions ?? null,
              },
            });
            return { rsvpId: waitlisted.id, status: waitlisted.status, waitlistPosition: waitlisted.waitlistPosition, manageToken: waitlisted.manageToken };
          } else {
            throw new Error("This event is fully booked");
          }
        }

        return { rsvpId: updatedRsvp.id, status: updatedRsvp.status, waitlistPosition: updatedRsvp.waitlistPosition, manageToken: updatedRsvp.manageToken };
      }

      if (response === "decline") {
        const rsvp = await tx.rSVP.create({
          data: { eventId, inviteeId, status: "DECLINED", bringingGuest: false },
        });
        await tx.invitation.update({ where: { id: invitationId }, data: { status: "RESPONDED" } });
        return { rsvpId: rsvp.id, status: rsvp.status, waitlistPosition: null, manageToken: rsvp.manageToken };
      }

      const event = await tx.event.findUniqueOrThrow({ where: { id: eventId } });
      const confirmedRsvps = await tx.rSVP.findMany({
        where: { eventId, status: { in: ["CONFIRMED", "CHECKED_IN"] } },
        select: { bringingGuest: true },
      });
      const currentOccupancy = confirmedRsvps.reduce((sum, r) => sum + 1 + (r.bringingGuest ? 1 : 0), 0);
      const newGuestCount = 1 + (bringingGuest ? 1 : 0);

      if (currentOccupancy + newGuestCount <= event.privateCapacity) {
        const rsvp = await tx.rSVP.create({
          data: {
            eventId, inviteeId, status: "CONFIRMED", confirmedAt: new Date(),
            bringingGuest: bringingGuest ?? false, guestName, guestFirstName: guestFirstName ?? null,
            guestLastName: guestLastName ?? null, phoneNumber: phoneNumber ?? null,
            dietaryRestrictions: dietaryRestrictions ?? null,
          },
        });
        await tx.invitation.update({ where: { id: invitationId }, data: { status: "RESPONDED" } });
        return { rsvpId: rsvp.id, status: rsvp.status, waitlistPosition: null, manageToken: rsvp.manageToken };
      } else if (event.waitlistEnabled) {
        const waitlistCount = await tx.rSVP.count({ where: { eventId, status: "WAITLISTED" } });
        const rsvp = await tx.rSVP.create({
          data: {
            eventId, inviteeId, status: "WAITLISTED", waitlistPosition: waitlistCount + 1,
            bringingGuest: bringingGuest ?? false, guestName, guestFirstName: guestFirstName ?? null,
            guestLastName: guestLastName ?? null, phoneNumber: phoneNumber ?? null,
            dietaryRestrictions: dietaryRestrictions ?? null,
          },
        });
        await tx.invitation.update({ where: { id: invitationId }, data: { status: "RESPONDED" } });
        return { rsvpId: rsvp.id, status: rsvp.status, waitlistPosition: rsvp.waitlistPosition, manageToken: rsvp.manageToken };
      } else {
        throw new Error("This event is fully booked");
      }
    }, { isolationLevel: "Serializable", timeout: 10000 });

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message };
    return { success: false, error: "An unexpected error occurred" };
  }
}

interface JoinWaitlistInput {
  eventId: string; inviteeId: string; invitationId: string; phoneNumber?: string;
}

export async function joinWaitlist(input: JoinWaitlistInput): Promise<ActionResult> {
  const { eventId, inviteeId, invitationId, phoneNumber } = input;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingRsvp = await tx.rSVP.findUnique({
        where: { eventId_inviteeId: { eventId, inviteeId } },
      });

      if (existingRsvp) {
        if (existingRsvp.status === "WAITLISTED") {
          return { rsvpId: existingRsvp.id, status: existingRsvp.status,
            waitlistPosition: existingRsvp.waitlistPosition, manageToken: existingRsvp.manageToken };
        }
        const waitlistCount = await tx.rSVP.count({ where: { eventId, status: "WAITLISTED" } });
        const updated = await tx.rSVP.update({
          where: { id: existingRsvp.id },
          data: { status: "WAITLISTED", waitlistPosition: waitlistCount + 1, phoneNumber: phoneNumber ?? existingRsvp.phoneNumber },
        });
        return { rsvpId: updated.id, status: updated.status, waitlistPosition: updated.waitlistPosition, manageToken: updated.manageToken };
      }

      const waitlistCount = await tx.rSVP.count({ where: { eventId, status: "WAITLISTED" } });
      const rsvp = await tx.rSVP.create({
        data: {
          eventId, inviteeId, status: "WAITLISTED", waitlistPosition: waitlistCount + 1,
          bringingGuest: false, phoneNumber: phoneNumber ?? null,
        },
      });
      await tx.invitation.update({ where: { id: invitationId }, data: { status: "RESPONDED" } });
      return { rsvpId: rsvp.id, status: rsvp.status, waitlistPosition: rsvp.waitlistPosition, manageToken: rsvp.manageToken };
    }, { isolationLevel: "Serializable", timeout: 10000 });

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message };
    return { success: false, error: "An unexpected error occurred" };
  }
}
