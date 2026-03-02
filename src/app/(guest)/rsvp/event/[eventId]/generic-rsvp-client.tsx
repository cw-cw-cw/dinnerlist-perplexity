"use client";

import { useState } from "react";
import { submitGenericRSVP } from "@/actions/generic-rsvp";
import { formatDate } from "@/lib/utils/dates";
import { MapPin, Calendar, Clock } from "lucide-react";

interface Props {
  event: {
    id: string;
    name: string;
    date: string;
    startTime: string | null;
    endTime: string | null;
    venueName: string | null;
    venueAddress: string | null;
    venueCity: string | null;
    venueState: string | null;
    venueImageUrl: string | null;
    description: string | null;
  };
  organization: {
    name: string;
    logoUrl: string | null;
    logoIconUrl: string | null;
    website: string | null;
    contactEmail: string | null;
  };
  isFull: boolean;
  confirmedCount: number;
  publicCapacity: number | null;
}

export function GenericRsvpClient({ event, organization, isFull, confirmedCount, publicCapacity }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    const result = await submitGenericRSVP({ eventId: event.id, firstName, lastName, email, phone, specialty: specialty || undefined });
    setIsSubmitting(false);
    if ("error" in result) { setError(result.error); return; }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">&#10003;</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re In!</h2>
          <p className="text-gray-600">Your RSVP for {event.name} has been accepted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto">
        <div className="bg-[#2E4E61] text-white p-8">
          {organization.logoIconUrl && <img src={organization.logoIconUrl} alt="" className="h-12 w-12 mx-auto mb-4" />}
          <p className="text-center text-sm text-white/70 mb-1">{organization.name} invites you to</p>
          <h1 className="text-2xl font-bold text-center mb-4">{event.name}</h1>
          {event.venueImageUrl && <img src={event.venueImageUrl} alt={event.venueName ?? ""} className="w-full rounded-lg mb-4" />}
        </div>
        <div className="bg-white p-6 space-y-4">
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2 text-gray-700"><Calendar className="h-4 w-4 text-[#2E4E61]" />{formatDate(new Date(event.date))}</p>
            {event.startTime && <p className="flex items-center gap-2 text-gray-700"><Clock className="h-4 w-4 text-[#2E4E61]" />{event.startTime}{event.endTime ? ` - ${event.endTime}` : ""}</p>}
            {event.venueName && <p className="flex items-center gap-2 text-gray-700"><MapPin className="h-4 w-4 text-[#2E4E61]" />{event.venueName}{event.venueAddress ? `, ${event.venueAddress}` : ""}</p>}
          </div>
          {event.description && <p className="text-sm text-gray-600">{event.description}</p>}
          {isFull ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <p className="font-medium text-amber-800">This event is currently full</p>
              <p className="text-sm text-amber-600">Please check back later or contact the organizer.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E4E61] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E4E61] focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E4E61] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E4E61] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialty (optional)</label>
                <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E4E61] focus:border-transparent" />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-[#F3C317] text-[#2E4E61] font-bold rounded-lg hover:bg-[#F3C317]/90 transition-colors disabled:opacity-50">
                {isSubmitting ? "Submitting..." : "Reserve a Seat"}
              </button>
            </form>
          )}
        </div>
        <div className="p-4 text-center text-xs text-gray-400">
          {organization.website ? (<a href={organization.website} target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">{organization.name}</a>) : organization.name}
        </div>
      </div>
    </div>
  );
}
