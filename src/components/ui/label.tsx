import React from "react";
import { cn } from "@/lib/utils/cn";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> { className?: string; }

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, ...props }, ref) => (
    <label ref={ref} className={cn("text-sm font-medium text-text-primary", className)} {...props}>
      {children}
    </label>
  )
);

Label.displayName = "Label";
