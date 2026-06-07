import { createAdminClient } from "@/lib/supabase-admin";
import { getRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const role = await getRole();
  if (role !== "admin" && role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const admin = createAdminClient();

  try {
    const { data, error } = await admin
      .from("period_override")
      .insert([
        {
          timetable_slot_id: body.timetable_slot_id,
          date: body.date,
          override_type: body.override_type,
          substitute_teacher_id: body.substitute_teacher_id || null,
          custom_topic: body.custom_topic || null,
          chapter_id: body.chapter_id || null,
          chapter_period_number: body.chapter_period_number || null,
          reason: body.reason,
          created_by: (await import("@/lib/auth")).getTeacherProfile().then((p: any) => p.id),
        },
      ])
      .select();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating period override:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const role = await getRole();
  if (role !== "admin" && role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const admin = createAdminClient();

  try {
    const { data, error } = await admin
      .from("period_override")
      .update({
        override_type: body.override_type,
        substitute_teacher_id: body.substitute_teacher_id || null,
        custom_topic: body.custom_topic || null,
        chapter_id: body.chapter_id || null,
        chapter_period_number: body.chapter_period_number || null,
        reason: body.reason,
      })
      .eq("id", body.id)
      .select();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating period override:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
