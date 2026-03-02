import React from "react";
import { cn } from "@/lib/utils/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { className?: string; }

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("animate-pulse bg-gray-200 rounded", className)} aria-hidden="true" {...props} />
  )
);

Skeleton.displayName = "Skeleton";
