// ==============================================================================
// app/api/applications/cancel/route.ts
// POST endpoint to cancel an application and terminate browser session
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ApplicationAgent } from "@/lib/application/application-agent";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { applicationId } = body;

    if (!applicationId) {
      return NextResponse.json({ error: "Missing applicationId" }, { status: 400 });
    }

    await ApplicationAgent.cancelApplication(user.id, applicationId);

    return NextResponse.json({ success: true, message: "Application cancelled." });
  } catch (err: any) {
    console.error("[API/applications/cancel] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to cancel application" },
      { status: 500 }
    );
  }
}
