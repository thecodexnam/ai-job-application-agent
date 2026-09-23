// ==============================================================================
// app/api/applications/resume/route.ts
// POST endpoint to resume application with missing candidate profile fields
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
    const { applicationId, updatedFields } = body;

    if (!applicationId || !updatedFields) {
      return NextResponse.json(
        { error: "Missing required parameters: applicationId, updatedFields." },
        { status: 400 }
      );
    }

    const result = await ApplicationAgent.resumeApplication(
      user.id,
      applicationId,
      updatedFields
    );

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[API/applications/resume] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to resume application" },
      { status: 500 }
    );
  }
}
