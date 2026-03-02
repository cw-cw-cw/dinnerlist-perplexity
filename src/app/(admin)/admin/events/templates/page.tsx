import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { TemplatesListClient } from "./templates-list-client";
import { CreateTemplateDialog } from "./create-template-dialog";

export const metadata: Metadata = { title: "Event Templates" };

export default async function TemplatesPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const templates = await prisma.eventTemplate.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  });

  const serialized = templates.map((t) => ({
    id: t.id, name: t.name, description: t.descriptionTemplate,
    inviteeType: t.eventType, venueName: null, venueAddress: null,
    startTime: null, endTime: null,
    publicCapacity: t.publicCapacity, privateCapacity: t.privateCapacity,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Event Templates" description="Reusable event configurations" actions={<CreateTemplateDialog />} />
      <TemplatesListClient templates={serialized} />
    </div>
  );
}
