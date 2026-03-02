"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ActionResult<T = unknown> = | { success: true; data: T } | { error: string };

export async function updateTemplateAction(
  id: string, data: { name: string }
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "You must be logged in." };

  if (!data.name || data.name.trim().length === 0) return { error: "Template name is required." };

  const existing = await prisma.eventTemplate.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });

  if (!existing) return { error: "Template not found." };

  try {
    const template = await prisma.eventTemplate.update({
      where: { id },
      data: { name: data.name.trim() },
    });
    revalidatePath("/admin/events/templates");
    return { success: true, data: { id: template.id } };
  } catch (err) {
    console.error("Error updating template:", err);
    return { error: "Failed to update template." };
  }
}

export async function deleteTemplateAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "You must be logged in." };

  const existing = await prisma.eventTemplate.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: { _count: { select: { events: true } } },
  });

  if (!existing) return { error: "Template not found." };
  if (existing._count.events > 0) return { error: "Cannot delete template that is in use." };

  try {
    await prisma.eventTemplate.delete({ where: { id } });
    revalidatePath("/admin/events/templates");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("Error deleting template:", err);
    return { error: "Failed to delete template." };
  }
}
