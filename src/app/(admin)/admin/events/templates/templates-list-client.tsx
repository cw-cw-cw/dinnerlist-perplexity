"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { updateTemplateAction, deleteTemplateAction } from "@/actions/templates";
import { Edit, Trash2, MapPin, Clock } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string | null;
  inviteeType: string | null;
  venueName: string | null;
  venueAddress: string | null;
  startTime: string | null;
  endTime: string | null;
  publicCapacity: number | null;
  privateCapacity: number | null;
  createdAt: string;
}

const typeBadgeVariant: Record<string, "info" | "default"> = {
  IN_PRACTICE: "info",
  RESIDENT: "default",
  FELLOW: "default",
};

export function TemplatesListClient({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editName, setEditName] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleEdit = (t: Template) => { setEditingTemplate(t); setEditName(t.name); };

  const handleSave = async () => {
    if (!editingTemplate) return;
    await updateTemplateAction(editingTemplate.id, { name: editName });
    setEditingTemplate(null);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    setIsDeleting(id);
    await deleteTemplateAction(id);
    setIsDeleting(null);
    router.refresh();
  };

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-text-muted">No templates yet. Create one to speed up event creation.</CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t) => (
          <Card key={t.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-text-primary">{t.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(t)} className="p-1 text-text-muted hover:text-brand-teal"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(t.id)} disabled={isDeleting === t.id} className="p-1 text-text-muted hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {t.description && <p className="text-sm text-text-muted mb-2">{t.description}</p>}
              <div className="space-y-1 text-sm text-text-muted">
                {t.venueName && <p className="flex items-center gap-1"><MapPin className="h-3 w-3" />{t.venueName}</p>}
                {t.startTime && <p className="flex items-center gap-1"><Clock className="h-3 w-3" />{t.startTime}{t.endTime ? ` - ${t.endTime}` : ""}</p>}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {t.inviteeType && <Badge variant={typeBadgeVariant[t.inviteeType] ?? "default"}>{t.inviteeType.replace("_", " ")}</Badge>}
                {t.publicCapacity && <span className="text-xs text-text-muted">Cap: {t.publicCapacity}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {editingTemplate && (
        <Dialog open onClose={() => setEditingTemplate(null)} title="Edit Template">
          <div className="space-y-4">
            <Input label="Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditingTemplate(null)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
