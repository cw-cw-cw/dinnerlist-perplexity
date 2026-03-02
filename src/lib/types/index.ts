export type {
  Event,
  EventSeries,
  EventTemplate,
  Invitee,
  Invitation,
  RSVP,
  Organization,
  AdminUser,
  Communication,
  AttendanceHistory,
  SalesforceSync,
  EventType,
  EventStatus,
  InviteeType,
  InvitationStatus,
  RSVPStatus,
  AdminRole,
  WaitlistPriority,
  CommunicationType,
  CommunicationDirection,
  CommunicationStatus,
} from "@prisma/client";

// Composite types
export interface EventWithCounts {
  id: string;
  name: string;
  eventType: string;
  status: string;
  date: Date;
  startTime: Date;
  endTime: Date | null;
  venueName: string;
  venueAddress: string;
  venueCity: string | null;
  venueState: string | null;
  publicCapacity: number;
  privateCapacity: number;
  waitlistEnabled: boolean;
  _count: {
    rsvps: number;
    invitations: number;
  };
  confirmedCount?: number;
}

export interface RsvpWithInvitee {
  id: string;
  status: string;
  bringingGuest: boolean;
  guestName: string | null;
  guestFirstName: string | null;
  guestLastName: string | null;
  phoneNumber: string | null;
  dietaryRestrictions: string | null;
  waitlistPosition: number | null;
  respondedAt: Date;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  checkedInAt: Date | null;
  manageToken: string | null;
  invitee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    credentials: string | null;
    specialty: string | null;
  };
}

export interface InvitationWithInvitee {
  id: string;
  token: string;
  status: string;
  sentAt: Date | null;
  openedAt: Date | null;
  clickedAt: Date | null;
  invitee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    credentials: string | null;
    specialty: string | null;
  };
}
