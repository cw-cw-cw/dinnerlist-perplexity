"use client";

import { ExternalLink } from "lucide-react";

export function CopyRsvpUrlButton({ eventId }: { eventId: string }) {
  const rsvpUrl = `/rsvp/event/${eventId}`;
  return (
    <a href={rsvpUrl} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface-muted transition-colors text-text-primary"
    >
      <ExternalLink className="h-4 w-4" />
      View RSVP Website
    </a>
  );
}
