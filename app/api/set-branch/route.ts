import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase-admin";
import { getRole, ACTIVE_BRANCH_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { branch_id } = await request.json();
  if (!branch_id) {
    return Response.json({ error: "branch_id is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: branch, error } = await admin
    .from("branch")
    .select("id")
    .eq("id", branch_id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !branch) {
    return Response.json({ error: "Branch not found or inactive" }, { status: 404 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BRANCH_COOKIE, branch_id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return Response.json({ success: true });
}
