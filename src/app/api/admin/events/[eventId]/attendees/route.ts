import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: session.user.organizationId },
    select: { id: true },
  });

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const rsvps = await prisma.rSVP.findMany({
    where: { eventId, status: { in: ["CONFIRMED", "CHECKED_IN"] } },
    include: {
      invitee: { select: { id: true, firstName: true, lastName: true, specialty: true, phone: true } },
    },
    orderBy: { invitee: { lastName: "asc" } },
  });

  const attendees = rsvps.map((rsvp) => ({
    rsvpId: rsvp.id, inviteeId: rsvp.invitee.id,
    firstName: rsvp.invitee.firstName, lastName: rsvp.invitee.lastName,
    specialty: rsvp.invitee.specialty, phone: rsvp.invitee.phone,
    status: rsvp.status, bringingGuest: rsvp.bringingGuest,
    guestFirstName: rsvp.guestFirstName, guestLastName: rsvp.guestLastName,
  }));

  return NextResponse.json({ attendees });
}
