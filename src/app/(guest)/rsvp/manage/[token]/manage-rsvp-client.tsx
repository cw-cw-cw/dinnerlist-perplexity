"use client";

import { useState } from "react";
import { updateRsvp, cancelRsvp } from "@/actions/manage-rsvp";
import { formatDate } from "@/lib/utils/dates";
import { Calendar, Clock, MapPin, Download } from "lucide-react";
import { RSVP_STATUS_LABELS } from "@/lib/constants";

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits[0] === "1") return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return phone;
}

interface Props {
  manageToken: string;
  initialRsvp: {
    id: string;
    status: string;
    bringingGuest: boolean;
    guestFirstName: string | null;
    guestLastName: string | null;
    phoneNumber: string | null;
    dietaryRestrictions: string | null;
  };
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
  };
  invitee: { firstName: string; lastName: string };
  organization: {
    name: string;
    logoIconUrl: string | null;
    website: string | null;
    contactEmail: string | null;
  };
}

const statusConfig: Record<string, { color: string; bgColor: string }> = {
  CONFIRMED: { color: "text-green-800", bgColor: "bg-green-100" },
  WAITLISTED: { color: "text-purple-800", bgColor: "bg-purple-100" },
  DECLINED: { color: "text-red-800", bgColor: "bg-red-100" },
  CANCELLED: { color: "text-gray-800", bgColor: "bg-gray-100" },
};

export function ManageRsvpClient({ manageToken, initialRsvp, event, invitee, organization }: Props) {
  const [rsvp, setRsvp] = useState(initialRsvp);
  const [phoneNumber, setPhoneNumber] = useState(formatPhoneDisplay(initialRsvp.phoneNumber ?? ""));
  const [bringingGuest, setBringingGuest] = useState(initialRsvp.bringingGuest);
  const [guestFirstName, setGuestFirstName] = useState(initialRsvp.guestFirstName ?? "");
  const [guestLastName, setGuestLastName] = useState(initialRsvp.guestLastName ?? "");
  const [dietary, setDietary] = useState(initialRsvp.dietaryRestrictions ?? "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [message, setMessage] = useState("");

  const status = statusConfig[rsvp.status] ?? statusConfig.CONFIRMED;

  const handleUpdate = async () => {
    setIsUpdating(true);
    const result = await updateRsvp(manageToken, {
      phoneNumber: phoneNumber.replace(/\D/g, ""),
      bringingGuest,
      guestFirstName: bringingGuest ? guestFirstName : null,
      guestLastName: bringingGuest ? guestLastName : null,
      dietaryRestrictions: dietary || null,
    });
    setIsUpdating(false);
    if ("error" in result) { setMessage(result.error); return; }
    setMessage("RSVP updated successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your RSVP?")) return;
    setIsCancelling(true);
    const result = await cancelRsvp(manageToken);
    setIsCancelling(false);
    if ("error" in result) { setMessage(result.error); return; }
    setRsvp((prev) => ({ ...prev, status: "CANCELLED" }));
    setMessage("Your RSVP has been cancelled.");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-[#2E4E61] text-white p-6 text-center">
            {organization.logoIconUrl && <img src={organization.logoIconUrl} alt="" className="h-10 w-10 mx-auto mb-3" />}
            <h1 className="text-xl font-bold mb-1">Manage Your RSVP</h1>
            <p className="text-white/70 text-sm">{invitee.firstName} {invitee.lastName}</p>
          </div>
          <div className="p-6">
            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mb-4 ${status.bgColor} ${status.color}`}>
              {RSVP_STATUS_LABELS[rsvp.status] ?? rsvp.status}
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">{event.name}</h2>
            <div className="space-y-2 text-sm text-gray-600 mb-6">
              <p className="flex items-center gap-2"><Calendar className="h-4 w-4" />{formatDate(new Date(event.date))}</p>
              {event.startTime && <p className="flex items-center gap-2"><Clock className="h-4 w-4" />{event.startTime}{event.endTime ? ` - ${event.endTime}` : ""}</p>}
              {event.venueName && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{event.venueName}</p>}
            </div>
            <a href={`/api/calendar/${manageToken}`} className="flex items-center justify-center gap-2 w-full py-2 mb-6 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              <Download className="h-4 w-4" />
              Add to Calendar
            </a>
            {rsvp.status !== "CANCELLED" && rsvp.status !== "DECLINED" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={bringingGuest} onChange={(e) => setBringingGuest(e.target.checked)} id="guest" className="rounded" />
                  <label htmlFor="guest" className="text-sm text-gray-700">Bringing a guest</label>
                </div>
                {bringingGuest && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Guest First Name</label>
                      <input value={guestFirstName} onChange={(e) => setGuestFirstName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Guest Last Name</label>
                      <input value={guestLastName} onChange={(e) => setGuestLastName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Restrictions</label>
                  <textarea value={dietary} onChange={(e) => setDietary(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                {message && <p className="text-sm text-green-600">{message}</p>}
                <button onClick={handleUpdate} disabled={isUpdating} className="w-full py-3 bg-[#2E4E61] text-white rounded-lg font-medium hover:bg-[#2E4E61]/90 disabled:opacity-50">
                  {isUpdating ? "Updating..." : "Update RSVP"}
                </button>
                <button onClick={handleCancel} disabled={isCancelling} className="w-full py-2 text-red-500 text-sm hover:underline">
                  {isCancelling ? "Cancelling..." : "Cancel my RSVP"}
                </button>
              </div>
            )}
          </div>
          <div className="p-4 border-t text-center text-xs text-gray-400">
            {organization.website ? (
              <a href={organization.website} target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">{organization.name}</a>
            ) : organization.name}
          </div>
        </div>
      </div>
    </div>
  );
}
