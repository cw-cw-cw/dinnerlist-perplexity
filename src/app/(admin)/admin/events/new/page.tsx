import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EventForm } from "@/components/forms/event-form";

export const metadata: Metadata = { title: "Create Event" };

export default async function NewEventPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const [series, templates] = await Promise.all([
    prisma.eventSeries.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { name: "asc" } }),
    prisma.eventTemplate.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Create Event" description="Set up a new dinner event" />
      <Card>
        <CardContent className="p-6">
          <EventForm
            series={series.map((s) => ({ id: s.id, name: s.name }))}
            templates={templates.map((t) => ({ id: t.id, name: t.name }))}
            mode="create"
          />
        </CardContent>
      </Card>
    </div>
  );
}
