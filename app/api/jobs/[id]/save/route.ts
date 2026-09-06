import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const saved = Boolean(body.saved);

    const { data, error } = await supabase
      .from("jobs")
      .update({ saved_status: saved })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating saved_status:", error);
      return NextResponse.json({ error: "Failed to update saved status." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      saved_status: saved,
      job: data,
    });
  } catch (error: any) {
    console.error("Error in /api/jobs/[id]/save:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request." },
      { status: 500 }
    );
  }
}
