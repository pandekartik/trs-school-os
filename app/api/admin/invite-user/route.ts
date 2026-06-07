import { createAdminClient } from "@/lib/supabase-admin";
import { getRole, getTeacherProfile } from "@/lib/auth";
import { writeAuditLog, auditActions } from "@/lib/audit";

export async function POST(request: Request) {
  const role = await getRole();
  if (role !== "super_admin") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { name, email, phone, role: userRole, password } = await request.json();

  try {
    const adminDb = createAdminClient();

    const { data, error: authError } = await adminDb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return Response.json({ error: authError.message }, { status: 400 });
    }

    // Link the auth account to the existing teacher record
    const { error: updateError } = await adminDb.from("teacher").update({
      auth_user_id: data.user.id,
    }).eq("email", email);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 400 });
    }

    const profile = await getTeacherProfile();
    if (profile) {
      writeAuditLog({
        userId: profile.id,
        userName: profile.name,
        userRole: profile.role,
        action: auditActions.auth.invited,
        entityType: "user",
        entityId: data.user.id,
        entityLabel: name,
        newData: { name, email, phone, role: userRole },
      });
    }

    return Response.json({ success: true, user_id: data.user.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
