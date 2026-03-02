import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CalendarDays, Users, CheckCircle2, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils/dates";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [totalEvents, upcomingEvents, totalInvitees, recentRsvps] = await Promise.all([
    prisma.event.count({ where: { organizationId: orgId } }),
    prisma.event.findMany({
      where: { organizationId: orgId, status: "OPEN", date: { gte: new Date() } },
      orderBy: { date: "asc" }, take: 5,
      include: { _count: { select: { invitations: true } } },
    }),
    prisma.invitee.count({ where: { organizationId: orgId } }),
    prisma.rSVP.findMany({
      where: { event: { organizationId: orgId } },
      orderBy: { createdAt: "desc" }, take: 10,
      include: { invitee: true, event: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your events and RSVPs" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Events" value={totalEvents} icon={Calendar} />
        <StatCard title="Upcoming Events" value={upcomingEvents.length} icon={CalendarDays} />
        <StatCard title="Total Invitees" value={totalInvitees} icon={Users} />
        <StatCard title="Recent RSVPs" value={recentRsvps.length} icon={CheckCircle2} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Upcoming Events</CardTitle></CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-text-muted text-sm">No upcoming events</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <Link key={event.id} href={`/admin/events/${event.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-surface-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium text-text-primary">{event.name}</p>
                      <p className="text-sm text-text-muted">{formatDate(event.date)} · {event.venueName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{event._count.invitations} invited</Badge>
                      <ArrowRight className="h-4 w-4 text-text-muted" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/admin/events/new" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-surface-muted transition-colors">
                <Plus className="h-5 w-5 text-brand-teal" />
                <div>
                  <p className="font-medium text-text-primary">Create Event</p>
                  <p className="text-sm text-text-muted">Set up a new dinner event</p>
                </div>
              </Link>
              <Link href="/admin/invitees" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-surface-muted transition-colors">
                <Users className="h-5 w-5 text-brand-teal" />
                <div>
                  <p className="font-medium text-text-primary">Manage Invitees</p>
                  <p className="text-sm text-text-muted">Upload or edit your invitee directory</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
