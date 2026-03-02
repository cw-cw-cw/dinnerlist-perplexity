import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/admin/sidebar";
import { Topbar } from "@/components/admin/topbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const organization = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { name: true },
  });

  return (
    <div className="flex h-screen bg-surface-muted">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          organizationName={organization?.name ?? "DinnerList"}
          userName={session.user.name ?? session.user.email ?? "Admin"}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
