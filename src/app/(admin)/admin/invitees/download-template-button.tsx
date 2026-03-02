"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function DownloadTemplateButton() {
  const handleDownload = () => {
    const headers = "First Name,Last Name,Email,Phone,Specialty,Credentials,Type,Year Started Practice";
    const example = "John,Doe,john@example.com,555-123-4567,Cardiology,MD,IN_PRACTICE,2015";
    const csv = `${headers}\n${example}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invitee_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Button variant="secondary" onClick={handleDownload}>
      <Download className="h-4 w-4 mr-2" />Download Template
    </Button>
  );
}
