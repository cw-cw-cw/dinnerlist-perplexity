import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateICS } from "@/lib/utils/ics";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const rsvp = await prisma.rSVP.findUnique({
    where: { manageToken: token },
    include: { event: { include: { organization: true } } },
  });

  if (!rsvp || !rsvp.event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const event = rsvp.event;
  const icsContent = generateICS(event);

  return new NextResponse(icsContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.name.replace(/[^a-zA-Z0-9]/g, "_")}.ics"`,
    },
  });
}
