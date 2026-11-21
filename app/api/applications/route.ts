// ==============================================================================
// app/api/applications/route.ts
// Full CRUD API for tracking job applications in the pipeline
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const APPLICATION_STAGES = new Set([
  "wishlist",
  "applied",
  "interviewing",
  "offer",
  "rejected",
]);

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: applications, error } = await supabase
      .from("job_applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const activeApp = applications?.find((a) =>
      ["PENDING", "IN_PROGRESS", "MISSING_PROFILE_INFO", "NEEDS_USER_ACTION"].includes(
        a.application_status || ""
      )
    );

    return NextResponse.json({
      applications: applications || [],
      activeApplication: activeApp || null,
    });
  } catch (error: unknown) {
    console.error("[API/applications] GET Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body?.job_title || !body?.company_name) {
      return NextResponse.json(
        { error: "Job title and company name are required." },
        { status: 400 }
      );
    }

    const stage = body.status && APPLICATION_STAGES.has(body.status) ? body.status : "wishlist";

    const { data, error } = await supabase
      .from("job_applications")
      .insert({
        user_id: user.id,
        job_title: body.job_title.trim(),
        company_name: body.company_name.trim(),
        job_url: body.job_url?.trim() || null,
        location: body.location?.trim() || null,
        status: stage,
        notes: body.notes?.trim() || null,
        application_mode: "manual",
        application_status: stage === "applied" ? "Submitted" : "Idle",
        applied_at: stage === "applied" ? new Date().toISOString() : null,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ application: data }, { status: 201 });
  } catch (error: unknown) {
    console.error("[API/applications] POST Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create application" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (typeof body?.id !== "string") {
      return NextResponse.json({ error: "A valid application ID is required." }, { status: 400 });
    }

    const updateData: Record<string, any> = {};

    if (body.status !== undefined) {
      if (!APPLICATION_STAGES.has(body.status)) {
        return NextResponse.json({ error: "Invalid status stage." }, { status: 400 });
      }
      updateData.status = body.status;
      if (body.status === "applied") {
        updateData.applied_at = new Date().toISOString();
      }
    }

    if (body.notes !== undefined) {
      updateData.notes = typeof body.notes === "string" ? body.notes.trim() : null;
    }

    if (body.job_title !== undefined) {
      updateData.job_title = body.job_title.trim();
    }

    if (body.company_name !== undefined) {
      updateData.company_name = body.company_name.trim();
    }

    if (body.location !== undefined) {
      updateData.location = body.location?.trim() || null;
    }

    if (body.job_url !== undefined) {
      updateData.job_url = body.job_url?.trim() || null;
    }

    updateData.updated_at = new Date().toISOString();

    const { data: application, error } = await supabase
      .from("job_applications")
      .update(updateData)
      .eq("id", body.id)
      .eq("user_id", user.id)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!application) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    return NextResponse.json({ application });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update application.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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
      return NextResponse.json({ error: "Application ID is required." }, { status: 400 });
    }

    const { error } = await supabase
      .from("job_applications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete application.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
