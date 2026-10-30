"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase";
import { mustChangePassword } from "@/lib/admin-roles";
import {
  loginSchema,
  setupPasswordSchema,
  changePasswordSchema,
} from "@/lib/validations/auth";

import type { ActionState } from "./types";

export type AuthFormState = ActionState;

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const validated = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  });

  if (error) {
    return { message: "Invalid email or password" };
  }

  redirect("/admin");
}

export async function setupPasswordAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const validated = setupPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { message: "Your invite link has expired. Please request a new invite." };
  }

  const { error } = await supabase.auth.updateUser({
    password: validated.data.password,
  });

  if (error) {
    return {
      message:
        error.code === "same_password"
          ? "Choose a password different from your temporary one."
          : "Failed to set password. Please try again.",
    };
  }

  // Clear the "temporary password" flag set by an owner (app_metadata is service-role only)
  if (mustChangePassword(user)) {
    const { error: flagError } = await createSupabaseAdminClient().auth.admin.updateUserById(
      user.id,
      { app_metadata: { ...user.app_metadata, must_change_password: false } }
    );
    if (flagError) {
      return { message: "Password saved, but your account could not be unlocked. Please try again." };
    }
  }

  redirect("/admin");
}

export async function changePasswordAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const validated = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { message: "Session expired. Please sign in again." };
  }

  // Verify current password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: validated.data.currentPassword,
  });
  if (signInError) {
    return { errors: { currentPassword: ["Current password is incorrect"] } };
  }

  // Update to new password
  const { error } = await supabase.auth.updateUser({
    password: validated.data.newPassword,
  });
  if (error) {
    return { message: "Failed to update password. Please try again." };
  }

  return { success: true, message: "Password updated successfully" };
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  await supabase.auth.signOut();
  redirect("/admin/login");
}
