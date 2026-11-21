// ==============================================================================
// app/api/applications/status/route.ts
// GET endpoint to check the live status of an application
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing application ID" }, { status: 400 });
    }

    const { data: application, error } = await supabase
      .from("job_applications")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json({ application });
  } catch (err: any) {
    console.error("[API/applications/status] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch application status" },
      { status: 500 }
    );
  }
}
