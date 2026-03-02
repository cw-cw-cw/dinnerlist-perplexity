"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { createSeriesAction } from "@/actions/invitees";
import { INVITEE_TYPES } from "@/lib/constants";
import { Plus } from "lucide-react";

export function CreateSeriesDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteeType, setInviteeType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    const result = await createSeriesAction({ name: name.trim(), description: description.trim() || null, inviteeType: inviteeType || null });
    setIsSubmitting(false);
    if ("error" in result) { alert(result.error); return; }
    setOpen(false); setName(""); setDescription(""); setInviteeType("");
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Create Series</Button>
      {open && (
        <Dialog open onClose={() => setOpen(false)} title="Create Event Series">
          <div className="space-y-4">
            <Input label="Series Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Select
              label="Invitee Type"
              value={inviteeType}
              onChange={(e) => setInviteeType(e.target.value)}
              options={[{ label: "All Types", value: "" }, ...INVITEE_TYPES.map((t) => ({ label: t.replace("_", " "), value: t }))]}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} isLoading={isSubmitting}>Create</Button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
