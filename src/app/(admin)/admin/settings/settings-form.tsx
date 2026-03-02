"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Organization {
  id: string;
  name: string;
  timezone: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  logoUrl: string | null;
  logoIconUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
}

export function SettingsForm({ organization }: { organization: Organization }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(organization.primaryColor ?? "#2E4E61");
  const [accentColor, setAccentColor] = useState(organization.accentColor ?? "#F3C317");
  const primaryColorRef = useRef<HTMLInputElement>(null);
  const accentColorRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    void formData;
    setIsSubmitting(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Organization Name" name="name" defaultValue={organization.name} />
      <Input label="Timezone" name="timezone" defaultValue={organization.timezone ?? ""} />
      <Input label="Contact Email" name="contactEmail" type="email" defaultValue={organization.contactEmail ?? ""} />
      <Input label="Contact Phone" name="contactPhone" defaultValue={organization.contactPhone ?? ""} />
      <Input label="Website" name="website" defaultValue={organization.website ?? ""} />
      <Input label="Logo URL" name="logoUrl" defaultValue={organization.logoUrl ?? ""} />
      <Input label="Logo Icon URL" name="logoIconUrl" defaultValue={organization.logoIconUrl ?? ""} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Primary Color</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => primaryColorRef.current?.click()} className="w-10 h-10 rounded-lg border border-border cursor-pointer" style={{ backgroundColor: primaryColor }} />
            <input name="primaryColor" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 px-3 py-2 border border-border rounded-lg font-mono text-sm bg-white text-text-primary" />
            <input ref={primaryColorRef} type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="sr-only" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Accent Color</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => accentColorRef.current?.click()} className="w-10 h-10 rounded-lg border border-border cursor-pointer" style={{ backgroundColor: accentColor }} />
            <input name="accentColor" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="flex-1 px-3 py-2 border border-border rounded-lg font-mono text-sm bg-white text-text-primary" />
            <input ref={accentColorRef} type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="sr-only" />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting}>Save Settings</Button>
      </div>
    </form>
  );
}
