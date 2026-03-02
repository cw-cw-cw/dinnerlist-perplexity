import React from "react";
import { cn } from "@/lib/utils/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const textareaId = id || props.name;
    return (
      <div className="w-full">
        {label && <label htmlFor={textareaId} className="mb-1 block text-sm font-medium text-text-primary">{label}</label>}
        <textarea
          ref={ref} id={textareaId}
          className={cn(
            "w-full rounded-button border border-border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors min-h-[80px] resize-y",
            "focus:border-brand-teal focus:ring-1 focus:ring-brand-teal focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-muted",
            error && "border-danger focus:border-danger focus:ring-danger",
            className
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          {...props}
        />
        {error && <p id={`${textareaId}-error`} className="mt-1 text-sm text-danger" role="alert">{error}</p>}
        {helperText && !error && <p id={`${textareaId}-helper`} className="mt-1 text-sm text-text-muted">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
