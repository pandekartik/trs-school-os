import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const chapterId = formData.get("chapter_id") as string;
    const periodNum = formData.get("period_number") as string;

    if (!file || !chapterId || !periodNum) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    const filename = `${chapterId}/period-${periodNum}-${Date.now()}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const supabase = createAdminClient();

    const { error } = await supabase.storage
      .from("lesson-plans")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const {
      data: { publicUrl },
    } = supabase.storage.from("lesson-plans").getPublicUrl(filename);

    // Save the URL directly into chapter_period table
    const periodNumber = parseInt(periodNum);
    const { data: existingPeriod } = await supabase
      .from("chapter_period")
      .select("id")
      .eq("chapter_id", chapterId)
      .eq("period_number", periodNumber)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();

    if (existingPeriod) {
      const { error: updateError } = await supabase
        .from("chapter_period")
        .update({
          lesson_plan_url: publicUrl,
          lesson_plan_filename: file.name,
          file_type: ext,
          uploaded_at: new Date().toISOString(),
        })
        .eq("id", existingPeriod.id);
      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    } else {
      const { error: insertError } = await supabase
        .from("chapter_period")
        .insert({
          chapter_id: chapterId,
          period_number: periodNumber,
          lesson_plan_url: publicUrl,
          lesson_plan_filename: file.name,
          file_type: ext,
          uploaded_at: new Date().toISOString(),
        });
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    revalidatePath("/content");
    
    return NextResponse.json({
      url: publicUrl,
      filename: file.name,
      file_type: ext,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
