import {
  Html, Head, Body, Container, Section, Text, Button, Img, Hr, Preview,
} from "@react-email/components";

interface ForwardInvitationEmailProps {
  friendFirstName: string; referrerFirstName: string; referrerLastName: string;
  eventName: string; eventDate: string; eventTime: string;
  venueName: string; venueAddress: string; venueCity?: string; venueState?: string;
  rsvpUrl: string; organizationName: string;
  organizationLogoUrl?: string; organizationWebsite?: string;
}

export function ForwardInvitationEmail({
  friendFirstName, referrerFirstName, referrerLastName, eventName, eventDate, eventTime,
  venueName, venueAddress, venueCity, venueState, rsvpUrl, organizationName,
  organizationLogoUrl, organizationWebsite,
}: ForwardInvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{referrerFirstName} {referrerLastName} has invited you to {eventName}</Preview>
      <Body style={{ backgroundColor: "#f5f5f5", fontFamily: "'Fira Sans', Arial, sans-serif" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff" }}>
          <Section style={{ backgroundColor: "#2E4E61", padding: "32px", textAlign: "center" as const }}>
            {organizationLogoUrl && (
              <Img src={organizationLogoUrl} alt={organizationName} height="40" style={{ margin: "0 auto 16px" }} />
            )}
            <Text style={{ color: "#ffffff", fontSize: "14px", margin: "0 0 8px" }}>
              {referrerFirstName} {referrerLastName} has invited you to
            </Text>
            <Text style={{ color: "#F3C317", fontSize: "24px", fontWeight: "bold", margin: "0" }}>
              {eventName}
            </Text>
          </Section>
          <Section style={{ padding: "32px" }}>
            <Text style={{ color: "#333333", fontSize: "16px", lineHeight: "1.5" }}>Hi {friendFirstName},</Text>
            <Text style={{ color: "#333333", fontSize: "16px", lineHeight: "1.5" }}>
              {referrerFirstName} {referrerLastName} would like you to join them at <strong>{eventName}</strong>.
            </Text>
            <Section style={{ backgroundColor: "#f8f8f8", borderRadius: "8px", padding: "20px", margin: "24px 0" }}>
              <Text style={{ color: "#333", fontSize: "14px", margin: "0 0 8px" }}>
                📅 <strong>{eventDate}</strong> at {eventTime}
              </Text>
              <Text style={{ color: "#333", fontSize: "14px", margin: "0 0 8px" }}>
                📍 <strong>{venueName}</strong>
              </Text>
              <Text style={{ color: "#666", fontSize: "14px", margin: "0" }}>
                {venueAddress}{venueCity ? `, ${venueCity}` : ""}{venueState ? `, ${venueState}` : ""}
              </Text>
            </Section>
            <Section style={{ textAlign: "center" as const }}>
              <Button href={rsvpUrl} style={{ backgroundColor: "#F3C317", color: "#2E4E61", fontWeight: "bold", padding: "14px 32px", borderRadius: "8px", textDecoration: "none", fontSize: "16px" }}>
                RSVP Now
              </Button>
            </Section>
          </Section>
          <Hr style={{ borderColor: "#e0e0e0" }} />
          <Section style={{ padding: "16px 32px", textAlign: "center" as const }}>
            <Text style={{ color: "#999", fontSize: "12px" }}>
              {organizationWebsite ? (
                <a href={organizationWebsite} style={{ color: "#999" }}>{organizationName}</a>
              ) : organizationName}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ForwardInvitationEmail;
