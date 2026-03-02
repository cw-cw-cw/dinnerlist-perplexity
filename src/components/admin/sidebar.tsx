"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, Users, BarChart3, Settings,
  ChevronDown, ChevronRight, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  {
    label: "Events", href: "/admin/events", icon: Calendar,
    children: [
      { label: "All Events", href: "/admin/events" },
      { label: "Series", href: "/admin/events/series" },
      { label: "Templates", href: "/admin/events/templates" },
    ],
  },
  { label: "Invitees", href: "/admin/invitees", icon: Users },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(["Events"]);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) => prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]);
  };

  const isActive = (href: string) => {
    if (href === "/admin/events") {
      return pathname === "/admin/events" || (pathname.startsWith("/admin/events/") && !pathname.startsWith("/admin/events/series") && !pathname.startsWith("/admin/events/templates"));
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const navContent = (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        const expanded = expandedItems.includes(item.label);
        const hasChildren = item.children && item.children.length > 0;

        return (
          <div key={item.label}>
            <div className="flex items-center">
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex flex-1 items-center gap-3 rounded-button px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-brand-teal-dark text-brand-gold" : "text-white/80 hover:bg-brand-teal-light hover:text-white"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
              {hasChildren && (
                <button onClick={() => toggleExpand(item.label)} className="p-2 text-white/60 hover:text-white">
                  {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )}
            </div>
            {hasChildren && expanded && (
              <div className="ml-8 mt-1 flex flex-col gap-0.5">
                {item.children!.map((child) => (
                  <Link
                    key={child.href} href={child.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "rounded-button px-3 py-2 text-sm transition-colors",
                      pathname === child.href ? "text-brand-gold font-medium" : "text-white/60 hover:text-white"
                    )}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      <button onClick={() => setMobileOpen(true)} className="fixed left-4 top-4 z-50 rounded-button bg-brand-teal p-2 text-white shadow-elevated lg:hidden">
        <Menu className="h-5 w-5" />
      </button>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand-teal transition-transform duration-200 lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between border-b border-brand-teal-light px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gold">
              <span className="text-sm font-bold text-brand-teal-dark">L</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">DinnerList</p>
              <p className="text-xs text-white/60">Larson Financial</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="rounded p-1 text-white/60 hover:text-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{navContent}</div>
        <div className="border-t border-brand-teal-light px-4 py-3">
          <p className="text-xs text-white/40">Physician Event Platform</p>
        </div>
      </aside>
    </>
  );
}
