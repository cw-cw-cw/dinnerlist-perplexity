"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

const variantStyles = {
  primary: "bg-brand-teal text-white hover:bg-brand-teal-light active:bg-brand-teal-dark",
  accent: "bg-brand-gold-soft border border-brand-gold-border text-text-primary hover:bg-brand-gold-soft/80 active:bg-brand-gold-soft/60 rounded-pill",
  secondary: "bg-white border border-border text-text-primary hover:bg-surface-muted active:bg-gray-100",
  ghost: "bg-transparent text-brand-teal hover:bg-brand-teal/5 active:bg-brand-teal/10",
  danger: "bg-danger text-white hover:bg-danger/90 active:bg-danger/80",
  link: "bg-transparent text-brand-teal underline hover:text-brand-teal-light p-0 h-auto",
} as const;

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
} as const;

export type ButtonVariant = keyof typeof variantStyles;
export type ButtonSize = keyof typeof sizeStyles;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  className?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", isLoading = false, disabled, className, children, ...props }, ref) => {
    const isDisabled = disabled || isLoading;
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2",
          variant !== "accent" && "rounded-button",
          variantStyles[variant], sizeStyles[size],
          isDisabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
