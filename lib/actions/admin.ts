"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase-server";
import { getTodayIsoDate } from "@/lib/timetable-constants";

async function getDb() {
  return await createServerClient();
}

export async function refreshDashboard(weekStart: string) {
  const db = await getDb();

  const { error: rpcError } = await db.rpc("refresh_coverage_summary", {
    p_week_start: weekStart,
  });

  if (rpcError) {
    return { error: rpcError.message };
  }

  // Flag unlogged periods during refresh
  const today = getTodayIsoDate();
  const { data: pastScheduledPeriods, error: selectError } = await db
    .from("period_instance")
    .select("id")
    .eq("status", "scheduled")
    .lt("date", today);

  if (!selectError && pastScheduledPeriods && pastScheduledPeriods.length > 0) {
    const ids = pastScheduledPeriods.map((p) => p.id);
    await db
      .from("period_instance")
      .update({ status: "unlogged" })
      .in("id", ids);
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function flagUnloggedPeriods() {
  const db = await getDb();
  const today = getTodayIsoDate();

  const { data: pastScheduledPeriods, error: selectError } = await db
    .from("period_instance")
    .select("id")
    .eq("status", "scheduled")
    .lt("date", today);

  if (selectError) {
    return { error: selectError.message };
  }

  if (pastScheduledPeriods && pastScheduledPeriods.length > 0) {
    const ids = pastScheduledPeriods.map((p) => p.id);
    const { error: updateError } = await db
      .from("period_instance")
      .update({ status: "unlogged" })
      .in("id", ids);

    if (updateError) {
      return { error: updateError.message };
    }

    return { success: true, updated: ids.length };
  }

  return { success: true, updated: 0 };
}
