export default function RSVPLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto">
        <div className="bg-[#2E4E61] p-8 animate-pulse">
          <div className="h-12 w-12 bg-white/20 rounded-full mx-auto mb-4" />
          <div className="h-6 w-48 bg-white/20 rounded mx-auto mb-2" />
          <div className="h-8 w-64 bg-white/20 rounded mx-auto mb-4" />
          <div className="h-48 w-full bg-white/10 rounded-lg" />
        </div>
        <div className="bg-white p-6 space-y-4 animate-pulse">
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
          <div className="h-12 w-full bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
