"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors">
      Print
    </button>
  );
}
