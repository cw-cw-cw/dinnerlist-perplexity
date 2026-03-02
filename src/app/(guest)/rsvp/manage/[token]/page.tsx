import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ManageRsvpClient } from "./manage-rsvp-client";

export default async function ManageRsvpPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const rsvp = await prisma.rSVP.findUnique({
    where: { manageToken: token },
    include: { invitation: { include: { event: { include: { organization: true } }, invitee: true } } },
  });

  if (!rsvp || !rsvp.invitation?.event) notFound();

  const event = rsvp.invitation.event;
  const org = event.organization;

  return (
    <ManageRsvpClient
      manageToken={token}
      initialRsvp={{
        id: rsvp.id, status: rsvp.status, bringingGuest: rsvp.bringingGuest,
        guestFirstName: rsvp.guestFirstName, guestLastName: rsvp.guestLastName,
        phoneNumber: rsvp.phoneNumber, dietaryRestrictions: rsvp.dietaryRestrictions,
      }}
      event={{
        id: event.id, name: event.name, date: event.date.toISOString(),
        startTime: event.startTime, endTime: event.endTime,
        venueName: event.venueName, venueAddress: event.venueAddress,
        venueCity: event.venueCity, venueState: event.venueState,
      }}
      invitee={{ firstName: rsvp.invitation.invitee.firstName, lastName: rsvp.invitation.invitee.lastName }}
      organization={{ name: org.name, logoIconUrl: org.logoIconUrl, website: org.website, contactEmail: org.contactEmail }}
    />
  );
}
