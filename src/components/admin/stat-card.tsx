import { cn } from "@/lib/utils/cn";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title?: string;
  label?: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: { value: string; positive: boolean; };
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const variantColors = {
  default: "text-brand-teal bg-brand-teal/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
  danger: "text-danger bg-danger/10",
  info: "text-info bg-info/10",
};

export function StatCard({ title, label, value, icon: Icon, trend, variant = "default", className }: StatCardProps) {
  const displayLabel = title || label || "";
  return (
    <div className={cn("rounded-card border border-border bg-white p-6 shadow-card", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">{displayLabel}</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{value}</p>
          {trend && (
            <p className={cn("mt-1 text-xs font-medium", trend.positive ? "text-success" : "text-danger")}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-card", variantColors[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
