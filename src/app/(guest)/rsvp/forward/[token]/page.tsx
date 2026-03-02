import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ForwardClient } from "./forward-client";

export default async function ForwardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { event: { include: { organization: true } }, invitee: true },
  });

  if (!invitation || !invitation.event) notFound();

  const event = invitation.event;
  const org = event.organization;

  return (
    <ForwardClient
      token={token}
      referrerName={`${invitation.invitee.firstName} ${invitation.invitee.lastName}`}
      eventName={event.name}
      eventDate={event.date.toISOString()}
      organization={{ name: org.name, logoUrl: org.logoUrl, logoIconUrl: org.logoIconUrl, website: org.website }}
    />
  );
}
