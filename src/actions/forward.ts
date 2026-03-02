"use server";

import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/email";
import { ForwardInvitationEmail } from "@/emails/forward-invitation";
import { formatShortDate, formatEventTime } from "@/lib/utils/dates";

export async function forwardInvitation({
  token, friendFirstName, friendLastName, friendEmail,
}: {
  token: string; friendFirstName: string; friendLastName: string; friendEmail: string;
}): Promise<{ success: true; data: { invitationToken: string } } | { error: string }> {
  if (!friendFirstName.trim()) return { error: "Friend's first name is required" };
  if (!friendLastName.trim()) return { error: "Friend's last name is required" };
  if (!friendEmail.trim()) return { error: "Friend's email is required" };

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        event: {
          select: {
            id: true, name: true, date: true, startTime: true,
            venueName: true, venueAddress: true, venueCity: true, venueState: true,
            organizationId: true, status: true,
          },
        },
        invitee: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!invitation) return { error: "Invitation not found" };
    if (!["OPEN", "FULL", "WAITLIST_ONLY"].includes(invitation.event.status)) {
      return { error: "This event is not currently accepting RSVPs" };
    }

    const { event, invitee: referrer } = invitation;

    const organization = await prisma.organization.findUnique({
      where: { id: event.organizationId },
      select: { name: true, logoUrl: true, website: true, contactEmail: true },
    });

    let friendInvitee = await prisma.invitee.findUnique({
      where: {
        email_organizationId: {
          email: friendEmail.toLowerCase().trim(),
          organizationId: event.organizationId,
        },
      },
    });

    if (!friendInvitee) {
      friendInvitee = await prisma.invitee.create({
        data: {
          firstName: friendFirstName.trim(), lastName: friendLastName.trim(),
          email: friendEmail.toLowerCase().trim(), source: "referral",
          organizationId: event.organizationId,
        },
      });
    }

    let friendInvitation = await prisma.invitation.findUnique({
      where: { eventId_inviteeId: { eventId: event.id, inviteeId: friendInvitee.id } },
    });

    if (!friendInvitation) {
      friendInvitation = await prisma.invitation.create({
        data: {
          eventId: event.id, inviteeId: friendInvitee.id,
          referredByInviteeId: referrer.id, status: "SENT", sentAt: new Date(),
        },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const rsvpUrl = `${baseUrl}/rsvp/${friendInvitation.token}`;

    try {
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: organization?.contactEmail
            ? `${organization.name} <${organization.contactEmail}>`
            : `${organization?.name ?? "DinnerList"} <onboarding@resend.dev>`,
          to: friendEmail.toLowerCase().trim(),
          subject: `${referrer.firstName} ${referrer.lastName} has invited you to ${event.name}`,
          replyTo: organization?.contactEmail ?? undefined,
          react: ForwardInvitationEmail({
            friendFirstName: friendFirstName.trim(),
            referrerFirstName: referrer.firstName, referrerLastName: referrer.lastName,
            eventName: event.name, eventDate: formatShortDate(event.date),
            eventTime: formatEventTime(event.startTime),
            venueName: event.venueName, venueAddress: event.venueAddress,
            venueCity: event.venueCity ?? undefined, venueState: event.venueState ?? undefined,
            rsvpUrl, organizationName: organization?.name ?? "DinnerList",
            organizationLogoUrl: organization?.logoUrl ?? undefined,
            organizationWebsite: organization?.website ?? undefined,
          }),
        });
      }
    } catch (emailError) {
      console.error("Failed to send forward invitation email:", emailError);
    }

    return { success: true, data: { invitationToken: friendInvitation.token } };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "An unexpected error occurred" };
  }
}
