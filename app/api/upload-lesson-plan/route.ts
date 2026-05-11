import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData  = await request.formData();
  const file      = formData.get("file") as File;
  const chapterId = formData.get("chapter_id") as string;
  const periodNum = formData.get("period_number") as string;

  if (!file || !chapterId || !periodNum) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const ext      = file.name.split(".").pop()?.toLowerCase();
  const filename = `${chapterId}/period-${periodNum}-${Date.now()}.${ext}`;
  const bytes    = await file.arrayBuffer();
  const buffer   = Buffer.from(bytes);

  const supabase = createAdminClient();

  const { error } = await supabase.storage
    .from("lesson-plans")
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage
    .from("lesson-plans")
    .getPublicUrl(filename);

  return NextResponse.json({
    url: publicUrl,
    filename: file.name,
    file_type: ext,
  });
}