import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";
import { AdminUserList } from "./admin-user-list";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const [organization, adminUsers] = await Promise.all([
    prisma.organization.findUnique({ where: { id: session.user.organizationId } }),
    prisma.adminUser.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { name: "asc" } }),
  ]);

  if (!organization) redirect("/login");

  const serializedOrg = {
    id: organization.id, name: organization.name, timezone: organization.timezone,
    contactEmail: organization.contactEmail, contactPhone: organization.contactPhone,
    website: organization.website, logoUrl: organization.logoUrl,
    logoIconUrl: organization.logoIconUrl, primaryColor: organization.primaryColor,
    accentColor: organization.accentColor,
  };

  const serializedUsers = adminUsers.map((u) => ({
    id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage organization settings" />
      <Card>
        <CardHeader><CardTitle>Organization</CardTitle></CardHeader>
        <CardContent><SettingsForm organization={serializedOrg} /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Admin Users</CardTitle></CardHeader>
        <CardContent>
          <AdminUserList users={serializedUsers} currentUserRole={session.user.role ?? "ADMIN"} />
        </CardContent>
      </Card>
    </div>
  );
}
