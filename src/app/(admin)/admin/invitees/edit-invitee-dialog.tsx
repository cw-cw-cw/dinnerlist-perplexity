"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateInvitee } from "@/actions/invitees";

interface Invitee {
  id: string; firstName: string; lastName: string; email: string;
  phone: string | null; specialty: string | null; credentials: string | null;
  inviteeType: string | null; yearStartedPractice: number | null;
}

export function EditInviteeDialog({ invitee, onClose }: { invitee: Invitee; onClose: () => void }) {
  const [firstName, setFirstName] = useState(invitee.firstName);
  const [lastName, setLastName] = useState(invitee.lastName);
  const [email, setEmail] = useState(invitee.email);
  const [phone, setPhone] = useState(invitee.phone ?? "");
  const [specialty, setSpecialty] = useState(invitee.specialty ?? "");
  const [credentials, setCredentials] = useState(invitee.credentials ?? "");
  const [yearStarted, setYearStarted] = useState(invitee.yearStartedPractice?.toString() ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await updateInvitee({
      id: invitee.id, firstName, lastName, email, phone: phone || undefined,
      specialty: specialty || undefined, credentials: credentials || undefined,
      yearStartedPractice: yearStarted ? parseInt(yearStarted) : undefined,
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open onClose={onClose} title="Edit Invitee">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="Specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
        <Input label="Credentials" value={credentials} onChange={(e) => setCredentials(e.target.value)} />
        <Input label="Year Started Practice" type="number" value={yearStarted} onChange={(e) => setYearStarted(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>Save</Button>
        </div>
      </div>
    </Dialog>
  );
}
