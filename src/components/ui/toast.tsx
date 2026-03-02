"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

export type ToastVariant = "default" | "success" | "error";

export interface ToastData {
  id: string; title: string; description?: string; variant?: ToastVariant;
}

const variantStyles: Record<ToastVariant, string> = {
  default: "border-l-4 border-l-brand-teal",
  success: "border-l-4 border-l-success",
  error: "border-l-4 border-l-danger",
};

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showTimer = requestAnimationFrame(() => setIsVisible(true));
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 5000);
    return () => { cancelAnimationFrame(showTimer); clearTimeout(dismissTimer); };
  }, [toast.id, onDismiss]);

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto w-80 rounded-card bg-white shadow-elevated transition-all duration-300 ease-in-out",
        variantStyles[toast.variant || "default"],
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary">{toast.title}</p>
          {toast.description && <p className="mt-0.5 text-sm text-text-muted">{toast.description}</p>}
        </div>
        <button
          type="button"
          onClick={() => { setIsVisible(false); setTimeout(() => onDismiss(toast.id), 300); }}
          className="shrink-0 rounded-button p-1 text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors"
          aria-label="Dismiss notification"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export interface ToastContainerProps { toasts: ToastData[]; onDismiss: (id: string) => void; className?: string; }

export function ToastContainer({ toasts, onDismiss, className }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div className={cn("pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2", className)} aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
