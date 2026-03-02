"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/admin/stat-card";
import { Eye, MousePointer, Clock, Users, Share2 } from "lucide-react";

interface Props {
  events: { id: string; name: string; date: string }[];
  invitations: {
    id: string;
    status: string;
    openedAt: Date | null;
    clickedAt: Date | null;
    timeOnPage: number | null;
    eventId: string;
    referredByInviteeId: string | null;
  }[];
  rsvps: {
    id: string;
    status: string;
    createdAt: string;
    invitation: { eventId: string };
  }[];
}

export function AnalyticsDashboard({ events, invitations, rsvps }: Props) {
  const stats = useMemo(() => {
    const totalInvitations = invitations.length;
    const opened = invitations.filter((i) => i.openedAt).length;
    const clicked = invitations.filter((i) => i.clickedAt).length;
    const referrals = invitations.filter((i) => i.referredByInviteeId).length;
    const avgTimeOnPage = invitations.filter((i) => i.timeOnPage).length > 0
      ? Math.round(invitations.filter((i) => i.timeOnPage).reduce((sum, i) => sum + (i.timeOnPage ?? 0), 0) / invitations.filter((i) => i.timeOnPage).length)
      : 0;
    const totalRsvps = rsvps.length;
    const accepted = rsvps.filter((r) => r.status === "CONFIRMED").length;
    const openRate = totalInvitations > 0 ? Math.round((opened / totalInvitations) * 100) : 0;
    const clickRate = opened > 0 ? Math.round((clicked / opened) * 100) : 0;
    const conversionRate = clicked > 0 ? Math.round((totalRsvps / clicked) * 100) : 0;
    return { totalInvitations, opened, clicked, referrals, avgTimeOnPage, totalRsvps, accepted, openRate, clickRate, conversionRate };
  }, [invitations, rsvps]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Invitations" value={stats.totalInvitations} icon={Users} />
        <StatCard title="Open Rate" value={`${stats.openRate}%`} icon={Eye} />
        <StatCard title="Click Rate" value={`${stats.clickRate}%`} icon={MousePointer} />
        <StatCard title="Avg Time on Page" value={`${stats.avgTimeOnPage}s`} icon={Clock} />
        <StatCard title="Referrals" value={stats.referrals} icon={Share2} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>RSVP Funnel</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <FunnelBar label="Invitations Sent" value={stats.totalInvitations} max={stats.totalInvitations} />
              <FunnelBar label="Opened" value={stats.opened} max={stats.totalInvitations} />
              <FunnelBar label="Clicked" value={stats.clicked} max={stats.totalInvitations} />
              <FunnelBar label="RSVPs" value={stats.totalRsvps} max={stats.totalInvitations} />
              <FunnelBar label="Accepted" value={stats.accepted} max={stats.totalInvitations} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Events Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.slice(0, 10).map((event) => {
                const eventRsvps = rsvps.filter((r) => r.invitation.eventId === event.id);
                const eventInvitations = invitations.filter((i) => i.eventId === event.id);
                const acceptedCount = eventRsvps.filter((r) => r.status === "CONFIRMED").length;
                return (
                  <div key={event.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-text-primary text-sm">{event.name}</p>
                      <p className="text-xs text-text-muted">{new Date(event.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-text-primary">{acceptedCount} accepted</p>
                      <p className="text-text-muted">{eventInvitations.length} invited</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FunnelBar({ label, value, max }: { label: string; value: number; max: number }) {
  const percent = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-text-primary">{label}</span>
        <span className="text-text-muted">{value} ({Math.round(percent)}%)</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-brand-teal rounded-full transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
