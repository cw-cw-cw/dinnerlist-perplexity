"use client";

import { useState } from "react";
import { InviteeDirectory } from "./invitee-directory";
import { CSVUpload } from "@/components/forms/csv-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Invitee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  specialty: string | null;
  credentials: string | null;
  inviteeType: string | null;
  yearStartedPractice: number | null;
  source: string | null;
  unsubscribed: boolean;
  invitationCount: number;
  hasReferral: boolean;
}

export function InviteesPageClient({ invitees }: { invitees: Invitee[] }) {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="space-y-6">
      {showUpload && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Invitees CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <CSVUpload onImport={() => setShowUpload(false)} />
          </CardContent>
        </Card>
      )}
      <InviteeDirectory invitees={invitees} onToggleUpload={() => setShowUpload(!showUpload)} />
    </div>
  );
}
