"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { csvUploadSchema, inviteeUpdateSchema, type InviteeRowInput, type InviteeUpdateInput } from "@/lib/validations/invitee";
import { generateInvitationToken } from "@/lib/utils/tokens";

type ActionResult<T = unknown> = | { success: true; data: T } | { error: string };

interface UploadResult {
  created: number; updated: number; invitationsCreated: number;
  errors: Array<{ row: number; message: string }>;
}

export async function uploadInvitees(
  eventId: string, invitees: InviteeRowInput[]
): Promise<ActionResult<UploadResult>> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "You must be logged in to upload invitees." };
  const orgId = session.user.organizationId;

  const event = await prisma.event.findFirst({ where: { id: eventId, organizationId: orgId } });
  if (!event) return { error: "Event not found." };

  const parsed = csvUploadSchema.safeParse(invitees);
  if (!parsed.success) return { error: "Invalid invitee data. Please check your CSV file." };

  const validRows = parsed.data;
  let created = 0, updated = 0, invitationsCreated = 0;
  const errors: Array<{ row: number; message: string }> = [];

  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i];
    try {
      const invitee = await prisma.invitee.upsert({
        where: { email_organizationId: { email: row.email.toLowerCase(), organizationId: orgId } },
        update: {
          firstName: row.firstName, lastName: row.lastName, phone: row.phone || null,
          title: row.title || null, credentials: row.credentials || null,
          specialty: row.specialty || null, practiceName: row.practiceName || null,
          npiNumber: row.npiNumber || null, inviteeType: row.inviteeType,
          yearStartedPractice: row.yearStartedPractice ?? null, source: "csv_upload",
        },
        create: {
          firstName: row.firstName, lastName: row.lastName, email: row.email.toLowerCase(),
          phone: row.phone || null, title: row.title || null, credentials: row.credentials || null,
          specialty: row.specialty || null, practiceName: row.practiceName || null,
          npiNumber: row.npiNumber || null, inviteeType: row.inviteeType,
          yearStartedPractice: row.yearStartedPractice ?? null, source: "csv_upload", organizationId: orgId,
        },
      });

      const isNew = Math.abs(invitee.createdAt.getTime() - invitee.updatedAt.getTime()) < 1000;
      if (isNew) { created++; } else { updated++; }

      const existingInvitation = await prisma.invitation.findUnique({
        where: { eventId_inviteeId: { eventId, inviteeId: invitee.id } },
      });

      if (!existingInvitation) {
        await prisma.invitation.create({
          data: { token: generateInvitationToken(), eventId, inviteeId: invitee.id },
        });
        invitationsCreated++;
      }
    } catch (err) {
      errors.push({ row: i + 1, message: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}/invitees`);
  revalidatePath("/admin/invitees");
  return { success: true, data: { created, updated, invitationsCreated, errors } };
}

export async function uploadInviteesGlobal(
  invitees: InviteeRowInput[]
): Promise<ActionResult<Omit<UploadResult, "invitationsCreated">>> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "You must be logged in to upload invitees." };
  const orgId = session.user.organizationId;

  const parsed = csvUploadSchema.safeParse(invitees);
  if (!parsed.success) return { error: "Invalid invitee data. Please check your CSV file." };

  const validRows = parsed.data;
  let created = 0, updated = 0;
  const errors: Array<{ row: number; message: string }> = [];

  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i];
    try {
      const invitee = await prisma.invitee.upsert({
        where: { email_organizationId: { email: row.email.toLowerCase(), organizationId: orgId } },
        update: {
          firstName: row.firstName, lastName: row.lastName, phone: row.phone || null,
          title: row.title || null, credentials: row.credentials || null,
          specialty: row.specialty || null, practiceName: row.practiceName || null,
          npiNumber: row.npiNumber || null, inviteeType: row.inviteeType,
          yearStartedPractice: row.yearStartedPractice ?? null, source: "csv_upload",
        },
        create: {
          firstName: row.firstName, lastName: row.lastName, email: row.email.toLowerCase(),
          phone: row.phone || null, title: row.title || null, credentials: row.credentials || null,
          specialty: row.specialty || null, practiceName: row.practiceName || null,
          npiNumber: row.npiNumber || null, inviteeType: row.inviteeType,
          yearStartedPractice: row.yearStartedPractice ?? null, source: "csv_upload", organizationId: orgId,
        },
      });
      const isNew = Math.abs(invitee.createdAt.getTime() - invitee.updatedAt.getTime()) < 1000;
      if (isNew) { created++; } else { updated++; }
    } catch (err) {
      errors.push({ row: i + 1, message: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  revalidatePath("/admin/invitees");
  return { success: true, data: { created, updated, errors } };
}

export async function updateInvitee(input: InviteeUpdateInput): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "You must be logged in to update invitees." };
  const orgId = session.user.organizationId;

  const parsed = inviteeUpdateSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid invitee data." };
  const data = parsed.data;

  const existing = await prisma.invitee.findFirst({ where: { id: data.id, organizationId: orgId } });
  if (!existing) return { error: "Invitee not found." };

  try {
    const updated = await prisma.invitee.update({
      where: { id: data.id },
      data: {
        firstName: data.firstName, lastName: data.lastName, email: data.email.toLowerCase(),
        phone: data.phone || null, title: data.title || null, credentials: data.credentials || null,
        specialty: data.specialty || null, practiceName: data.practiceName || null,
        npiNumber: data.npiNumber || null, inviteeType: data.inviteeType,
        yearStartedPractice: data.yearStartedPractice ?? null,
      },
    });
    revalidatePath("/admin/invitees");
    return { success: true, data: { id: updated.id } };
  } catch (err) {
    console.error("Error updating invitee:", err);
    return { error: "Failed to update invitee." };
  }
}

export async function deleteInvitee(inviteeId: string): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "You must be logged in to delete invitees." };
  const orgId = session.user.organizationId;

  const existing = await prisma.invitee.findFirst({ where: { id: inviteeId, organizationId: orgId } });
  if (!existing) return { error: "Invitee not found." };

  try {
    await prisma.invitee.delete({ where: { id: inviteeId } });
    revalidatePath("/admin/invitees");
    return { success: true, data: { id: inviteeId } };
  } catch (err) {
    console.error("Error deleting invitee:", err);
    return { error: "Failed to delete invitee." };
  }
}

export async function generateInvitations(eventId: string): Promise<ActionResult<{ created: number }>> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "You must be logged in to generate invitations." };
  const orgId = session.user.organizationId;

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: orgId },
    include: { invitations: { select: { inviteeId: true } } },
  });
  if (!event) return { error: "Event not found." };

  const existingInviteeIds = new Set(event.invitations.map((inv: { inviteeId: string }) => inv.inviteeId));
  const allInvitees = await prisma.invitee.findMany({
    where: { organizationId: orgId, unsubscribed: false },
    select: { id: true },
  });

  const inviteesToCreate = allInvitees.filter((inv) => !existingInviteeIds.has(inv.id));
  if (inviteesToCreate.length === 0) return { success: true, data: { created: 0 } };

  const invitationData = inviteesToCreate.map((invitee) => ({
    token: generateInvitationToken(), eventId, inviteeId: invitee.id,
  }));

  const result = await prisma.invitation.createMany({ data: invitationData, skipDuplicates: true });

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}/invitees`);
  return { success: true, data: { created: result.count } };
}

export async function createSeriesAction(data: {
  name: string; description?: string | null; inviteeType?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "You must be logged in." };
  if (!data.name || data.name.trim().length === 0) return { error: "Series name is required." };

  try {
    const series = await prisma.eventSeries.create({
      data: {
        name: data.name.trim(), description: data.description?.trim() || null,
        eventType: (data.inviteeType as "IN_PRACTICE" | "RESIDENT_FELLOW") || "IN_PRACTICE",
        organizationId: session.user.organizationId,
      },
    });
    revalidatePath("/admin/events/series");
    return { success: true, data: { id: series.id } };
  } catch (err) {
    console.error("Error creating series:", err);
    return { error: "Failed to create series." };
  }
}

export async function createTemplateAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "You must be logged in." };
  const name = formData.get("name") as string;
  if (!name || name.trim().length === 0) return { error: "Template name is required." };

  try {
    const template = await prisma.eventTemplate.create({
      data: {
        name: name.trim(),
        eventType: ((formData.get("eventType") as string) || "IN_PRACTICE") as "IN_PRACTICE" | "RESIDENT_FELLOW",
        defaultName: (formData.get("defaultName") as string)?.trim() || null,
        publicCapacity: formData.get("publicCapacity") ? parseInt(formData.get("publicCapacity") as string, 10) : null,
        privateCapacity: formData.get("privateCapacity") ? parseInt(formData.get("privateCapacity") as string, 10) : null,
        hostName: (formData.get("hostName") as string)?.trim() || null,
        hostBio: (formData.get("hostBio") as string)?.trim() || null,
        descriptionTemplate: (formData.get("descriptionTemplate") as string)?.trim() || null,
        invitationHeadline: (formData.get("invitationHeadline") as string)?.trim() || null,
        invitationBody: (formData.get("invitationBody") as string)?.trim() || null,
        organizationId: session.user.organizationId,
      },
    });
    revalidatePath("/admin/events/templates");
    return { success: true, data: { id: template.id } };
  } catch (err) {
    console.error("Error creating template:", err);
    return { error: "Failed to create template." };
  }
}
