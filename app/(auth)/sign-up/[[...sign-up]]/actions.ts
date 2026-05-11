"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function linkTeacherAccount({
  name,
  email,
  userId,
}: {
  name: string;
  email: string;
  userId: string;
}) {
  try {
    const admin = createAdminClient();

    const { data: existing, error: fetchError } = await admin
      .from("teacher")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (fetchError) {
      return { error: fetchError.message };
    }

    if (existing) {
      const { error } = await admin
        .from("teacher")
        .update({ auth_user_id: userId })
        .eq("id", existing.id);

      if (error) return { error: error.message };
    } else {
      const { error } = await admin.from("teacher").insert({
        name,
        email,
        role: "teacher",
        auth_user_id: userId,
        is_active: true,
      });

      if (error) return { error: error.message };
    }

    revalidatePath("/teacher");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to link account";
    return { error: message };
  }
}
