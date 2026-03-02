import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { InviteesTableClient } from "./invitees-table-client";

export const metadata: Metadata = { title: "Manage Invitees" };

export default async function EventInviteesPage({ params }: { params: Promise<{ eventId: string }> }) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const { eventId } = await params;

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: session.user.organizationId },
    select: { id: true, name: true, organizationId: true },
  });

  if (!event) notFound();

  const invitations = await prisma.invitation.findMany({
    where: { eventId },
    include: { invitee: true, rsvp: true },
    orderBy: { invitee: { lastName: "asc" } },
  });

  const allInvitees = await prisma.invitee.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { lastName: "asc" },
    select: { id: true, firstName: true, lastName: true, email: true, specialty: true },
  });

  const serializedInvitations = invitations.map((inv) => ({
    id: inv.id, token: inv.token, status: inv.status,
    invitee: {
      id: inv.invitee.id, firstName: inv.invitee.firstName, lastName: inv.invitee.lastName,
      email: inv.invitee.email, phone: inv.invitee.phone, specialty: inv.invitee.specialty,
      credentials: inv.invitee.credentials, inviteeType: inv.invitee.inviteeType,
      yearStartedPractice: inv.invitee.yearStartedPractice, unsubscribed: inv.invitee.unsubscribed,
    },
    rsvp: inv.rsvp ? {
      id: inv.rsvp.id, status: inv.rsvp.status, bringingGuest: inv.rsvp.bringingGuest,
      guestFirstName: inv.rsvp.guestFirstName, guestLastName: inv.rsvp.guestLastName,
      phoneNumber: inv.rsvp.phoneNumber, dietaryRestrictions: inv.rsvp.dietaryRestrictions,
    } : null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title={`Invitees: ${event.name}`} description="Manage event invitations and RSVPs" />
      <InviteesTableClient eventId={eventId} invitations={serializedInvitations} allInvitees={allInvitees} />
    </div>
  );
}
