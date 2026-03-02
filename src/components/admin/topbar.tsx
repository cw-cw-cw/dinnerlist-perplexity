"use client";

import { LogOut, User } from "lucide-react";
import { logout } from "@/actions/auth";

interface TopbarProps {
  userName?: string;
  organizationName?: string;
  orgName?: string;
}

export function Topbar({ userName = "Admin", organizationName, orgName }: TopbarProps) {
  const displayOrg = organizationName || orgName || "DinnerList";
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white px-6">
      <div className="lg:pl-0 pl-12">
        <h2 className="text-sm font-medium text-text-muted">{displayOrg}</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-text-primary">
          <User className="h-4 w-4 text-text-muted" />
          <span className="hidden sm:inline">{userName}</span>
        </div>
        <form action={logout}>
          <button type="submit" className="flex items-center gap-1.5 rounded-button px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </form>
      </div>
    </header>
  );
}
