import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { CapacityBar } from "@/components/admin/capacity-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, CheckCircle2, Clock, XCircle, UserPlus, Edit, ClipboardCheck, Printer } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils/dates";
import { RSVP_STATUS_LABELS } from "@/lib/constants";
import { CopyRsvpUrlButton } from "./copy-rsvp-url-button";

export async function generateMetadata({ params }: { params: Promise<{ eventId: string }> }): Promise<Metadata> {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { name: true } });
  return { title: event?.name ?? "Event" };
}

const rsvpStatusBadge: Record<string, "success" | "warning" | "danger" | "default" | "waitlist" | "info"> = {
  CONFIRMED: "success", WAITLISTED: "waitlist", DECLINED: "danger",
  CANCELLED: "danger", PENDING: "default", NO_SHOW: "warning", CHECKED_IN: "info",
};

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const { eventId } = await params;

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: session.user.organizationId },
    include: {
      series: { select: { name: true } },
      invitations: { include: { invitee: { select: { firstName: true, lastName: true, specialty: true, yearStartedPractice: true } }, rsvp: true } },
    },
  });

  if (!event) notFound();

  const invitedCount = event.invitations.length;
  const acceptedCount = event.invitations.filter((i) => i.rsvp?.status === "CONFIRMED").length;
  const waitlistedCount = event.invitations.filter((i) => i.rsvp?.status === "WAITLISTED").length;
  const declinedCount = event.invitations.filter((i) => i.rsvp?.status === "DECLINED").length;

  const rsvpData = event.invitations
    .filter((i) => i.rsvp)
    .map((i) => ({
      id: i.rsvp!.id, status: i.rsvp!.status, bringingGuest: i.rsvp!.bringingGuest,
      guestFirstName: i.rsvp!.guestFirstName, guestLastName: i.rsvp!.guestLastName,
      phoneNumber: i.rsvp!.phoneNumber, dietaryRestrictions: i.rsvp!.dietaryRestrictions,
      createdAt: i.rsvp!.createdAt.toISOString(),
      invitee: { firstName: i.invitee.firstName, lastName: i.invitee.lastName, specialty: i.invitee.specialty, yearStartedPractice: i.invitee.yearStartedPractice },
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <PageHeader
        title={event.name}
        description={`${formatDate(event.date)} · ${event.venueName}`}
        actions={
          <div className="flex gap-2">
            <Link href={`/admin/events/${event.id}/edit`} className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface-muted transition-colors text-text-primary">
              <Edit className="h-4 w-4" />
              Edit
            </Link>
          </div>
        }
      />
      {event.series && <p className="text-sm text-text-muted">Series: {event.series.name}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Invited" value={invitedCount} icon={Users} />
        <StatCard title="Accepted" value={acceptedCount} icon={CheckCircle2} />
        <StatCard title="Waitlisted" value={waitlistedCount} icon={Clock} />
        <StatCard title="Declined" value={declinedCount} icon={XCircle} />
      </div>
      {event.publicCapacity && (
        <CapacityBar confirmed={acceptedCount} publicCapacity={event.publicCapacity} privateCapacity={event.privateCapacity ?? event.publicCapacity} />
      )}
      <Card>
        <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href={`/admin/events/${event.id}/invitees`} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors">
              <UserPlus className="h-4 w-4" />Manage Invitees
            </Link>
            <CopyRsvpUrlButton eventId={event.id} />
            <Link href={`/admin/events/${event.id}/checkin`} className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface-muted transition-colors text-text-primary">
              <ClipboardCheck className="h-4 w-4" />Check-in View
            </Link>
            <Link href={`/admin/events/${event.id}/print`} className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface-muted transition-colors text-text-primary">
              <Printer className="h-4 w-4" />Print Attendees
            </Link>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Event Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><dt className="text-sm text-text-muted">Date</dt><dd className="text-text-primary">{formatDate(event.date)}</dd></div>
            <div><dt className="text-sm text-text-muted">Time</dt><dd className="text-text-primary">{event.startTime}{event.endTime ? ` – ${event.endTime}` : ""}</dd></div>
            <div><dt className="text-sm text-text-muted">Venue</dt><dd className="text-text-primary">{event.venueName}</dd></div>
            <div><dt className="text-sm text-text-muted">Address</dt><dd className="text-text-primary">{event.venueAddress}{event.venueCity ? `, ${event.venueCity}` : ""}{event.venueState ? `, ${event.venueState}` : ""}</dd></div>
            <div><dt className="text-sm text-text-muted">Status</dt><dd className="text-text-primary">{event.status}</dd></div>
            {event.publicCapacity && <div><dt className="text-sm text-text-muted">Public Capacity</dt><dd className="text-text-primary">{event.publicCapacity}</dd></div>}
            {event.privateCapacity && <div><dt className="text-sm text-text-muted">Private Capacity</dt><dd className="text-text-primary">{event.privateCapacity}</dd></div>}
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>RSVPs ({rsvpData.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-text-muted">Name</th>
                  <th className="text-left p-4 text-sm font-medium text-text-muted">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-text-muted">Specialty</th>
                  <th className="text-left p-4 text-sm font-medium text-text-muted">Guest</th>
                  <th className="text-left p-4 text-sm font-medium text-text-muted">Dietary</th>
                </tr>
              </thead>
              <tbody>
                {rsvpData.map((rsvp) => (
                  <tr key={rsvp.id} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium text-text-primary">{rsvp.invitee.firstName} {rsvp.invitee.lastName}</td>
                    <td className="p-4"><Badge variant={rsvpStatusBadge[rsvp.status] ?? "default"}>{RSVP_STATUS_LABELS[rsvp.status] ?? rsvp.status}</Badge></td>
                    <td className="p-4 text-sm text-text-muted">{rsvp.invitee.specialty ?? "—"}</td>
                    <td className="p-4 text-sm text-text-muted">{rsvp.bringingGuest ? `${rsvp.guestFirstName ?? ""} ${rsvp.guestLastName ?? ""}`.trim() || "Yes" : "No"}</td>
                    <td className="p-4 text-sm text-text-muted">{rsvp.dietaryRestrictions ?? "—"}</td>
                  </tr>
                ))}
                {rsvpData.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-text-muted">No RSVPs yet</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
