"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { adminListUsers } from "@/lib/db/admin";
import { generateTempPassword } from "@/lib/temp-password";
import { adminRoleSchema, createUserSchema, userIdSchema } from "@/lib/validations/user";
import type { AdminRole } from "@/lib/admin-roles";

export type UserActionResult = {
  success?: boolean;
  message?: string;
  /** Shown to the owner once; never stored or logged. */
  tempPassword?: string;
};

async function countOwners(): Promise<number> {
  const users = await adminListUsers();
  return users.filter((u) => u.role === "owner").length;
}

export async function createUserAction(
  email: string,
  role: AdminRole
): Promise<UserActionResult> {
  const me = await requireOwner();

  const parsed = createUserSchema.safeParse({ email, role });
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const tempPassword = generateTempPassword();
  const { error } = await createSupabaseAdminClient().auth.admin.createUser({
    email: parsed.data.email,
    password: tempPassword,
    email_confirm: true,
    app_metadata: { role: parsed.data.role, must_change_password: true },
  });

  if (error) {
    if (error.code === "email_exists") {
      return { message: "A user with this email already exists." };
    }
    return { message: "Failed to create user. Please try again." };
  }

  revalidatePath("/admin/users");
  await logActivity(me, {
    action: "create",
    entity: "user",
    entityId: parsed.data.email,
    summary: `Added ${parsed.data.email} as ${parsed.data.role}`,
  });
  return { success: true, tempPassword };
}

export async function resetUserPasswordAction(userId: string): Promise<UserActionResult> {
  const me = await requireOwner();
  if (!userIdSchema.safeParse(userId).success) return { message: "Invalid user." };

  const supabase = createSupabaseAdminClient();
  const { data, error: getError } = await supabase.auth.admin.getUserById(userId);
  if (getError || !data.user) return { message: "User not found." };

  const tempPassword = generateTempPassword();
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: tempPassword,
    app_metadata: { ...data.user.app_metadata, must_change_password: true },
  });
  if (error) return { message: "Failed to reset password. Please try again." };

  revalidatePath("/admin/users");
  await logActivity(me, {
    action: "reset_password",
    entity: "user",
    entityId: data.user.email,
    summary: `Reset password for ${data.user.email}`,
  });
  return { success: true, tempPassword };
}

export async function setUserRoleAction(
  userId: string,
  role: AdminRole
): Promise<UserActionResult> {
  const me = await requireOwner();
  if (!userIdSchema.safeParse(userId).success || !adminRoleSchema.safeParse(role).success) {
    return { message: "Invalid input." };
  }
  if (userId === me.id && role !== "owner") {
    return { message: "You can't remove your own owner role." };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error: getError } = await supabase.auth.admin.getUserById(userId);
  if (getError || !data.user) return { message: "User not found." };

  if (data.user.app_metadata?.role === "owner" && role !== "owner" && (await countOwners()) <= 1) {
    return { message: "There must be at least one owner." };
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { ...data.user.app_metadata, role },
  });
  if (error) return { message: "Failed to change role. Please try again." };

  revalidatePath("/admin/users");
  await logActivity(me, {
    action: "change_role",
    entity: "user",
    entityId: data.user.email,
    summary: `Changed ${data.user.email} to ${role}`,
  });
  return { success: true };
}

export async function deleteUserAction(userId: string): Promise<UserActionResult> {
  const me = await requireOwner();
  if (!userIdSchema.safeParse(userId).success) return { message: "Invalid user." };
  if (userId === me.id) return { message: "You can't delete your own account." };

  const supabase = createSupabaseAdminClient();
  const { data, error: getError } = await supabase.auth.admin.getUserById(userId);
  if (getError || !data.user) return { message: "User not found." };

  if (data.user.app_metadata?.role === "owner" && (await countOwners()) <= 1) {
    return { message: "There must be at least one owner." };
  }

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return { message: "Failed to delete user. Please try again." };

  revalidatePath("/admin/users");
  await logActivity(me, {
    action: "delete",
    entity: "user",
    entityId: data.user.email,
    summary: `Deleted ${data.user.email}`,
  });
  return { success: true };
}
