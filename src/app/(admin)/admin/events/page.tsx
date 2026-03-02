import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/utils/dates";
import { RSVP_STATUS_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "Events" };

const statusBadgeVariant: Record<string, "default" | "success" | "danger" | "info"> = {
  DRAFT: "default", PUBLISHED: "success", OPEN: "success", CANCELLED: "danger", COMPLETED: "info",
};

const typeBadgeVariant: Record<string, "default" | "info"> = {
  IN_PRACTICE: "info", RESIDENT_FELLOW: "default",
};

export default async function EventsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const events = await prisma.event.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { date: "desc" },
    include: {
      _count: { select: { invitations: true } },
      series: { select: { name: true } },
      invitations: { select: { rsvp: { select: { status: true } } } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events" description="Manage your dinner events"
        actions={
          <Link href="/admin/events/new" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors">
            <Plus className="h-4 w-4" />
            Create Event
          </Link>
        }
      />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-text-muted">Name</th>
                  <th className="text-left p-4 text-sm font-medium text-text-muted">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-text-muted">Venue</th>
                  <th className="text-left p-4 text-sm font-medium text-text-muted">Type</th>
                  <th className="text-left p-4 text-sm font-medium text-text-muted">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-text-muted">Invited</th>
                  <th className="text-left p-4 text-sm font-medium text-text-muted">Accepted</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const acceptedCount = event.invitations.filter((inv) => inv.rsvp?.status === "CONFIRMED").length;
                  return (
                    <tr key={event.id} className="border-b border-border last:border-0 hover:bg-surface-muted transition-colors">
                      <td className="p-4">
                        <Link href={`/admin/events/${event.id}`} className="font-medium text-text-primary hover:text-brand-teal">{event.name}</Link>
                        {event.series && <p className="text-xs text-text-muted">{event.series.name}</p>}
                      </td>
                      <td className="p-4 text-sm text-text-muted">{formatDate(event.date)}</td>
                      <td className="p-4 text-sm text-text-muted">{event.venueName}</td>
                      <td className="p-4"><Badge variant={typeBadgeVariant[event.eventType] ?? "default"}>{event.eventType?.replace("_", " ") ?? "—"}</Badge></td>
                      <td className="p-4"><Badge variant={statusBadgeVariant[event.status] ?? "default"}>{event.status}</Badge></td>
                      <td className="p-4 text-sm text-text-muted">{event._count.invitations}</td>
                      <td className="p-4 text-sm text-text-muted">{acceptedCount}</td>
                    </tr>
                  );
                })}
                {events.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-text-muted">No events yet. Create your first event to get started.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
