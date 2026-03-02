import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { RSVPPageClient } from "@/components/guest/rsvp-page-client";
import { getGuestCapacityDisplay } from "@/lib/utils/capacity";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const invitation = await prisma.invitation.findUnique({ where: { token }, include: { event: { select: { name: true } } } });
  return { title: invitation?.event?.name ?? "RSVP" };
}

export default async function RSVPPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { event: { include: { organization: true, series: true } }, invitee: true, rsvp: true },
  });

  if (!invitation || !invitation.event) notFound();

  if (!invitation.openedAt) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { openedAt: new Date(), status: "OPENED" },
    });
  }

  const event = invitation.event;
  const org = event.organization;

  const confirmedCount = await prisma.rSVP.count({
    where: { invitation: { eventId: event.id }, status: "CONFIRMED" },
  });
  const capacityDisplay = getGuestCapacityDisplay(confirmedCount, event.publicCapacity, event.privateCapacity);

  let alternateEvents: Array<{ id: string; name: string; date: string; venueName: string; available: boolean }> = [];
  if (event.seriesId) {
    const seriesEvents = await prisma.event.findMany({
      where: { seriesId: event.seriesId, id: { not: event.id }, status: "OPEN", date: { gte: new Date() } },
      orderBy: { date: "asc" }, take: 3,
    });
    alternateEvents = seriesEvents.map((e) => ({
      id: e.id, name: e.name, date: e.date.toISOString(), venueName: e.venueName ?? "", available: true,
    }));
  }

  const serializedData = {
    token,
    invitation: { id: invitation.id, token: invitation.token, status: invitation.status },
    event: {
      id: event.id, name: event.name, date: event.date.toISOString(),
      startTime: event.startTime, endTime: event.endTime,
      venueName: event.venueName, venueAddress: event.venueAddress,
      venueCity: event.venueCity, venueState: event.venueState,
      venueImageUrl: event.venueImageUrl, description: event.description,
      inviteeType: event.eventType, invitationHeadline: event.invitationHeadline,
      invitationBody: event.invitationBody, confirmationMessage: event.confirmationMessage,
      hostName: event.hostName, hostPhotoUrl: event.hostPhotoUrl, hostBio: event.hostBio,
      waitlistEnabled: event.waitlistEnabled,
      publicCapacity: event.publicCapacity, privateCapacity: event.privateCapacity,
    },
    invitee: {
      id: invitation.invitee.id, firstName: invitation.invitee.firstName,
      lastName: invitation.invitee.lastName, email: invitation.invitee.email,
    },
    organization: {
      name: org.name, logoUrl: org.logoUrl, logoIconUrl: org.logoIconUrl,
      website: org.website, contactEmail: org.contactEmail, contactPhone: org.contactPhone,
    },
    rsvp: invitation.rsvp ? {
      id: invitation.rsvp.id, status: invitation.rsvp.status,
      bringingGuest: invitation.rsvp.bringingGuest,
      guestFirstName: invitation.rsvp.guestFirstName, guestLastName: invitation.rsvp.guestLastName,
      phoneNumber: invitation.rsvp.phoneNumber, dietaryRestrictions: invitation.rsvp.dietaryRestrictions,
      manageToken: invitation.rsvp.manageToken,
    } : null,
    capacity: capacityDisplay,
    alternateEvents,
    existingRsvp: invitation.rsvp ? {
      id: invitation.rsvp.id, status: invitation.rsvp.status,
      bringingGuest: invitation.rsvp.bringingGuest,
      guestFirstName: invitation.rsvp.guestFirstName, guestLastName: invitation.rsvp.guestLastName,
      phoneNumber: invitation.rsvp.phoneNumber, dietaryRestrictions: invitation.rsvp.dietaryRestrictions,
    } : null,
    spotsRemaining: {
      display: capacityDisplay.spotsText,
      isFull: confirmedCount >= event.privateCapacity,
      isWaitlistOnly: confirmedCount >= event.publicCapacity && confirmedCount < event.privateCapacity,
    },
    percentFull: capacityDisplay.percentFull,
    urgencyLevel: capacityDisplay.urgencyLevel,
    manageToken: invitation.rsvp?.manageToken ?? undefined,
  };

  return <RSVPPageClient {...serializedData} />;
}
