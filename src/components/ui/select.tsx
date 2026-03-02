import React from "react";
import { cn } from "@/lib/utils/cn";

export interface SelectOption { value: string; label: string; }

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id || props.name;
    return (
      <div className="w-full">
        {label && <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-text-primary">{label}</label>}
        <select
          ref={ref} id={selectId}
          className={cn(
            "w-full rounded-button border border-border bg-white px-3 py-2 text-sm text-text-primary transition-colors appearance-none",
            "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_0.75rem_center] bg-no-repeat pr-10",
            "focus:border-brand-teal focus:ring-1 focus:ring-brand-teal focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-muted",
            error && "border-danger focus:border-danger focus:ring-danger",
            className
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {error && <p id={`${selectId}-error`} className="mt-1 text-sm text-danger" role="alert">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
