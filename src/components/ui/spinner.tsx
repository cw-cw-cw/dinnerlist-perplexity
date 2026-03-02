import React from "react";
import { cn } from "@/lib/utils/cn";

const sizeMap = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8", xl: "h-12 w-12" } as const;
export type SpinnerSize = keyof typeof sizeMap;

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> { size?: SpinnerSize; className?: string; }

export const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ size = "md", className, ...props }, ref) => (
    <svg ref={ref} className={cn("animate-spin text-brand-teal", sizeMap[size], className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" role="status" aria-label="Loading" {...props}>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
);

Spinner.displayName = "Spinner";
