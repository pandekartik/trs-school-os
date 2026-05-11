"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase-admin";
import { getRole } from "@/lib/auth";

type CreateUserResult =
  | { success: true; password: string }
  | { error: string };

function generatePassword() {
  return `TRS-${randomBytes(10).toString("base64url")}`;
}

export async function createUserAccount(formData: FormData): Promise<CreateUserResult> {
  const role = await getRole();
  if (role !== "admin") {
    return { error: "Unauthorized" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const userRole = String(formData.get("role") ?? "teacher") as "teacher" | "coordinator" | "admin";

  if (!name || !email) {
    return { error: "Name and email are required" };
  }

  const password = generatePassword();
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
  return { success: true, password };
}
