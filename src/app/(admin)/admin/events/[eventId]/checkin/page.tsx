"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminSetRsvpStatus } from "@/actions/admin-rsvp";
import { Search, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

interface Attendee {
  rsvpId: string; inviteeId: string; firstName: string; lastName: string;
  specialty: string | null; phone: string | null; status: string;
  bringingGuest: boolean; guestFirstName: string | null; guestLastName: string | null;
}

export default function CheckInPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/events/${eventId}/attendees`)
      .then((res) => res.json())
      .then((data) => { setAttendees(data.attendees ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [eventId]);

  const toggleCheckIn = useCallback(async (rsvpId: string, currentStatus: string) => {
    const newStatus = currentStatus === "CHECKED_IN" ? "CONFIRMED" : "CHECKED_IN";
    setAttendees((prev) => prev.map((a) => (a.rsvpId === rsvpId ? { ...a, status: newStatus } : a)));
    await adminSetRsvpStatus(rsvpId, newStatus);
  }, []);

  const filtered = attendees.filter((a) => {
    const q = search.toLowerCase();
    return a.firstName.toLowerCase().includes(q) || a.lastName.toLowerCase().includes(q) || (a.specialty?.toLowerCase().includes(q) ?? false);
  });

  const checkedIn = attendees.filter((a) => a.status === "CHECKED_IN").length;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="bg-brand-teal text-white p-4 flex items-center justify-between">
        <button onClick={() => router.push(`/admin/events/${eventId}`)} className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />Back
        </button>
        <h1 className="text-xl font-bold">Check-in</h1>
        <div className="text-lg font-semibold">{checkedIn} / {attendees.length}</div>
      </div>
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search attendees..."
            className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
            autoFocus />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading...</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((attendee) => (
              <button key={attendee.rsvpId} onClick={() => toggleCheckIn(attendee.rsvpId, attendee.status)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${attendee.status === "CHECKED_IN" ? "border-green-500 bg-green-50" : "border-gray-200 bg-white hover:border-brand-teal"}`}
              >
                <div className="text-left">
                  <p className="text-lg font-semibold">{attendee.firstName} {attendee.lastName}</p>
                  <p className="text-sm text-gray-500">
                    {attendee.specialty ?? ""}
                    {attendee.bringingGuest ? ` · +1 ${attendee.guestFirstName ?? ""} ${attendee.guestLastName ?? ""}`.trim() : ""}
                  </p>
                </div>
                {attendee.status === "CHECKED_IN" ? <CheckCircle2 className="h-8 w-8 text-green-500" /> : <div className="h-8 w-8 rounded-full border-2 border-gray-300" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
