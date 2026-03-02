"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EditInviteeDialog } from "./edit-invitee-dialog";
import { deleteInvitee } from "@/actions/invitees";
import { Search, Edit, Trash2, Upload } from "lucide-react";
import { useMemo } from "react";

interface Invitee {
  id: string; firstName: string; lastName: string; email: string;
  phone: string | null; specialty: string | null; credentials: string | null;
  inviteeType: string | null; yearStartedPractice: number | null;
  source: string | null; unsubscribed: boolean;
  invitationCount: number; hasReferral: boolean;
}

export function InviteeDirectory({ invitees, onToggleUpload }: { invitees: Invitee[]; onToggleUpload: () => void }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editingInvitee, setEditingInvitee] = useState<Invitee | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return invitees.filter((inv) =>
      inv.firstName.toLowerCase().includes(q) || inv.lastName.toLowerCase().includes(q) ||
      inv.email.toLowerCase().includes(q) || (inv.specialty?.toLowerCase().includes(q) ?? false)
    );
  }, [invitees, search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this invitee?")) return;
    await deleteInvitee(id);
    router.refresh();
  };

  const sourceLabel = (inv: Invitee) => {
    if (inv.hasReferral) return "Referral";
    if (inv.source === "walk_in" || inv.source === "walk-in") return "Walk-in";
    if (inv.source === "csv" || inv.source === "csv_upload") return "CSV";
    if (inv.source === "manual") return "Manual";
    return inv.source ?? "—";
  };

  const sourceBadgeVariant = (inv: Invitee): "default" | "info" | "success" | "warning" => {
    if (inv.hasReferral) return "info";
    if (inv.source === "walk_in" || inv.source === "walk-in") return "warning";
    return "default";
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invitees..."
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent bg-white text-text-primary" />
            </div>
            <Button variant="secondary" onClick={onToggleUpload}>
              <Upload className="h-4 w-4 mr-2" />Upload CSV
            </Button>
          </div>
          <div className="text-sm text-text-muted mb-2">{filtered.length} invitees</div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-sm font-medium text-text-muted">Name</th>
                  <th className="text-left p-3 text-sm font-medium text-text-muted">Email</th>
                  <th className="text-left p-3 text-sm font-medium text-text-muted">Specialty</th>
                  <th className="text-left p-3 text-sm font-medium text-text-muted">Year Started</th>
                  <th className="text-left p-3 text-sm font-medium text-text-muted">Source</th>
                  <th className="text-left p-3 text-sm font-medium text-text-muted">Events</th>
                  <th className="text-left p-3 text-sm font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                    <td className="p-3">
                      <span className="font-medium text-text-primary">{inv.firstName} {inv.lastName}</span>
                      {inv.unsubscribed && <Badge variant="danger" className="ml-2">Unsubscribed</Badge>}
                    </td>
                    <td className="p-3 text-sm text-text-muted">{inv.email}</td>
                    <td className="p-3 text-sm text-text-muted">{inv.specialty ?? "—"}</td>
                    <td className="p-3 text-sm text-text-muted">{inv.yearStartedPractice ?? "—"}</td>
                    <td className="p-3"><Badge variant={sourceBadgeVariant(inv)}>{sourceLabel(inv)}</Badge></td>
                    <td className="p-3 text-sm text-text-muted">{inv.invitationCount}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button onClick={() => setEditingInvitee(inv)} className="p-1 text-text-muted hover:text-brand-teal"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(inv.id)} className="p-1 text-text-muted hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {editingInvitee && (
        <EditInviteeDialog invitee={editingInvitee} onClose={() => { setEditingInvitee(null); router.refresh(); }} />
      )}
    </>
  );
}
