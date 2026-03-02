"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminUserDialog } from "./admin-user-dialog";
import { deleteAdminUser } from "@/actions/admin-users";
import { Plus, Edit, Trash2 } from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export function AdminUserList({ users, currentUserRole }: { users: AdminUser[]; currentUserRole: string }) {
  const router = useRouter();
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const canManage = currentUserRole === "SUPER_ADMIN" || currentUserRole === "ADMIN";

  const handleDelete = async (userId: string) => {
    if (!confirm("Remove this admin user?")) return;
    await deleteAdminUser(userId);
    router.refresh();
  };

  const roleBadge = (role: string) => {
    if (role === "SUPER_ADMIN") return <Badge variant="warning">Super Admin</Badge>;
    if (role === "ADMIN") return <Badge variant="info">Admin</Badge>;
    return <Badge variant="default">{role}</Badge>;
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Admin
          </Button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 text-sm font-medium text-text-muted">Name</th>
              <th className="text-left p-3 text-sm font-medium text-text-muted">Email</th>
              <th className="text-left p-3 text-sm font-medium text-text-muted">Role</th>
              {canManage && <th className="text-left p-3 text-sm font-medium text-text-muted">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium text-text-primary">{user.name}</td>
                <td className="p-3 text-sm text-text-muted">{user.email}</td>
                <td className="p-3">{roleBadge(user.role)}</td>
                {canManage && (
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button onClick={() => setEditingUser(user)} className="p-1 text-text-muted hover:text-brand-teal"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(user.id)} className="p-1 text-text-muted hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(showCreate || editingUser) && (
        <AdminUserDialog user={editingUser} onClose={() => { setShowCreate(false); setEditingUser(null); router.refresh(); }} />
      )}
    </div>
  );
}
