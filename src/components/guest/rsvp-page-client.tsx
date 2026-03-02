"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { MotionDiv } from "@/components/motion/motion-div";
import { cn } from "@/lib/utils/cn";
import { submitRSVP, joinWaitlist } from "@/actions/rsvp";
import {
  Calendar, Clock, MapPin, Check, Users, AlertCircle, X,
  CalendarPlus, Share2, Settings,
} from "lucide-react";

type PageState = "INVITATION" | "CONFIRMED" | "WAITLISTED" | "DECLINED" | "ALREADY_RESPONDED" | "EVENT_FULL";

interface RSVPPageClientProps {
  invitation: { id: string; token: string };
  event: {
    id: string; name: string; date: string; startTime: unknown; endTime?: unknown;
    venueName: string; venueAddress: string; venueCity?: string; venueState?: string;
    venueImageUrl?: string; publicCapacity: number; privateCapacity: number;
    description?: string; invitationHeadline?: string; invitationBody?: string;
    confirmationMessage?: string; hostName?: string; hostPhotoUrl?: string;
    hostBio?: string; waitlistEnabled: boolean;
  };
  invitee: { id: string; firstName: string; lastName: string; title?: string; credentials?: string; };
  organization: { name: string; logoUrl?: string; logoIconUrl?: string; website?: string; };
  existingRsvp?: {
    id: string; status: string; bringingGuest: boolean; guestName?: string;
    guestFirstName?: string | null; guestLastName?: string | null;
    phoneNumber?: string; dietaryRestrictions?: string;
  } | null;
  spotsRemaining: { display: string; isFull: boolean; isWaitlistOnly: boolean; };
  percentFull?: number;
  urgencyLevel?: "low" | "medium" | "high" | "full";
  manageToken?: string;
  alternateEvents?: Array<{ id: string; name: string; date: string; startTime?: unknown; venueName: string; venueCity?: string; venueState?: string; spotsDisplay?: string; }>;
}

const contentVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2, ease: "easeIn" as const } },
};

function formatPhoneDisplay(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export function RSVPPageClient({
  invitation, event, invitee, organization, existingRsvp,
  spotsRemaining, percentFull, urgencyLevel, manageToken: initialManageToken, alternateEvents = [],
}: RSVPPageClientProps) {
  const getInitialState = (): PageState => {
    if (existingRsvp) return "ALREADY_RESPONDED";
    if (spotsRemaining.isFull) return "EVENT_FULL";
    return "INVITATION";
  };

  const [pageState, setPageState] = useState<PageState>(getInitialState);
  const [isPending, startTransition] = useTransition();
  const [bringingGuest, setBringingGuest] = useState(existingRsvp?.bringingGuest ?? false);
  const [guestFirstName, setGuestFirstName] = useState(existingRsvp?.guestFirstName ?? "");
  const [guestLastName, setGuestLastName] = useState(existingRsvp?.guestLastName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(existingRsvp?.phoneNumber ?? "");
  const [dietaryRestrictions, setDietaryRestrictions] = useState(existingRsvp?.dietaryRestrictions ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  const [manageToken, setManageToken] = useState<string | undefined>(initialManageToken);

  useEffect(() => {
    if (pageState === "INVITATION" || pageState === "EVENT_FULL") {
      fetch("/api/track", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationToken: invitation.token, action: "click" }),
      }).catch(() => {});

      const startTime = Date.now();
      const heartbeatInterval = setInterval(() => {
        const duration = Math.round((Date.now() - startTime) / 1000);
        fetch("/api/track", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitationToken: invitation.token, action: "heartbeat", duration }),
        }).catch(() => {});
      }, 15000);

      const handleUnload = () => {
        const duration = Math.round((Date.now() - startTime) / 1000);
        navigator.sendBeacon("/api/track", JSON.stringify({ invitationToken: invitation.token, action: "heartbeat", duration }));
      };
      window.addEventListener("beforeunload", handleUnload);
      return () => { clearInterval(heartbeatInterval); window.removeEventListener("beforeunload", handleUnload); };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayTitle = invitee.title ?? "Dr.";
  const displayName = `${displayTitle} ${invitee.lastName}`;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(formatPhoneDisplay(raw));
  };

  const handleDecline = useCallback(() => {
    startTransition(async () => {
      const result = await submitRSVP({ eventId: event.id, inviteeId: invitee.id, invitationId: invitation.id, response: "decline", bringingGuest: false });
      if (result.success) { setPageState("DECLINED"); } else { setFormError(result.error ?? "Something went wrong"); }
    });
  }, [event.id, invitee.id, invitation.id]);

  const handleSubmitRSVP = useCallback(() => {
    setFormError(null);
    const phoneDigits = phoneNumber.replace(/\D/g, "");
    if (phoneDigits.length < 10) { setFormError("Please enter a valid phone number (10 digits)"); return; }
    if (bringingGuest && !guestFirstName.trim()) { setFormError("Please enter your guest's first name"); return; }
    if (bringingGuest && !guestLastName.trim()) { setFormError("Please enter your guest's last name"); return; }

    startTransition(async () => {
      const result = await submitRSVP({
        eventId: event.id, inviteeId: invitee.id, invitationId: invitation.id, response: "accept",
        bringingGuest, guestFirstName: bringingGuest ? guestFirstName.trim() : undefined,
        guestLastName: bringingGuest ? guestLastName.trim() : undefined,
        phoneNumber: phoneNumber.replace(/\D/g, "") || undefined,
        dietaryRestrictions: dietaryRestrictions.trim() || undefined,
      });
      if (result.success) {
        if (result.data?.manageToken) setManageToken(result.data.manageToken);
        if (result.data?.status === "WAITLISTED") { setWaitlistPosition(result.data.waitlistPosition ?? null); setPageState("WAITLISTED"); }
        else { setPageState("CONFIRMED"); }
      } else { setFormError(result.error ?? "Something went wrong"); }
    });
  }, [event.id, invitee.id, invitation.id, bringingGuest, guestFirstName, guestLastName, phoneNumber, dietaryRestrictions]);

  const handleJoinWaitlist = useCallback(() => {
    setFormError(null);
    const phoneDigits = phoneNumber.replace(/\D/g, "");
    if (phoneDigits.length < 10) { setFormError("Please enter a valid phone number (10 digits)"); return; }
    startTransition(async () => {
      const result = await joinWaitlist({ eventId: event.id, inviteeId: invitee.id, invitationId: invitation.id, phoneNumber: phoneNumber.replace(/\D/g, "") || undefined });
      if (result.success) { setWaitlistPosition(result.data?.waitlistPosition ?? null); setPageState("WAITLISTED"); }
      else { setFormError(result.error ?? "Something went wrong"); }
    });
  }, [event.id, invitee.id, invitation.id, phoneNumber]);

  const LogoIcon = () => (
    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-6 mx-auto">
      {organization.logoIconUrl ? (
        <img src={organization.logoIconUrl} alt={organization.name} className="w-8 h-8 object-contain" />
      ) : (
        <span className="text-brand-teal font-bold text-xl">{organization.name.charAt(0)}</span>
      )}
    </div>
  );

  const Footer = () => (
    <div className="bg-brand-dark px-6 py-8">
      <div className="max-w-lg mx-auto text-center">
        {organization.logoUrl ? (
          <img src={organization.logoUrl} alt={organization.name} className="h-8 mx-auto mb-3 brightness-0 invert opacity-80" />
        ) : (
          <p className="text-white/80 font-medium text-sm mb-1">{organization.name}</p>
        )}
        {organization.website && <p className="text-white/40 text-xs">{organization.website}</p>}
      </div>
    </div>
  );

  const InlineFormFields = () => (
    <div className="mt-8 space-y-6">
      <div>
        <label className="block text-white font-medium mb-3">Will you be bringing a guest?</label>
        <div className="flex gap-3">
          <button type="button" onClick={() => setBringingGuest(true)}
            className={cn("flex-1 py-3 rounded-[12px] font-medium text-sm transition-all duration-150",
              bringingGuest ? "bg-brand-gold-soft text-text-primary border border-brand-gold-border" : "bg-white/10 text-white/80 border border-white/20 hover:bg-white/15")}>Yes</button>
          <button type="button" onClick={() => { setBringingGuest(false); setGuestFirstName(""); setGuestLastName(""); }}
            className={cn("flex-1 py-3 rounded-[12px] font-medium text-sm transition-all duration-150",
              !bringingGuest ? "bg-brand-gold-soft text-text-primary border border-brand-gold-border" : "bg-white/10 text-white/80 border border-white/20 hover:bg-white/15")}>No</button>
        </div>
      </div>
      {bringingGuest && (
        <MotionDiv initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
          <label className="block text-white font-medium mb-2">Guest&apos;s Name *</label>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={guestFirstName} onChange={(e) => setGuestFirstName(e.target.value)} placeholder="First name"
              className="w-full bg-white rounded-[12px] px-4 py-3 text-text-primary placeholder:text-text-muted/60 outline-none focus:ring-2 focus:ring-brand-gold/50" />
            <input type="text" value={guestLastName} onChange={(e) => setGuestLastName(e.target.value)} placeholder="Last name"
              className="w-full bg-white rounded-[12px] px-4 py-3 text-text-primary placeholder:text-text-muted/60 outline-none focus:ring-2 focus:ring-brand-gold/50" />
          </div>
        </MotionDiv>
      )}
      <div>
        <label className="block text-white font-medium mb-2">Your Phone Number *</label>
        <input type="tel" value={phoneNumber} onChange={handlePhoneChange} placeholder="(555) 555-5555"
          className="w-full bg-white rounded-[12px] px-4 py-3 text-text-primary placeholder:text-text-muted/60 outline-none focus:ring-2 focus:ring-brand-gold/50" />
      </div>
      <div>
        <label className="block text-white font-medium mb-2">Any dietary restrictions?</label>
        <input type="text" value={dietaryRestrictions} onChange={(e) => setDietaryRestrictions(e.target.value)} placeholder="Optional"
          className="w-full bg-white rounded-[12px] px-4 py-3 text-text-primary placeholder:text-text-muted/60 outline-none focus:ring-2 focus:ring-brand-gold/50" />
      </div>
    </div>
  );

  const renderInvitation = () => (
    <MotionDiv key="invitation" variants={contentVariants} initial="initial" animate="animate" exit="exit">
      <div className="bg-brand-teal px-6 pt-12 pb-10">
        <div className="max-w-lg mx-auto text-center">
          <LogoIcon />
          <h1 className="text-brand-gold text-3xl font-bold mb-3">You&apos;re Invited, {displayName}</h1>
          <p className="text-brand-gold/80 italic text-lg mb-8">{event.invitationHeadline ?? event.name}</p>
          {event.venueImageUrl && (
            <div className="rounded-[20px] overflow-hidden mb-8 shadow-elevated">
              <img src={event.venueImageUrl} alt={event.venueName} className="w-full h-48 object-cover" />
            </div>
          )}
          <p className="text-white/90 font-light leading-relaxed mb-6 text-base">
            {event.invitationBody ?? "Join us for an evening of great food and meaningful conversation with fellow physicians. No sales pitch. No slides. Just good food and practical conversation."}
          </p>
        </div>
      </div>
      <div className="bg-brand-teal px-6 pt-8 pb-10">
        <div className="max-w-lg mx-auto text-center">
          <div className="text-left"><InlineFormFields /></div>
          {formError && (
            <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 bg-danger/20 border border-danger/30 rounded-[12px] px-4 py-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
              <p className="text-white text-sm">{formError}</p>
            </MotionDiv>
          )}
          <button onClick={handleSubmitRSVP} disabled={isPending}
            className={cn("w-full mt-8 bg-brand-gold-soft border border-brand-gold-border text-text-primary rounded-[20px] px-8 py-4 font-medium text-lg",
              "hover:bg-brand-gold/30 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed")}>
            {isPending ? "Confirming..." : "Confirm My RSVP"}
          </button>
          <button onClick={handleDecline} disabled={isPending}
            className="mt-4 text-white/60 text-sm cursor-pointer hover:text-white/80 transition-colors disabled:opacity-50">
            {isPending ? "Processing..." : "Decline with regrets"}
          </button>
          <a href={`/rsvp/forward/${invitation.token}`} className="mt-4 flex items-center justify-center gap-2 text-white/60 text-sm hover:text-white/80 transition-colors">
            <Share2 className="w-4 h-4" />Invite a friend
          </a>
        </div>
      </div>
      <Footer />
    </MotionDiv>
  );

  const renderConfirmed = () => (
    <MotionDiv key="confirmed" variants={contentVariants} initial="initial" animate="animate" exit="exit">
      <div className="bg-brand-teal px-6 pt-12 pb-10">
        <div className="max-w-lg mx-auto text-center">
          <LogoIcon />
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-brand-gold text-2xl font-bold mb-4">You&apos;re confirmed!</h2>
          <p className="text-white/90 leading-relaxed mb-8">
            {event.confirmationMessage ?? `${displayName}, we look forward to seeing you at ${event.venueName}.`}
          </p>
          {manageToken && (
            <div className="space-y-3">
              <a href={`/api/calendar/${manageToken}`}
                className={cn("w-full flex items-center justify-center gap-2 bg-brand-gold-soft border border-brand-gold-border text-text-primary rounded-[20px] px-8 py-4 font-medium",
                  "hover:bg-brand-gold/30 active:scale-[0.98] transition-all duration-150")}>
                <CalendarPlus className="w-5 h-5" />Add to Calendar
              </a>
              <a href={`/rsvp/manage/${manageToken}`}
                className={cn("w-full flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white rounded-[20px] px-8 py-4 font-medium",
                  "hover:bg-white/15 active:scale-[0.98] transition-all duration-150")}>
                <Settings className="w-5 h-5" />Manage My RSVP
              </a>
            </div>
          )}
          <a href={`/rsvp/forward/${invitation.token}`} className="mt-3 flex items-center justify-center gap-2 text-white/60 text-sm hover:text-white/80 transition-colors">
            <Share2 className="w-4 h-4" />Invite a friend
          </a>
        </div>
      </div>
      <Footer />
    </MotionDiv>
  );

  const renderWaitlisted = () => (
    <MotionDiv key="waitlisted" variants={contentVariants} initial="initial" animate="animate" exit="exit">
      <div className="bg-brand-teal px-6 pt-12 pb-10">
        <div className="max-w-lg mx-auto text-center">
          <LogoIcon />
          <div className="w-16 h-16 rounded-full bg-waitlist/20 flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-waitlist" />
          </div>
          <h2 className="text-brand-gold text-2xl font-bold mb-4">You&apos;re on the waitlist</h2>
          <p className="text-white/90 leading-relaxed mb-4">{displayName}, this dinner is currently at capacity, but we&apos;ve added you to the waitlist.</p>
          {waitlistPosition && <p className="text-brand-gold/80 text-sm mb-6">Your waitlist position: #{waitlistPosition}</p>}
          <p className="text-white/60 text-sm leading-relaxed mb-8">We&apos;ll notify you right away if a spot opens up.</p>
        </div>
      </div>
      <Footer />
    </MotionDiv>
  );

  const renderDeclined = () => (
    <MotionDiv key="declined" variants={contentVariants} initial="initial" animate="animate" exit="exit">
      <div className="bg-brand-teal px-6 pt-12 pb-10">
        <div className="max-w-lg mx-auto text-center">
          <LogoIcon />
          <h2 className="text-brand-gold text-2xl font-bold mb-4">We&apos;ll miss you</h2>
          <p className="text-white/90 leading-relaxed mb-8">Thank you for letting us know, {displayName}. We hope to see you at a future dinner.</p>
          <button onClick={() => setPageState("INVITATION")} className="mt-6 text-white/60 text-sm hover:text-white/80 transition-colors">
            Changed your mind? Go back to accept
          </button>
        </div>
      </div>
      <Footer />
    </MotionDiv>
  );

  const renderAlreadyResponded = () => {
    const current = existingRsvp ? (
      existingRsvp.status === "CONFIRMED" ? { label: "Accepted", icon: <Check className="w-6 h-6" />, color: "text-success bg-success/20" } :
      existingRsvp.status === "WAITLISTED" ? { label: "Waitlisted", icon: <Users className="w-6 h-6" />, color: "text-waitlist bg-waitlist/20" } :
      existingRsvp.status === "DECLINED" ? { label: "Declined", icon: <X className="w-6 h-6" />, color: "text-danger bg-danger/20" } :
      { label: existingRsvp.status, icon: <AlertCircle className="w-6 h-6" />, color: "text-white bg-white/10" }
    ) : null;

    const guestDisplayName = existingRsvp?.guestFirstName || existingRsvp?.guestLastName
      ? [existingRsvp?.guestFirstName, existingRsvp?.guestLastName].filter(Boolean).join(" ")
      : existingRsvp?.guestName;

    return (
      <MotionDiv key="already-responded" variants={contentVariants} initial="initial" animate="animate" exit="exit">
        <div className="bg-brand-teal px-6 pt-12 pb-10">
          <div className="max-w-lg mx-auto text-center">
            <LogoIcon />
            {current && (
              <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6", current.color)}>
                {current.icon}
              </div>
            )}
            <h2 className="text-brand-gold text-2xl font-bold mb-2">
              {existingRsvp?.status === "CONFIRMED" ? "You're confirmed!" :
               existingRsvp?.status === "WAITLISTED" ? "You're on the waitlist" :
               existingRsvp?.status === "DECLINED" ? "You declined this invitation" : "Your RSVP status"}
            </h2>
            <p className="text-white/80 text-sm mb-6">Status: {current?.label}</p>
            {existingRsvp?.status === "CONFIRMED" && manageToken && (
              <div className="space-y-3 mb-4">
                <a href={`/api/calendar/${manageToken}`}
                  className={cn("w-full flex items-center justify-center gap-2 bg-brand-gold-soft border border-brand-gold-border text-text-primary rounded-[20px] px-8 py-4 font-medium",
                    "hover:bg-brand-gold/30 active:scale-[0.98] transition-all duration-150")}>
                  <CalendarPlus className="w-5 h-5" />Add to Calendar
                </a>
                <a href={`/rsvp/manage/${manageToken}`}
                  className={cn("w-full flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white rounded-[20px] px-8 py-4 font-medium",
                    "hover:bg-white/15 active:scale-[0.98] transition-all duration-150")}>
                  <Settings className="w-5 h-5" />Manage My RSVP
                </a>
              </div>
            )}
            {(existingRsvp?.status === "CONFIRMED" || existingRsvp?.status === "DECLINED") && (
              <button onClick={() => setPageState("INVITATION")}
                className={cn("w-full bg-white/10 border border-white/20 text-white rounded-[20px] px-8 py-4 font-medium", "hover:bg-white/15 active:scale-[0.98] transition-all duration-150")}>
                {existingRsvp.status === "CONFIRMED" ? "Update My RSVP" : "Change to Accept"}
              </button>
            )}
            {existingRsvp?.status === "CONFIRMED" && (
              <a href={`/rsvp/forward/${invitation.token}`} className="mt-3 flex items-center justify-center gap-2 text-white/60 text-sm hover:text-white/80 transition-colors">
                <Share2 className="w-4 h-4" />Invite a friend
              </a>
            )}
          </div>
        </div>
        <Footer />
      </MotionDiv>
    );
  };

  const renderEventFull = () => (
    <MotionDiv key="event-full" variants={contentVariants} initial="initial" animate="animate" exit="exit">
      <div className="bg-brand-teal px-6 pt-12 pb-10">
        <div className="max-w-lg mx-auto text-center">
          <LogoIcon />
          <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-warning" />
          </div>
          <h2 className="text-brand-gold text-2xl font-bold mb-4">This dinner is at capacity</h2>
          <p className="text-white/90 leading-relaxed mb-8">
            {displayName}, unfortunately this dinner has reached its capacity.
            {event.waitlistEnabled && " You can join the waitlist and we'll notify you if a spot opens up."}
          </p>
          {event.waitlistEnabled && (
            <>
              <div className="mb-6 text-left">
                <label className="block text-white font-medium mb-2 text-sm">Your phone number (for waitlist notifications) *</label>
                <input type="tel" value={phoneNumber} onChange={handlePhoneChange} placeholder="(555) 555-5555"
                  className="w-full bg-white rounded-[12px] px-4 py-3 text-text-primary placeholder:text-text-muted/60 outline-none focus:ring-2 focus:ring-brand-gold/50" />
              </div>
              {formError && (
                <div className="mb-4 bg-danger/20 border border-danger/30 rounded-[12px] px-4 py-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
                  <p className="text-white text-sm">{formError}</p>
                </div>
              )}
              <button onClick={handleJoinWaitlist} disabled={isPending}
                className={cn("w-full bg-brand-gold-soft border border-brand-gold-border text-text-primary rounded-[20px] px-8 py-4 font-medium text-lg",
                  "hover:bg-brand-gold/30 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed mb-6")}>
                {isPending ? "Joining..." : "Join the Waitlist"}
              </button>
            </>
          )}
          <button onClick={handleDecline} disabled={isPending}
            className="mt-4 text-white/60 text-sm cursor-pointer hover:text-white/80 transition-colors disabled:opacity-50">
            Decline with regrets
          </button>
        </div>
      </div>
      <Footer />
    </MotionDiv>
  );

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="max-w-lg mx-auto min-h-screen bg-white shadow-elevated">
        <AnimatePresence mode="wait">
          {pageState === "INVITATION" && renderInvitation()}
          {pageState === "CONFIRMED" && renderConfirmed()}
          {pageState === "WAITLISTED" && renderWaitlisted()}
          {pageState === "DECLINED" && renderDeclined()}
          {pageState === "ALREADY_RESPONDED" && renderAlreadyResponded()}
          {pageState === "EVENT_FULL" && renderEventFull()}
        </AnimatePresence>
      </div>
    </div>
  );
}
