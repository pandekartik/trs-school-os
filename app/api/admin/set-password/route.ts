import { createAdminClient } from "@/lib/supabase-admin";
import { getRole, getTeacherProfile } from "@/lib/auth";
import { writeAuditLog, auditActions } from "@/lib/audit";

export async function POST(request: Request) {
  const role = await getRole();
  if (role !== "super_admin") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { auth_user_id, new_password } = await request.json();

  try {
    const adminDb = createAdminClient();

    const { data: authUser } = await adminDb.auth.admin.getUserById(auth_user_id);

    const { error } = await adminDb.auth.admin.updateUserById(auth_user_id, {
      password: new_password,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    const profile = await getTeacherProfile();
    if (profile && authUser) {
      writeAuditLog({
        userId: profile.id,
        userName: profile.name,
        userRole: profile.role,
        action: auditActions.auth.passwordChanged,
        entityType: "user",
        entityId: auth_user_id,
        entityLabel: authUser.user?.email || "unknown",
        newData: { password_updated: true },
      });
    }

    return Response.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
