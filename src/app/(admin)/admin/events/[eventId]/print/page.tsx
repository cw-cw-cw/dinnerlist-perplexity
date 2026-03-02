import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils/dates";
import { RSVP_STATUS_LABELS } from "@/lib/constants";
import { PrintButton } from "./print-button";
import Link from "next/link";

export default async function PrintPage({ params }: { params: Promise<{ eventId: string }> }) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const { eventId } = await params;

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: session.user.organizationId },
    include: {
      invitations: {
        where: { rsvp: { status: { in: ["CONFIRMED", "CHECKED_IN"] } } },
        include: { invitee: true, rsvp: true },
        orderBy: { invitee: { lastName: "asc" } },
      },
    },
  });

  if (!event) notFound();

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="print:hidden flex items-center justify-between mb-6">
        <Link href={`/admin/events/${eventId}`} className="text-brand-teal hover:underline">← Back to Event</Link>
        <PrintButton />
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{event.name}</h1>
        <p className="text-text-muted">{formatDate(event.date)} · {event.venueName}</p>
        <p className="text-text-muted">{event.invitations.length} attendees</p>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-900">
            <th className="text-left p-2 text-sm">#</th>
            <th className="text-left p-2 text-sm">Name</th>
            <th className="text-left p-2 text-sm">Specialty</th>
            <th className="text-left p-2 text-sm">Phone</th>
            <th className="text-left p-2 text-sm">+1 Guest</th>
            <th className="text-left p-2 text-sm">Dietary</th>
            <th className="text-left p-2 text-sm print:hidden">Status</th>
          </tr>
        </thead>
        <tbody>
          {event.invitations.map((inv, idx) => (
            <tr key={inv.id} className="border-b border-gray-300">
              <td className="p-2 text-sm">{idx + 1}</td>
              <td className="p-2 text-sm font-medium">{inv.invitee.firstName} {inv.invitee.lastName}</td>
              <td className="p-2 text-sm">{inv.invitee.specialty ?? ""}</td>
              <td className="p-2 text-sm">{inv.invitee.phone ?? ""}</td>
              <td className="p-2 text-sm">{inv.rsvp?.bringingGuest ? `${inv.rsvp.guestFirstName ?? ""} ${inv.rsvp.guestLastName ?? ""}`.trim() || "Yes" : ""}</td>
              <td className="p-2 text-sm">{inv.rsvp?.dietaryRestrictions ?? ""}</td>
              <td className="p-2 text-sm print:hidden">{RSVP_STATUS_LABELS[inv.rsvp?.status ?? ""] ?? inv.rsvp?.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
