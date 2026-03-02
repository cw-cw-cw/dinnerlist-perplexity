"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ActionResult<T = unknown> = | { success: true; data: T } | { error: string };

export async function updateSeriesAction(
  id: string, data: { name: string; description?: string | null }
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "You must be logged in." };

  if (!data.name || data.name.trim().length === 0) return { error: "Series name is required." };

  const existing = await prisma.eventSeries.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });

  if (!existing) return { error: "Series not found." };

  try {
    const series = await prisma.eventSeries.update({
      where: { id },
      data: { name: data.name.trim(), description: data.description ?? null },
    });
    revalidatePath("/admin/events/series");
    return { success: true, data: { id: series.id } };
  } catch (err) {
    console.error("Error updating series:", err);
    return { error: "Failed to update series." };
  }
}

export async function deleteSeriesAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "You must be logged in." };

  const existing = await prisma.eventSeries.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: { _count: { select: { events: true } } },
  });

  if (!existing) return { error: "Series not found." };
  if (existing._count.events > 0) return { error: "Cannot delete series with events." };

  try {
    await prisma.eventSeries.delete({ where: { id } });
    revalidatePath("/admin/events/series");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("Error deleting series:", err);
    return { error: "Failed to delete series." };
  }
}
