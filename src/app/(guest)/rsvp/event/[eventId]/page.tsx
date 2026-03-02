import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { GenericRsvpClient } from "./generic-rsvp-client";

export async function generateMetadata({ params }: { params: Promise<{ eventId: string }> }): Promise<Metadata> {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { name: true } });
  return { title: event?.name ? `RSVP - ${event.name}` : "RSVP" };
}

export default async function GenericRSVPPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  const event = await prisma.event.findFirst({
    where: { id: eventId, status: "OPEN" },
    include: { organization: true },
  });

  if (!event) notFound();

  const confirmedCount = await prisma.rSVP.count({
    where: { eventId: event.id, status: "CONFIRMED" },
  });

  const isFull = event.privateCapacity ? confirmedCount >= event.privateCapacity : false;

  const serializedData = {
    event: {
      id: event.id, name: event.name, date: event.date.toISOString(),
      startTime: event.startTime, endTime: event.endTime,
      venueName: event.venueName, venueAddress: event.venueAddress,
      venueCity: event.venueCity, venueState: event.venueState,
      venueImageUrl: event.venueImageUrl, description: event.description,
    },
    organization: {
      name: event.organization.name, logoUrl: event.organization.logoUrl,
      logoIconUrl: event.organization.logoIconUrl, website: event.organization.website,
      contactEmail: event.organization.contactEmail,
    },
    isFull, confirmedCount, publicCapacity: event.publicCapacity,
  };

  return <GenericRsvpClient {...serializedData} />;
}
