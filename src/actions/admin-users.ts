"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  createAdminUserSchema, updateAdminUserSchema, resetPasswordSchema,
  type CreateAdminUserInput, type UpdateAdminUserInput, type ResetPasswordInput,
} from "@/lib/validations/admin-user";

type ActionResult<T = unknown> = | { success: true; data: T } | { error: string };

interface AdminSession {
  user: { id: string; email: string; name: string; role: string; organizationId: string };
}

async function requireAdminAccess(): Promise<string | AdminSession> {
  const session = await auth();
  if (!session?.user?.organizationId) return "You must be logged in.";
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return "You do not have permission to manage admin users.";
  }
  return session as unknown as AdminSession;
}

export async function createAdminUser(input: CreateAdminUserInput): Promise<ActionResult<{ id: string }>> {
  const result = await requireAdminAccess();
  if (typeof result === "string") return { error: result };
  const session = result;

  const parsed = createAdminUserSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const { name, email, password, role } = parsed.data;
  if (session.user.role === "ADMIN" && role === "SUPER_ADMIN") {
    return { error: "Only super admins can create other super admin users." };
  }

  const existing = await prisma.adminUser.findFirst({
    where: { email: email.toLowerCase(), organizationId: session.user.organizationId },
  });
  if (existing) return { error: "A user with this email already exists." };

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.adminUser.create({
      data: { name, email: email.toLowerCase(), hashedPassword,
        role: role as "SUPER_ADMIN" | "ADMIN" | "MANAGER", organizationId: session.user.organizationId },
    });
    revalidatePath("/admin/settings");
    return { success: true, data: { id: user.id } };
  } catch (err) {
    console.error("Error creating admin user:", err);
    return { error: "Failed to create admin user. Please try again." };
  }
}

export async function updateAdminUser(input: UpdateAdminUserInput): Promise<ActionResult<{ id: string }>> {
  const result = await requireAdminAccess();
  if (typeof result === "string") return { error: result };
  const session = result;

  const parsed = updateAdminUserSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const { id, name, email, role } = parsed.data;
  const targetUser = await prisma.adminUser.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!targetUser) return { error: "User not found." };
  if (session.user.role === "ADMIN" && targetUser.role === "SUPER_ADMIN") {
    return { error: "You do not have permission to modify super admin users." };
  }
  if (session.user.role === "ADMIN" && role === "SUPER_ADMIN") {
    return { error: "Only super admins can assign the super admin role." };
  }

  const emailConflict = await prisma.adminUser.findFirst({
    where: { email: email.toLowerCase(), organizationId: session.user.organizationId, id: { not: id } },
  });
  if (emailConflict) return { error: "A user with this email already exists." };

  try {
    const user = await prisma.adminUser.update({
      where: { id },
      data: { name, email: email.toLowerCase(), role: role as "SUPER_ADMIN" | "ADMIN" | "MANAGER" },
    });
    revalidatePath("/admin/settings");
    return { success: true, data: { id: user.id } };
  } catch (err) {
    console.error("Error updating admin user:", err);
    return { error: "Failed to update admin user. Please try again." };
  }
}

export async function deleteAdminUser(userId: string): Promise<ActionResult<{ id: string }>> {
  const result = await requireAdminAccess();
  if (typeof result === "string") return { error: result };
  const session = result;

  if (userId === session.user.id) return { error: "You cannot delete your own account." };

  const targetUser = await prisma.adminUser.findFirst({ where: { id: userId, organizationId: session.user.organizationId } });
  if (!targetUser) return { error: "User not found." };
  if (session.user.role === "ADMIN" && targetUser.role === "SUPER_ADMIN") {
    return { error: "You do not have permission to delete super admin users." };
  }

  if (targetUser.role === "SUPER_ADMIN") {
    const superAdminCount = await prisma.adminUser.count({
      where: { organizationId: session.user.organizationId, role: "SUPER_ADMIN" },
    });
    if (superAdminCount <= 1) return { error: "Cannot delete the last super admin user." };
  }

  try {
    await prisma.adminUser.delete({ where: { id: userId } });
    revalidatePath("/admin/settings");
    return { success: true, data: { id: userId } };
  } catch (err) {
    console.error("Error deleting admin user:", err);
    return { error: "Failed to delete admin user. Please try again." };
  }
}

export async function resetAdminPassword(input: ResetPasswordInput): Promise<ActionResult<{ id: string }>> {
  const result = await requireAdminAccess();
  if (typeof result === "string") return { error: result };
  const session = result;

  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const { id, newPassword } = parsed.data;
  const targetUser = await prisma.adminUser.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!targetUser) return { error: "User not found." };
  if (session.user.role === "ADMIN" && targetUser.role === "SUPER_ADMIN") {
    return { error: "You do not have permission to reset super admin passwords." };
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.adminUser.update({ where: { id }, data: { hashedPassword } });
    revalidatePath("/admin/settings");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("Error resetting password:", err);
    return { error: "Failed to reset password. Please try again." };
  }
}
