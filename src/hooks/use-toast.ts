"use client";

import { useState, useCallback } from "react";

export interface Toast {
  id: string; title: string; description?: string;
  variant?: "default" | "success" | "error";
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    ({ title, description, variant = "default" }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      const newToast: Toast = { id, title, description, variant };
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => { setToasts((prev) => prev.filter((t) => t.id !== id)); }, 5000);
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}
