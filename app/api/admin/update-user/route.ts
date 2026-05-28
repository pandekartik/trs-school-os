import { createAdminClient } from "@/lib/supabase-admin";
import { getRole, getTeacherProfile } from "@/lib/auth";
import { writeAuditLog, auditActions } from "@/lib/audit";

export async function POST(request: Request) {
  const role = await getRole();
  if (role !== "super_admin") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id, name, phone, role: userRole, is_active } = await request.json();

  try {
    const adminDb = createAdminClient();

    const { data: oldData } = await adminDb
      .from("teacher")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await adminDb
      .from("teacher")
      .update({
        name,
        phone,
        role: userRole,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    const profile = await getTeacherProfile();
    if (profile) {
      writeAuditLog({
        userId: profile.id,
        userName: profile.name,
        userRole: profile.role,
        action: auditActions.setup.teacherUpdated,
        entityType: "teacher",
        entityId: id,
        entityLabel: name,
        oldData,
        newData: { name, phone, role: userRole, is_active },
      });
    }

    return Response.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
