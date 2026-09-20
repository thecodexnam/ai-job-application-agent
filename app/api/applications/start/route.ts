// ==============================================================================
// app/api/applications/start/route.ts
// POST endpoint to initiate a Manual or Automated JobBuddy AI Application
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
    const { jobId, jobTitle, company, jobUrl, applicationMode } = body;

    if (!jobTitle || !company || !jobUrl || !applicationMode) {
      return NextResponse.json(
        { error: "Missing required fields: jobTitle, company, jobUrl, applicationMode." },
        { status: 400 }
      );
    }

    const result = await ApplicationAgent.startApplication(user.id, {
      jobId,
      jobTitle,
      company,
      jobUrl,
      applicationMode,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[API/applications/start] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to start application" },
      { status: 500 }
    );
  }
}
