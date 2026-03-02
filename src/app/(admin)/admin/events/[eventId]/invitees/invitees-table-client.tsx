"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { RSVP_STATUS_LABELS } from "@/lib/constants";
import { adminSetRsvpStatus, adminCreateManualRsvp, adminCreateInviteeAndRsvp } from "@/actions/admin-rsvp";
import { Search, ChevronDown, Copy, Check, UserPlus, Download, X } from "lucide-react";

interface InviteeData {
  id: string; firstName: string; lastName: string; email: string | null;
  phone: string | null; specialty: string | null; credentials: string | null;
  inviteeType: string | null; yearStartedPractice: number | null; unsubscribed: boolean;
}

interface RsvpData {
  id: string; status: string; bringingGuest: boolean;
  guestFirstName: string | null; guestLastName: string | null;
  phoneNumber: string | null; dietaryRestrictions: string | null;
}

interface Invitation {
  id: string; token: string; status: string;
  invitee: InviteeData; rsvp: RsvpData | null;
}

interface AllInvitee {
  id: string; firstName: string; lastName: string;
  email: string | null; specialty: string | null;
}

interface Props {
  eventId: string; invitations: Invitation[]; allInvitees: AllInvitee[];
}

const RSVP_STATUSES = ["CONFIRMED", "WAITLISTED", "DECLINED", "CANCELLED", "PENDING", "NO_SHOW", "CHECKED_IN"];
const INVITATION_STATUSES = ["PENDING", "SENT", "OPENED", "BOUNCED"];

const rsvpStatusBadgeVariant: Record<string, "success" | "warning" | "danger" | "default" | "waitlist" | "info"> = {
  CONFIRMED: "success", WAITLISTED: "waitlist", DECLINED: "danger",
  CANCELLED: "danger", PENDING: "default", NO_SHOW: "warning", CHECKED_IN: "info",
};

const invStatusBadgeVariant: Record<string, "default" | "info" | "warning" | "danger"> = {
  PENDING: "default", SENT: "info", OPENED: "info", BOUNCED: "danger",
};

function ColumnFilterDropdown({ label, options, selected, onSelect }: {
  label: string; options: string[];
  selected: string | null; onSelect: (val: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 text-xs font-medium text-text-muted hover:text-text-primary transition-colors">
        {label}{selected && <span className="text-brand-teal">: {selected}</span>}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-10 mt-1 min-w-[140px] rounded-lg border border-border bg-white shadow-card py-1">
          <button onClick={() => { onSelect(null); setOpen(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-muted text-text-muted">All</button>
          {options.map((opt) => (
            <button key={opt} onClick={() => { onSelect(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-muted ${selected === opt ? "text-brand-teal font-medium" : "text-text-primary"}`}
            >
              {RSVP_STATUS_LABELS[opt] ?? opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadgeDropdown({ invitationId, rsvpId, currentStatus, onStatusChange }: {
  invitationId: string; rsvpId: string | null;
  currentStatus: string | null; onStatusChange: (invitationId: string, newStatus: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSelect = (newStatus: string) => {
    setOpen(false);
    startTransition(async () => {
      if (rsvpId) {
        await adminSetRsvpStatus(rsvpId, newStatus);
      } else {
        await adminCreateManualRsvp(invitationId, newStatus);
      }
      onStatusChange(invitationId, newStatus);
    });
  };

  const variant = currentStatus ? (rsvpStatusBadgeVariant[currentStatus] ?? "default") : "default";
  const label = currentStatus ? (RSVP_STATUS_LABELS[currentStatus] ?? currentStatus) : "Awaiting";

  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen((o) => !o)} disabled={isPending} className="flex items-center gap-1 disabled:opacity-50">
        <Badge variant={currentStatus ? variant : "default"}>{isPending ? "..." : label}</Badge>
        <ChevronDown className="h-3 w-3 text-text-muted" />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-10 mt-1 min-w-[160px] rounded-lg border border-border bg-white shadow-card py-1">
          {RSVP_STATUSES.map((status) => (
            <button key={status} onClick={() => handleSelect(status)}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-muted ${currentStatus === status ? "text-brand-teal font-medium" : "text-text-primary"}`}
            >
              {RSVP_STATUS_LABELS[status] ?? status}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CopyTokenButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const rsvpUrl = typeof window !== "undefined" ? `${window.location.origin}/rsvp/${token}` : `/rsvp/${token}`;
  const handleCopy = () => {
    navigator.clipboard.writeText(rsvpUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <button onClick={handleCopy} title="Copy RSVP URL" className="p-1 rounded hover:bg-surface-muted transition-colors text-text-muted">
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function ManualRsvpDialog({ eventId, allInvitees, existingInviteeIds, onClose, onAdded }: {
  eventId: string; allInvitees: AllInvitee[];
  existingInviteeIds: Set<string>; onClose: () => void; onAdded: (invitation: Invitation) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedInvitee, setSelectedInvitee] = useState<AllInvitee | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState("CONFIRMED");
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"search" | "new">("search");
  const [newFirst, setNewFirst] = useState(""), [newLast, setNewLast] = useState("");
  const [newEmail, setNewEmail] = useState(""), [newPhone, setNewPhone] = useState("");
  const [newSpecialty, setNewSpecialty] = useState("");

  const filteredInvitees = allInvitees
    .filter((inv) => !existingInviteeIds.has(inv.id))
    .filter((inv) => {
      const q = search.toLowerCase();
      return inv.firstName.toLowerCase().includes(q) || inv.lastName.toLowerCase().includes(q) ||
        (inv.email?.toLowerCase().includes(q) ?? false) || (inv.specialty?.toLowerCase().includes(q) ?? false);
    }).slice(0, 10);

  const handleAddExisting = () => {
    if (!selectedInvitee) return;
    startTransition(async () => {
      const result = await adminCreateManualRsvp("", rsvpStatus, { eventId, inviteeId: selectedInvitee.id });
      if (result && "data" in result && result.data?.invitation) {
        onAdded(result.data.invitation as Invitation);
        onClose();
      }
    });
  };

  const handleAddNew = () => {
    if (!newFirst || !newLast || !newEmail) return;
    startTransition(async () => {
      const result = await adminCreateInviteeAndRsvp({ eventId, firstName: newFirst, lastName: newLast, email: newEmail, phone: newPhone || undefined, specialty: newSpecialty || undefined, rsvpStatus });
      if (result && "data" in result && result.data?.invitation) {
        onAdded(result.data.invitation as Invitation);
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-card shadow-card w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-text-primary">Add Invitee / Manual RSVP</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setMode("search")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "search" ? "bg-brand-teal text-white" : "border border-border text-text-muted hover:bg-surface-muted"}`}>Existing Invitee</button>
            <button onClick={() => setMode("new")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "new" ? "bg-brand-teal text-white" : "border border-border text-text-muted hover:bg-surface-muted"}`}>Add New Invitee</button>
          </div>
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1">RSVP Status</label>
            <select value={rsvpStatus} onChange={(e) => setRsvpStatus(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-teal">
              {RSVP_STATUSES.map((s) => <option key={s} value={s}>{RSVP_STATUS_LABELS[s] ?? s}</option>)}
            </select>
          </div>
          {mode === "search" ? (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setSelectedInvitee(null); }} placeholder="Search by name, email, or specialty..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal" autoFocus />
              </div>
              {selectedInvitee ? (
                <div className="p-3 rounded-lg border-2 border-brand-teal bg-surface-muted">
                  <p className="font-medium text-text-primary">{selectedInvitee.firstName} {selectedInvitee.lastName}</p>
                  <p className="text-sm text-text-muted">{selectedInvitee.email} · {selectedInvitee.specialty}</p>
                  <button onClick={() => setSelectedInvitee(null)} className="text-xs text-text-muted hover:text-text-primary mt-1">Change</button>
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  {filteredInvitees.length === 0 ? (
                    <p className="p-3 text-sm text-text-muted text-center">No matching invitees</p>
                  ) : (
                    filteredInvitees.map((inv) => (
                      <button key={inv.id} onClick={() => setSelectedInvitee(inv)} className="w-full text-left px-3 py-2 hover:bg-surface-muted border-b border-border last:border-0 transition-colors">
                        <p className="text-sm font-medium text-text-primary">{inv.firstName} {inv.lastName}</p>
                        <p className="text-xs text-text-muted">{inv.email} · {inv.specialty}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
              <button onClick={handleAddExisting} disabled={!selectedInvitee || isPending}
                className="w-full py-2 bg-brand-teal text-white rounded-lg text-sm font-medium hover:bg-brand-teal/90 transition-colors disabled:opacity-50">
                {isPending ? "Adding..." : "Add to Event"}
              </button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-text-muted block mb-1">First Name *</label><input type="text" value={newFirst} onChange={(e) => setNewFirst(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal" /></div>
                <div><label className="text-xs font-medium text-text-muted block mb-1">Last Name *</label><input type="text" value={newLast} onChange={(e) => setNewLast(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal" /></div>
              </div>
              <div><label className="text-xs font-medium text-text-muted block mb-1">Email *</label><input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal" /></div>
              <div><label className="text-xs font-medium text-text-muted block mb-1">Phone</label><input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal" /></div>
              <div><label className="text-xs font-medium text-text-muted block mb-1">Specialty</label><input type="text" value={newSpecialty} onChange={(e) => setNewSpecialty(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal" /></div>
              <button onClick={handleAddNew} disabled={!newFirst || !newLast || !newEmail || isPending}
                className="w-full py-2 bg-brand-teal text-white rounded-lg text-sm font-medium hover:bg-brand-teal/90 transition-colors disabled:opacity-50">
                {isPending ? "Adding..." : "Create & Add to Event"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function InviteesTableClient({ eventId, invitations: initialInvitations, allInvitees }: Props) {
  const [invitations, setInvitations] = useState<Invitation[]>(initialInvitations);
  const [search, setSearch] = useState("");
  const [filterInvStatus, setFilterInvStatus] = useState<string | null>(null);
  const [filterRsvpStatus, setFilterRsvpStatus] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const existingInviteeIds = new Set(invitations.map((inv) => inv.invitee.id));

  const handleStatusChange = useCallback((invitationId: string, newStatus: string) => {
    setInvitations((prev) => prev.map((inv) => {
      if (inv.id !== invitationId) return inv;
      return {
        ...inv,
        rsvp: inv.rsvp ? { ...inv.rsvp, status: newStatus } : { id: "", status: newStatus, bringingGuest: false, guestFirstName: null, guestLastName: null, phoneNumber: null, dietaryRestrictions: null },
      };
    }));
  }, []);

  const handleAdded = useCallback((invitation: Invitation) => {
    setInvitations((prev) => [...prev, invitation]);
  }, []);

  const filtered = invitations.filter((inv) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || inv.invitee.firstName.toLowerCase().includes(q) || inv.invitee.lastName.toLowerCase().includes(q) || (inv.invitee.email?.toLowerCase().includes(q) ?? false) || (inv.invitee.specialty?.toLowerCase().includes(q) ?? false);
    const matchesInvStatus = !filterInvStatus || inv.status === filterInvStatus;
    const matchesRsvpStatus = !filterRsvpStatus || (inv.rsvp?.status ?? "AWAITING") === filterRsvpStatus;
    return matchesSearch && matchesInvStatus && matchesRsvpStatus;
  });

  const handleExportCsv = () => {
    const headers = ["First Name", "Last Name", "Email", "Phone", "Specialty", "Year Started", "Inv Status", "RSVP Status", "Guest", "Dietary"];
    const rows = filtered.map((inv) => [
      inv.invitee.firstName, inv.invitee.lastName, inv.invitee.email ?? "", inv.invitee.phone ?? "",
      inv.invitee.specialty ?? "", inv.invitee.yearStartedPractice ?? "", inv.status,
      inv.rsvp?.status ?? "AWAITING",
      inv.rsvp?.bringingGuest ? `${inv.rsvp.guestFirstName ?? ""} ${inv.rsvp.guestLastName ?? ""}`.trim() || "Yes" : "No",
      inv.rsvp?.dietaryRestrictions ?? "",
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invitees-${eventId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const acceptedCount = invitations.filter((i) => i.rsvp?.status === "CONFIRMED").length;
  const waitlistedCount = invitations.filter((i) => i.rsvp?.status === "WAITLISTED").length;
  const declinedCount = invitations.filter((i) => i.rsvp?.status === "DECLINED").length;
  const awaitingCount = invitations.filter((i) => !i.rsvp).length;

  return (
    <>
      {showDialog && (
        <ManualRsvpDialog eventId={eventId} allInvitees={allInvitees} existingInviteeIds={existingInviteeIds}
          onClose={() => setShowDialog(false)} onAdded={handleAdded} />
      )}
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="px-3 py-1 rounded-full bg-surface-muted text-text-muted"><strong className="text-text-primary">{invitations.length}</strong> total</span>
        <span className="px-3 py-1 rounded-full bg-green-50 text-green-700"><strong>{acceptedCount}</strong> accepted</span>
        <span className="px-3 py-1 rounded-full bg-yellow-50 text-yellow-700"><strong>{waitlistedCount}</strong> waitlisted</span>
        <span className="px-3 py-1 rounded-full bg-red-50 text-red-700"><strong>{declinedCount}</strong> declined</span>
        <span className="px-3 py-1 rounded-full bg-surface-muted text-text-muted"><strong>{awaitingCount}</strong> awaiting</span>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invitees..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal" />
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCsv} className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-muted transition-colors text-text-primary">
            <Download className="h-4 w-4" />Export CSV
          </button>
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors">
            <UserPlus className="h-4 w-4" />Add Invitee
          </button>
        </div>
      </div>
      <div className="rounded-card border border-border overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-muted">
                <th className="text-left p-3 text-sm font-medium text-text-muted">Name</th>
                <th className="text-left p-3 text-sm font-medium text-text-muted">Email</th>
                <th className="text-left p-3 text-sm font-medium text-text-muted">Specialty</th>
                <th className="text-left p-3 text-sm font-medium text-text-muted">Year</th>
                <th className="text-left p-3 text-sm font-medium text-text-muted">
                  <ColumnFilterDropdown label="Inv Status" options={INVITATION_STATUSES} selected={filterInvStatus} onSelect={setFilterInvStatus} />
                </th>
                <th className="text-left p-3 text-sm font-medium text-text-muted">
                  <ColumnFilterDropdown label="RSVP Status" options={RSVP_STATUSES} selected={filterRsvpStatus} onSelect={setFilterRsvpStatus} />
                </th>
                <th className="text-left p-3 text-sm font-medium text-text-muted">Phone</th>
                <th className="text-left p-3 text-sm font-medium text-text-muted">Guest</th>
                <th className="text-left p-3 text-sm font-medium text-text-muted">Dietary</th>
                <th className="p-3 text-sm font-medium text-text-muted">RSVP Link</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-surface-muted/50 transition-colors">
                  <td className="p-3">
                    <p className="font-medium text-text-primary text-sm">{inv.invitee.firstName} {inv.invitee.lastName}</p>
                    {inv.invitee.credentials && <p className="text-xs text-text-muted">{inv.invitee.credentials}</p>}
                    {inv.invitee.unsubscribed && <span className="text-xs text-red-500">Unsubscribed</span>}
                  </td>
                  <td className="p-3 text-sm text-text-muted">{inv.invitee.email ?? "—"}</td>
                  <td className="p-3 text-sm text-text-muted">{inv.invitee.specialty ?? "—"}</td>
                  <td className="p-3 text-sm text-text-muted">{inv.invitee.yearStartedPractice ?? "—"}</td>
                  <td className="p-3"><Badge variant={invStatusBadgeVariant[inv.status] ?? "default"}>{inv.status}</Badge></td>
                  <td className="p-3">
                    <StatusBadgeDropdown invitationId={inv.id} rsvpId={inv.rsvp?.id ?? null}
                      currentStatus={inv.rsvp?.status ?? null} onStatusChange={handleStatusChange} />
                  </td>
                  <td className="p-3 text-sm text-text-muted">{inv.rsvp?.phoneNumber ?? inv.invitee.phone ?? "—"}</td>
                  <td className="p-3 text-sm text-text-muted">{inv.rsvp?.bringingGuest ? `${inv.rsvp.guestFirstName ?? ""} ${inv.rsvp.guestLastName ?? ""}`.trim() || "Yes" : "—"}</td>
                  <td className="p-3 text-sm text-text-muted">{inv.rsvp?.dietaryRestrictions ?? "—"}</td>
                  <td className="p-3 text-center"><CopyTokenButton token={inv.token} /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="p-8 text-center text-text-muted text-sm">No invitees match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
