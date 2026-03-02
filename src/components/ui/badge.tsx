import React from "react";
import { cn } from "@/lib/utils/cn";

const variantStyles = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-50 text-success",
  warning: "bg-amber-50 text-warning",
  danger: "bg-red-50 text-danger",
  info: "bg-blue-50 text-info",
  waitlist: "bg-purple-50 text-waitlist",
} as const;

export type BadgeVariant = keyof typeof variantStyles;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  className?: string;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant], className
      )}
      {...props}
    >
      {children}
    </span>
  )
);

Badge.displayName = "Badge";
