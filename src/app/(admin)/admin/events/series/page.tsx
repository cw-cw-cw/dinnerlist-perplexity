import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { SeriesListClient } from "./series-list-client";
import { CreateSeriesDialog } from "./create-series-dialog";

export const metadata: Metadata = { title: "Event Series" };

export default async function SeriesPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const series = await prisma.eventSeries.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
    include: { _count: { select: { events: true } } },
  });

  const serialized = series.map((s) => ({
    id: s.id, name: s.name, description: s.description, inviteeType: s.eventType,
    eventCount: s._count.events, createdAt: s.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Event Series" description="Group related events into series" actions={<CreateSeriesDialog />} />
      <SeriesListClient series={serialized} />
    </div>
  );
}
