"use client";

import { useState } from "react";
import { forwardInvitation } from "@/actions/forward";
import { formatDate } from "@/lib/utils/dates";
import { Mail, MessageSquare, Copy, Check } from "lucide-react";

interface Props {
  token: string;
  referrerName: string;
  eventName: string;
  eventDate: string;
  organization: {
    name: string;
    logoUrl: string | null;
    logoIconUrl: string | null;
    website: string | null;
  };
}

export function ForwardClient({ token, referrerName, eventName, eventDate, organization }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [rsvpUrl, setRsvpUrl] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    const result = await forwardInvitation({ token, friendFirstName: firstName, friendLastName: lastName, friendEmail: email });
    setIsSubmitting(false);
    if ("error" in result) { setError(result.error); return; }
    if (result.success && result.data) {
      const url = `${window.location.origin}/rsvp/${result.data.invitationToken}`;
      setRsvpUrl(url);
    }
    setSubmitted(true);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rsvpUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (submitted) {
    const smsBody = encodeURIComponent(`You're invited to ${eventName}! RSVP here: ${rsvpUrl}`);
    const emailSubject = encodeURIComponent(`${referrerName} has invited you to ${eventName}`);
    const emailBody = encodeURIComponent(`Hi ${firstName},\n\n${referrerName} would like to invite you to ${eventName} on ${formatDate(new Date(eventDate))}.\n\nRSVP here: ${rsvpUrl}\n\nHope to see you there!`);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            {organization.logoIconUrl && <img src={organization.logoIconUrl} alt="" className="h-10 w-10 mx-auto mb-3" />}
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Invitation Sent!</h2>
            <p className="text-gray-600">An email has been sent to {firstName} with the RSVP link.</p>
          </div>
          <p className="text-sm text-gray-500 mb-3">You can also send this link directly:</p>
          <div className="flex items-center gap-2 mb-4">
            <input value={rsvpUrl} readOnly className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50" />
            <button onClick={handleCopy} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex gap-3">
            <a href={`sms:?body=${smsBody}`} className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
              <MessageSquare className="h-4 w-4" /> Text
            </a>
            <a href={`mailto:${email}?subject=${emailSubject}&body=${emailBody}`} className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              <Mail className="h-4 w-4" /> Email
            </a>
          </div>
          <div className="mt-6 pt-4 border-t text-center text-xs text-gray-400">
            {organization.website ? (<a href={organization.website} target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">{organization.name}</a>) : organization.name}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          {organization.logoIconUrl && <img src={organization.logoIconUrl} alt="" className="h-10 w-10 mx-auto mb-3" />}
          <h2 className="text-xl font-bold text-gray-900 mb-1">Invite a Friend</h2>
          <p className="text-gray-600 text-sm">Send an invitation to {eventName} on {formatDate(new Date(eventDate))}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E4E61]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E4E61]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E4E61]" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-[#2E4E61] text-white font-bold rounded-lg hover:bg-[#2E4E61]/90 disabled:opacity-50">
            {isSubmitting ? "Sending..." : "Send Invitation"}
          </button>
        </form>
        <div className="mt-6 pt-4 border-t text-center text-xs text-gray-400">
          {organization.website ? (<a href={organization.website} target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">{organization.name}</a>) : organization.name}
        </div>
      </div>
    </div>
  );
}
