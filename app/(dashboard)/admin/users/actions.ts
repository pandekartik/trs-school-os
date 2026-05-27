"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase-admin";
import { getRole } from "@/lib/auth";

type CreateUserResult =
  | { success: true }
  | { error: string };

export async function createUserAccount(formData: FormData): Promise<CreateUserResult> {
  const role = await getRole();
  if (role !== "admin" && role !== "super_admin") {
    return { error: "Unauthorized" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  const userRole = String(formData.get("role") ?? "teacher") as "teacher" | "coordinator" | "admin";

  if (!name || !email) {
    return { error: "Name and email are required" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }
  const admin = createAdminClient();

  const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: name,
      role: userRole,
    },
  });

  if (createError || !createdUser.user) {
    return { error: createError?.message ?? "Failed to create auth user" };
  }

  const { error: profileError } = await admin
    .from("teacher")
    .upsert({
      name,
      email,
      role: userRole,
      auth_user_id: createdUser.user.id,
      is_active: true,
    }, { onConflict: "email" });

  if (profileError) {
    await admin.auth.admin.deleteUser(createdUser.user.id);
    return { error: profileError.message };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { success: true };
}

type DeleteUserResult = { success: true } | { error: string };

export async function deleteUserAccount(teacherId: string, authUserId: string): Promise<DeleteUserResult> {
  const role = await getRole();
  if (role !== "admin" && role !== "super_admin") {
    return { error: "Unauthorized" };
  }

  if (!teacherId || !authUserId) {
    return { error: "Invalid user" };
  }

  const admin = createAdminClient();

  const { error: dbError } = await admin
    .from("teacher")
    .delete()
    .eq("id", teacherId);

  if (dbError) {
    return { error: dbError.message };
  }

  const { error: authError } = await admin.auth.admin.deleteUser(authUserId);

  if (authError) {
    return { error: authError.message };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { success: true };
}
