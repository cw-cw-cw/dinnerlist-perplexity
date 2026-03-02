"use server";

import { prisma } from "@/lib/prisma";
import { genericRsvpSchema, type GenericRsvpInput } from "@/lib/validations/generic-rsvp";

interface GenericRsvpResult {
  success: boolean;
  data?: { rsvpId: string; status: string; manageToken?: string | null; waitlistPosition?: number | null; };
  error?: string;
}

export async function submitGenericRSVP(input: GenericRsvpInput): Promise<GenericRsvpResult> {
  const parsed = genericRsvpSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { eventId, firstName, lastName, email, phone, credentials, specialty,
    bringingGuest, guestFirstName, guestLastName, dietaryRestrictions } = parsed.data;

  const guestName = [guestFirstName, guestLastName].filter(Boolean).join(" ") || null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: { organization: { select: { id: true } } },
      });

      if (!event) throw new Error("Event not found");
      if (!["OPEN", "FULL", "WAITLIST_ONLY"].includes(event.status)) {
        throw new Error("This event is not currently accepting RSVPs");
      }

      const organizationId = event.organization.id;

      let invitee = await tx.invitee.findUnique({
        where: { email_organizationId: { email: email.toLowerCase(), organizationId } },
      });

      if (!invitee) {
        invitee = await tx.invitee.create({
          data: { firstName, lastName, email: email.toLowerCase(), phone: phone ?? null,
            credentials: credentials ?? null, specialty: specialty ?? null,
            source: "walk-in", organizationId },
        });
      } else {
        invitee = await tx.invitee.update({
          where: { id: invitee.id },
          data: { firstName, lastName, phone: phone ?? invitee.phone,
            credentials: credentials ?? invitee.credentials, specialty: specialty ?? invitee.specialty },
        });
      }

      let invitation = await tx.invitation.findUnique({
        where: { eventId_inviteeId: { eventId, inviteeId: invitee.id } },
      });

      if (!invitation) {
        invitation = await tx.invitation.create({ data: { eventId, inviteeId: invitee.id, status: "RESPONDED" } });
      } else {
        await tx.invitation.update({ where: { id: invitation.id }, data: { status: "RESPONDED" } });
      }

      const existingRsvp = await tx.rSVP.findUnique({
        where: { eventId_inviteeId: { eventId, inviteeId: invitee.id } },
      });

      if (existingRsvp && (existingRsvp.status === "CONFIRMED" || existingRsvp.status === "WAITLISTED")) {
        return { rsvpId: existingRsvp.id, status: existingRsvp.status,
          manageToken: existingRsvp.manageToken, waitlistPosition: existingRsvp.waitlistPosition };
      }

      const confirmedRsvps = await tx.rSVP.findMany({
        where: { eventId, status: { in: ["CONFIRMED", "CHECKED_IN"] } },
        select: { bringingGuest: true },
      });

      const currentOccupancy = confirmedRsvps.reduce(
        (sum, r) => sum + 1 + (r.bringingGuest ? 1 : 0), 0
      );
      const newGuestCount = 1 + (bringingGuest ? 1 : 0);

      if (currentOccupancy + newGuestCount <= event.privateCapacity) {
        const rsvpData = {
          eventId, inviteeId: invitee.id, status: "CONFIRMED" as const,
          confirmedAt: new Date(), bringingGuest: bringingGuest ?? false,
          guestName: bringingGuest ? guestName : null,
          guestFirstName: bringingGuest ? (guestFirstName ?? null) : null,
          guestLastName: bringingGuest ? (guestLastName ?? null) : null,
          phoneNumber: phone ?? null, dietaryRestrictions: dietaryRestrictions ?? null,
        };
        let rsvp;
        if (existingRsvp) {
          rsvp = await tx.rSVP.update({ where: { id: existingRsvp.id }, data: { ...rsvpData, cancelledAt: null, waitlistPosition: null } });
        } else {
          rsvp = await tx.rSVP.create({ data: rsvpData });
        }
        return { rsvpId: rsvp.id, status: rsvp.status, manageToken: rsvp.manageToken, waitlistPosition: null };
      } else if (event.waitlistEnabled) {
        const waitlistCount = await tx.rSVP.count({ where: { eventId, status: "WAITLISTED" } });
        const rsvpData = {
          eventId, inviteeId: invitee.id, status: "WAITLISTED" as const,
          waitlistPosition: waitlistCount + 1, bringingGuest: bringingGuest ?? false,
          guestName: bringingGuest ? guestName : null,
          guestFirstName: bringingGuest ? (guestFirstName ?? null) : null,
          guestLastName: bringingGuest ? (guestLastName ?? null) : null,
          phoneNumber: phone ?? null, dietaryRestrictions: dietaryRestrictions ?? null,
        };
        let rsvp;
        if (existingRsvp) {
          rsvp = await tx.rSVP.update({ where: { id: existingRsvp.id }, data: rsvpData });
        } else {
          rsvp = await tx.rSVP.create({ data: rsvpData });
        }
        return { rsvpId: rsvp.id, status: rsvp.status, manageToken: rsvp.manageToken, waitlistPosition: rsvp.waitlistPosition };
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
