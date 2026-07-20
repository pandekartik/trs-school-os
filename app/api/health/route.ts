import { createAdminClient } from "@/lib/supabase-admin";

export async function GET() {
  const timestamp = new Date().toISOString();
  const env = process.env.NODE_ENV;

  try {
    const db = createAdminClient();
    const { error } = await db.from("branch").select("id").limit(1);
    if (error) throw error;
  } catch (err) {
    return Response.json(
      {
        status: "error",
        timestamp,
        env,
        db: "unreachable",
        message:
          err instanceof Error
            ? err.message
            : typeof err === "object" && err !== null && "message" in err
              ? String((err as { message: unknown }).message)
              : "Unknown error",
      },
      { status: 503 }
    );
  }

  return Response.json({ status: "ok", timestamp, env, db: "ok" });
}
