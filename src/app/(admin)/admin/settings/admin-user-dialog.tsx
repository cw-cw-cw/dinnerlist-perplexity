"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createAdminUser, updateAdminUser } from "@/actions/admin-users";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function AdminUserDialog({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
  const isEdit = !!user;
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(user?.role ?? "ADMIN");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      if (isEdit) {
        const result = await updateAdminUser(user!.id, { name, email, role });
        if ("error" in result) { setError(result.error); setIsSubmitting(false); return; }
      } else {
        if (!password) { setError("Password is required"); setIsSubmitting(false); return; }
        const result = await createAdminUser({ name, email, password, role });
        if ("error" in result) { setError(result.error); setIsSubmitting(false); return; }
      }
      onClose();
    } catch {
      setError("An error occurred");
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open onClose={onClose} title={isEdit ? "Edit Admin User" : "Add Admin User"}>
      <div className="space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {!isEdit && (
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        )}
        <Select
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          options={[
            { label: "Admin", value: "ADMIN" },
            { label: "Super Admin", value: "SUPER_ADMIN" },
            { label: "Viewer", value: "VIEWER" },
          ]}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>{isEdit ? "Save" : "Create"}</Button>
        </div>
      </div>
    </Dialog>
  );
}
