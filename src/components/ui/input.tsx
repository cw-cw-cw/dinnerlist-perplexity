import React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <input
          ref={ref} id={inputId}
          className={cn(
            "w-full rounded-button border border-border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors",
            "focus:border-brand-teal focus:ring-1 focus:ring-brand-teal focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-muted",
            error && "border-danger focus:border-danger focus:ring-danger",
            className
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {error && <p id={`${inputId}-error`} className="mt-1 text-sm text-danger" role="alert">{error}</p>}
        {helperText && !error && <p id={`${inputId}-helper`} className="mt-1 text-sm text-text-muted">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
