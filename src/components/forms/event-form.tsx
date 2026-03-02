"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { createEvent, updateEvent } from "@/actions/events";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Event } from "@prisma/client";

// Serialized version of Event where Date fields become strings (from server-to-client boundary)
type SerializedEvent = {
  [K in keyof Event]: Event[K] extends Date ? string | Date : Event[K] extends Date | null ? string | Date | null : Event[K];
};

interface EventFormProps {
  event?: SerializedEvent;
  series?: { id: string; name: string }[];
  templates?: { id: string; name: string }[];
  mode: "create" | "edit";
}

const US_STATES = [
  { value: "", label: "Select state..." },
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
];

const EVENT_TYPE_OPTIONS = [
  { value: "IN_PRACTICE", label: "In Practice" },
  { value: "RESIDENT_FELLOW", label: "Resident/Fellow" },
];

const EVENT_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "OPEN", label: "Open" },
  { value: "FULL", label: "Full" },
  { value: "WAITLIST_ONLY", label: "Waitlist Only" },
  { value: "CLOSED", label: "Closed" },
  { value: "COMPLETED", label: "Completed" },
];

function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

function formatTimeForInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatDateTimeLocalForInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().slice(0, 16);
}

export function EventForm({ event, series, templates, mode }: EventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Form state for template auto-fill
  const [formValues, setFormValues] = useState({
    name: event?.name ?? "",
    eventType: event?.eventType ?? "IN_PRACTICE",
    status: event?.status ?? "DRAFT",
    date: formatDateForInput(event?.date),
    startTime: formatTimeForInput(event?.startTime),
    endTime: formatTimeForInput(event?.endTime),
    venueName: event?.venueName ?? "",
    venueAddress: event?.venueAddress ?? "",
    venueCity: event?.venueCity ?? "",
    venueState: event?.venueState ?? "",
    venueImageUrl: event?.venueImageUrl ?? "",
    publicCapacity: event?.publicCapacity?.toString() ?? "",
    privateCapacity: event?.privateCapacity?.toString() ?? "",
    waitlistEnabled: event?.waitlistEnabled ?? true,
    hostName: event?.hostName ?? "",
    hostPhotoUrl: event?.hostPhotoUrl ?? "",
    hostBio: event?.hostBio ?? "",
    description: event?.description ?? "",
    invitationHeadline: event?.invitationHeadline ?? "",
    invitationBody: event?.invitationBody ?? "",
    confirmationMessage: event?.confirmationMessage ?? "",
    seriesId: event?.seriesId ?? "",
    templateId: event?.templateId ?? "",
    rsvpDeadline: formatDateTimeLocalForInput(event?.rsvpDeadline),
    internalNotes: event?.internalNotes ?? "",
  });

  // Auto-fill from template when selected in create mode
  useEffect(() => {
    if (mode !== "create" || !selectedTemplateId || !templates) return;

    // Templates only have id and name from the prop
    setFormValues((prev) => ({
      ...prev,
      templateId: selectedTemplateId,
    }));
  }, [selectedTemplateId, templates, mode]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setFormValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear field error when user edits
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      let result;

      if (mode === "create") {
        result = await createEvent(formData);
      } else {
        result = await updateEvent(event!.id, formData);
      }

      if ("error" in result) {
        setError(result.error);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      router.push(`/admin/events/${result.data.id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-button border border-danger/20 bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary border-b border-border pb-2">
          Basic Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Event Name *"
            name="name"
            value={formValues.name}
            onChange={handleChange}
            placeholder="e.g., Q1 Cardiology Dinner"
            error={fieldErrors.name?.[0]}
            required
          />
          <Select
            label="Event Type"
            name="eventType"
            value={formValues.eventType}
            onChange={handleChange}
            options={EVENT_TYPE_OPTIONS}
            error={fieldErrors.eventType?.[0]}
          />
          {mode === "edit" && (
            <Select
              label="Status"
              name="status"
              value={formValues.status}
              onChange={handleChange}
              options={EVENT_STATUS_OPTIONS}
              error={fieldErrors.status?.[0]}
            />
          )}
        </div>
      </section>

      {/* Date & Time */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary border-b border-border pb-2">
          Date & Time
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Date *"
            name="date"
            type="date"
            value={formValues.date}
            onChange={handleChange}
            error={fieldErrors.date?.[0]}
            required
          />
          <Input
            label="Start Time *"
            name="startTime"
            type="time"
            value={formValues.startTime}
            onChange={handleChange}
            error={fieldErrors.startTime?.[0]}
            required
          />
          <Input
            label="End Time"
            name="endTime"
            type="time"
            value={formValues.endTime}
            onChange={handleChange}
            error={fieldErrors.endTime?.[0]}
          />
        </div>
      </section>

      {/* Venue */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary border-b border-border pb-2">
          Venue
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Venue Name *"
            name="venueName"
            value={formValues.venueName}
            onChange={handleChange}
            placeholder="e.g., The Capital Grille"
            error={fieldErrors.venueName?.[0]}
            required
          />
          <Input
            label="Venue Address *"
            name="venueAddress"
            value={formValues.venueAddress}
            onChange={handleChange}
            placeholder="e.g., 1861 International Dr"
            error={fieldErrors.venueAddress?.[0]}
            required
          />
          <Input
            label="City"
            name="venueCity"
            value={formValues.venueCity}
            onChange={handleChange}
            placeholder="e.g., McLean"
            error={fieldErrors.venueCity?.[0]}
          />
          <Select
            label="State"
            name="venueState"
            value={formValues.venueState}
            onChange={handleChange}
            options={US_STATES}
            error={fieldErrors.venueState?.[0]}
          />
          <Input
            label="Venue Image URL"
            name="venueImageUrl"
            value={formValues.venueImageUrl}
            onChange={handleChange}
            placeholder="https://..."
            error={fieldErrors.venueImageUrl?.[0]}
          />
        </div>
      </section>

      {/* Capacity */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary border-b border-border pb-2">
          Capacity
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Public Capacity *"
            name="publicCapacity"
            type="number"
            min={1}
            value={formValues.publicCapacity}
            onChange={handleChange}
            placeholder="e.g., 20"
            error={fieldErrors.publicCapacity?.[0]}
            required
          />
          <Input
            label="Private Capacity *"
            name="privateCapacity"
            type="number"
            min={1}
            value={formValues.privateCapacity}
            onChange={handleChange}
            placeholder="e.g., 25"
            helperText="Including overbooking"
            error={fieldErrors.privateCapacity?.[0]}
            required
          />
          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="waitlistEnabled"
              name="waitlistEnabled"
              checked={formValues.waitlistEnabled}
              onChange={handleChange}
              className="h-4 w-4 rounded border-border text-brand-teal focus:ring-brand-teal"
            />
            <label
              htmlFor="waitlistEnabled"
              className="text-sm font-medium text-text-primary"
            >
              Enable Waitlist
            </label>
          </div>
        </div>
      </section>

      {/* Host Info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary border-b border-border pb-2">
          Host Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Host Name"
            name="hostName"
            value={formValues.hostName}
            onChange={handleChange}
            placeholder="e.g., Dr. Sarah Mitchell"
            error={fieldErrors.hostName?.[0]}
          />
          <Input
            label="Host Photo URL"
            name="hostPhotoUrl"
            value={formValues.hostPhotoUrl}
            onChange={handleChange}
            placeholder="https://..."
            error={fieldErrors.hostPhotoUrl?.[0]}
          />
        </div>
        <Textarea
          label="Host Bio"
          name="hostBio"
          value={formValues.hostBio}
          onChange={handleChange}
          placeholder="A brief bio about the host..."
          error={fieldErrors.hostBio?.[0]}
          rows={3}
        />
      </section>

      {/* Content */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary border-b border-border pb-2">
          Content
        </h2>
        <Textarea
          label="Description"
          name="description"
          value={formValues.description}
          onChange={handleChange}
          placeholder="Event description for the RSVP page..."
          error={fieldErrors.description?.[0]}
          rows={4}
        />
        <Input
          label="Invitation Headline"
          name="invitationHeadline"
          value={formValues.invitationHeadline}
          onChange={handleChange}
          placeholder="e.g., You're Invited to an Exclusive Dinner"
          error={fieldErrors.invitationHeadline?.[0]}
        />
        <Textarea
          label="Invitation Body"
          name="invitationBody"
          value={formValues.invitationBody}
          onChange={handleChange}
          placeholder="The main body of the invitation..."
          error={fieldErrors.invitationBody?.[0]}
          rows={4}
        />
        <Textarea
          label="Confirmation Message"
          name="confirmationMessage"
          value={formValues.confirmationMessage}
          onChange={handleChange}
          placeholder="Message shown after a successful RSVP..."
          error={fieldErrors.confirmationMessage?.[0]}
          rows={3}
        />
      </section>

      {/* Organization */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary border-b border-border pb-2">
          Organization
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {series && series.length > 0 && (
            <Select
              label="Event Series"
              name="seriesId"
              value={formValues.seriesId}
              onChange={handleChange}
              options={[
                { value: "", label: "None" },
                ...series.map((s) => ({ value: s.id, label: s.name })),
              ]}
              error={fieldErrors.seriesId?.[0]}
            />
          )}
          {mode === "create" && templates && templates.length > 0 && (
            <Select
              label="Template"
              name="templateId"
              value={formValues.templateId}
              onChange={(e) => {
                handleChange(e);
                setSelectedTemplateId(e.target.value);
              }}
              options={[
                { value: "", label: "None" },
                ...templates.map((t) => ({ value: t.id, label: t.name })),
              ]}
              error={fieldErrors.templateId?.[0]}
            />
          )}
        </div>
      </section>

      {/* Advanced */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary border-b border-border pb-2">
          Advanced
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="RSVP Deadline"
            name="rsvpDeadline"
            type="datetime-local"
            value={formValues.rsvpDeadline}
            onChange={handleChange}
            error={fieldErrors.rsvpDeadline?.[0]}
          />
        </div>
        <Textarea
          label="Internal Notes (admin only)"
          name="internalNotes"
          value={formValues.internalNotes}
          onChange={handleChange}
          placeholder="Notes visible only to admins..."
          error={fieldErrors.internalNotes?.[0]}
          rows={3}
        />
      </section>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isPending}>
          {mode === "create" ? "Create Event" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
