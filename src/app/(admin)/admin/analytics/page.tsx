import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { AnalyticsDashboard } from "./analytics-dashboard";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [events, invitations, rsvps] = await Promise.all([
    prisma.event.findMany({ where: { organizationId: orgId }, select: { id: true, name: true, date: true }, orderBy: { date: "desc" } }),
    prisma.invitation.findMany({
      where: { event: { organizationId: orgId } },
      select: { id: true, status: true, openedAt: true, clickedAt: true, timeOnPage: true, eventId: true, referredByInviteeId: true },
    }),
    prisma.rSVP.findMany({
      where: { invitation: { event: { organizationId: orgId } } },
      select: { id: true, status: true, createdAt: true, invitation: { select: { eventId: true } } },
    }),
  ]);

  const serializedEvents = events.map((e) => ({ ...e, date: e.date.toISOString() }));
  const serializedRsvps = rsvps.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Track engagement and RSVP metrics" />
      <AnalyticsDashboard events={serializedEvents} invitations={invitations} rsvps={serializedRsvps} />
    </div>
  );
}
