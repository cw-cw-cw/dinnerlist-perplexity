import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EventForm } from "@/components/forms/event-form";

export const metadata: Metadata = { title: "Edit Event" };

export default async function EditEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const { eventId } = await params;

  const [event, series, templates] = await Promise.all([
    prisma.event.findFirst({ where: { id: eventId, organizationId: session.user.organizationId } }),
    prisma.eventSeries.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { name: "asc" } }),
    prisma.eventTemplate.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { name: "asc" } }),
  ]);

  if (!event) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Event" description={event.name} />
      <Card>
        <CardContent className="p-6">
          <EventForm
            event={event}
            series={series.map((s) => ({ id: s.id, name: s.name }))}
            templates={templates.map((t) => ({ id: t.id, name: t.name }))}
            mode="edit"
          />
        </CardContent>
      </Card>
    </div>
  );
}
