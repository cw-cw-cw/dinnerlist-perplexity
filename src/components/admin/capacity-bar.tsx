import { cn } from "@/lib/utils/cn";

interface CapacityBarProps {
  confirmed: number; publicCapacity: number; privateCapacity: number;
  waitlisted?: number; className?: string;
}

export function CapacityBar({ confirmed, publicCapacity, privateCapacity, waitlisted = 0, className }: CapacityBarProps) {
  const publicPercent = Math.min((confirmed / privateCapacity) * 100, 100);
  const publicCapLine = (publicCapacity / privateCapacity) * 100;
  const fillColor = confirmed >= privateCapacity ? "bg-danger" : confirmed >= publicCapacity ? "bg-warning" : "bg-success";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-text-primary">
          {confirmed} confirmed
          {waitlisted > 0 && <span className="ml-2 text-waitlist">+ {waitlisted} waitlisted</span>}
        </span>
        <span className="text-text-muted">{publicCapacity} public / {privateCapacity} max</span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={cn("h-full rounded-full transition-all duration-500", fillColor)} style={{ width: `${publicPercent}%` }} />
        <div className="absolute top-0 h-full w-0.5 bg-brand-teal" style={{ left: `${publicCapLine}%` }} title={`Public capacity: ${publicCapacity}`} />
      </div>
      <div className="flex justify-between text-xs text-text-muted">
        <span>0</span>
        <span className="text-brand-teal font-medium" style={{ position: "relative", left: `${publicCapLine / 2 - 50}%` }}>Public: {publicCapacity}</span>
        <span>Max: {privateCapacity}</span>
      </div>
    </div>
  );
}
