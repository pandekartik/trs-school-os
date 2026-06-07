import { createAdminClient } from "@/lib/supabase-admin";
import { getRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = await getRole();
  if (role !== "admin" && role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  try {
    const { error } = await admin
      .from("period_override")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting period override:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
