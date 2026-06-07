import { NextRequest, NextResponse } from "next/server";
import { getRole } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const role = await getRole();
    if (role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { branch_id } = body;

    if (!branch_id) {
      return NextResponse.json({ error: "branch_id required" }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("active_branch_id", branch_id, {
      maxAge: 86400, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
