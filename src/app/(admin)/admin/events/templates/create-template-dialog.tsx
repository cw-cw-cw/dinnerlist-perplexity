"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export function CreateTemplateDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Create Template
      </Button>
      {open && (
        <Dialog open onClose={() => setOpen(false)} title="Create Template">
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              Templates are created automatically when you save an event as a template.
              Create a new event and use the &quot;Save as Template&quot; option.
            </p>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
