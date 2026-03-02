"use client";

import { useState } from "react";
import { unsubscribeAction } from "@/actions/unsubscribe";

interface Props {
  token: string;
  inviteeName: string;
  organizationName: string;
}

export function UnsubClient({ token, inviteeName, organizationName }: Props) {
  const [status, setStatus] = useState<"confirm" | "success" | "error">("confirm");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUnsubscribe = async () => {
    setIsSubmitting(true);
    const result = await unsubscribeAction(token);
    setIsSubmitting(false);
    if ("error" in result) { setStatus("error"); return; }
    setStatus("success");
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Unsubscribed</h1>
          <p className="text-gray-600">You have been successfully unsubscribed from {organizationName} event invitations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Unsubscribe</h1>
        <p className="text-gray-600 mb-6">{inviteeName}, would you like to unsubscribe from future event invitations from {organizationName}?</p>
        <button onClick={handleUnsubscribe} disabled={isSubmitting} className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
          {isSubmitting ? "Processing..." : "Unsubscribe"}
        </button>
        {status === "error" && <p className="mt-4 text-sm text-red-500">Something went wrong. Please try again.</p>}
      </div>
    </div>
  );
}
