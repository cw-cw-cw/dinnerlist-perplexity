import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UnsubClient } from "./unsub-client";

export default async function UnsubPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      invitee: { select: { firstName: true, lastName: true, email: true } },
      event: { include: { organization: { select: { name: true } } } },
    },
  });

  if (!invitation) notFound();

  return (
    <UnsubClient
      token={token}
      inviteeName={`${invitation.invitee.firstName} ${invitation.invitee.lastName}`}
      organizationName={invitation.event?.organization?.name ?? "the organizer"}
    />
  );
}
