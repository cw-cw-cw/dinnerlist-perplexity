import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { InviteesPageClient } from "./invitees-page-client";
import { InviteePageActions } from "./invitee-page-actions";

export const metadata: Metadata = { title: "Invitees" };

export default async function InviteesPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const invitees = await prisma.invitee.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { lastName: "asc" },
    include: {
      _count: { select: { invitations: true } },
      invitations: { select: { referredByInviteeId: true, rsvp: { select: { status: true } } } },
    },
  });

  const serialized = invitees.map((inv) => ({
    id: inv.id, firstName: inv.firstName, lastName: inv.lastName, email: inv.email,
    phone: inv.phone, specialty: inv.specialty, credentials: inv.credentials,
    inviteeType: inv.inviteeType, yearStartedPractice: inv.yearStartedPractice,
    source: inv.source, unsubscribed: inv.unsubscribed,
    invitationCount: inv._count.invitations,
    hasReferral: inv.invitations.some((i) => i.referredByInviteeId !== null),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invitee Directory" description="Manage your invitee contacts"
        actions={<InviteePageActions />}
      />
      <InviteesPageClient invitees={serialized} />
    </div>
  );
}
