import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, invitationToken, action, duration } = body;
    const t = token || invitationToken;

    if (!t) return NextResponse.json({ error: "Token required" }, { status: 400 });

    if (action === "click") {
      await prisma.invitation.updateMany({
        where: { token: t, clickedAt: null },
        data: { clickedAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "heartbeat") {
      if (typeof duration !== "number" || duration <= 0) {
        return NextResponse.json({ error: "Valid duration required" }, { status: 400 });
      }
      const roundedDuration = Math.round(duration);
      const invitation = await prisma.invitation.findUnique({
        where: { token: t },
        select: { id: true, timeOnPage: true },
      });
      if (invitation && (invitation.timeOnPage === null || roundedDuration > invitation.timeOnPage)) {
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { timeOnPage: roundedDuration },
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
