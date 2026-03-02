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
    select: { name: true },
  });

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const invitations = await prisma.invitation.findMany({
    where: { eventId },
    include: { invitee: true, rsvp: true },
    orderBy: { invitee: { lastName: "asc" } },
  });

  const headers = [
    "First Name", "Last Name", "Email", "Phone", "Specialty", "Credentials",
    "Type", "Year Started Practice", "Invitation Status", "RSVP Status",
    "Bringing Guest", "Guest First Name", "Guest Last Name", "Dietary Restrictions",
  ];

  const rows = invitations.map((inv) => [
    inv.invitee.firstName, inv.invitee.lastName, inv.invitee.email,
    inv.invitee.phone ?? "", inv.invitee.specialty ?? "", inv.invitee.credentials ?? "",
    inv.invitee.inviteeType ?? "", inv.invitee.yearStartedPractice?.toString() ?? "",
    inv.status, inv.rsvp?.status ?? "No RSVP",
    inv.rsvp?.bringingGuest ? "Yes" : "No",
    inv.rsvp?.guestFirstName ?? "", inv.rsvp?.guestLastName ?? "",
    inv.rsvp?.dietaryRestrictions ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const filename = `${event.name.replace(/[^a-zA-Z0-9]/g, "_")}_invitees.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
