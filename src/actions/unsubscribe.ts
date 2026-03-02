"use server";

import { prisma } from "@/lib/prisma";

export async function unsubscribeAction(
  token: string
): Promise<{ success: boolean; error?: string }> {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    select: { id: true, inviteeId: true },
  });

  if (!invitation) {
    return { success: false, error: "Invalid unsubscribe link." };
  }

  await prisma.invitee.update({
    where: { id: invitation.inviteeId },
    data: { unsubscribed: true },
  });

  return { success: true };
}
