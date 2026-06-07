import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const branchId = request.cookies.get("active_branch_id")?.value ?? null;
    return NextResponse.json({ branch_id: branchId });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
