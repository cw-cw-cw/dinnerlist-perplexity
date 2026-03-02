import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { event: { include: { organization: true, series: true } }, invitee: true, rsvp: true },
  });

  if (!invitation) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  return NextResponse.json({ invitation });
}
