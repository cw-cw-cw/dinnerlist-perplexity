import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted">
      <div className="text-center">
        <div className="w-16 h-16 bg-brand-teal rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl font-bold text-white">L</span>
        </div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">404</h1>
        <p className="text-text-muted mb-6">Page not found</p>
        <Link href="/admin/dashboard" className="inline-flex items-center px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
