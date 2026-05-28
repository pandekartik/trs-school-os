import { writeAuditLog } from "@/lib/audit";
import { getUser, getTeacherProfile } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    const user = await getUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const profile = await getTeacherProfile();
    if (!profile) {
      return Response.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    await writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("[POST /api/audit/auth]", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
