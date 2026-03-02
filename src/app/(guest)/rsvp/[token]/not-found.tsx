import Link from "next/link";

export default function RSVPNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-16 h-16 bg-[#2E4E61] rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl font-bold text-white">L</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation Not Found</h1>
        <p className="text-gray-600 mb-6">
          This invitation link may be invalid or expired. Please check the link and try again,
          or contact the event organizer for assistance.
        </p>
      </div>
    </div>
  );
}
