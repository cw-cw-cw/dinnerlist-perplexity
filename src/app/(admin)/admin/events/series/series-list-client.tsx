"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { updateSeriesAction, deleteSeriesAction } from "@/actions/series";
import { Edit, Trash2 } from "lucide-react";

interface Series {
  id: string;
  name: string;
  description: string | null;
  inviteeType: string | null;
  eventCount: number;
  createdAt: string;
}

const typeBadgeVariant: Record<string, "info" | "default"> = {
  IN_PRACTICE: "info",
  RESIDENT: "default",
  FELLOW: "default",
};

export function SeriesListClient({ series }: { series: Series[] }) {
  const router = useRouter();
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleEdit = (s: Series) => {
    setEditingSeries(s);
    setEditName(s.name);
    setEditDescription(s.description ?? "");
  };

  const handleSave = async () => {
    if (!editingSeries) return;
    await updateSeriesAction(editingSeries.id, { name: editName, description: editDescription || null });
    setEditingSeries(null);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this series? Events in this series will not be deleted.")) return;
    setIsDeleting(id);
    await deleteSeriesAction(id);
    setIsDeleting(null);
    router.refresh();
  };

  if (series.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-text-muted">No event series yet. Create one to group related events together.</CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {series.map((s) => (
          <Card key={s.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-text-primary">{s.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(s)} className="p-1 text-text-muted hover:text-brand-teal"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(s.id)} disabled={isDeleting === s.id} className="p-1 text-text-muted hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {s.description && <p className="text-sm text-text-muted mb-2">{s.description}</p>}
              <div className="flex items-center gap-2">
                {s.inviteeType && <Badge variant={typeBadgeVariant[s.inviteeType] ?? "default"}>{s.inviteeType.replace("_", " ")}</Badge>}
                <span className="text-sm text-text-muted">{s.eventCount} events</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {editingSeries && (
        <Dialog open onClose={() => setEditingSeries(null)} title="Edit Series">
          <div className="space-y-4">
            <Input label="Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            <Textarea label="Description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditingSeries(null)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
