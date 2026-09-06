import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromFile } from "@/lib/resume/extractor";
import { parseResumeText } from "@/lib/resume/parser";
import { syncParsedResumeToProfile } from "@/lib/resume/sync-profile";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch resume record
    const { data: resume, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    if (!resume.storage_path) {
      return NextResponse.json({ error: "No storage path for resume" }, { status: 400 });
    }

    // Create signed URL for 1 hour
    const { data: signedData, error: signedError } = await supabase.storage
      .from("resumes")
      .createSignedUrl(resume.storage_path, 3600);

    if (signedError || !signedData) {
      return NextResponse.json(
        { error: `Failed to create signed URL: ${signedError?.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: signedData.signedUrl,
      fileName: resume.file_name,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get resume record first to find storage path
    const { data: resume } = await supabase
      .from("resumes")
      .select("storage_path")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (resume?.storage_path) {
      // Remove from storage bucket
      await supabase.storage.from("resumes").remove([resume.storage_path]);
    }

    // Delete database record
    const { error: deleteError } = await supabase
      .from("resumes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Re-parse resume
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: resume, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !resume || !resume.storage_path) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    // Download from storage
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("resumes")
      .download(resume.storage_path);

    if (downloadError || !fileBlob) {
      return NextResponse.json({ error: "Failed to download resume file from storage" }, { status: 500 });
    }

    // Mark as processing
    await supabase
      .from("resumes")
      .update({ parsing_status: "processing", error_message: null })
      .eq("id", id);

    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extractedText = await extractTextFromFile(buffer, resume.file_name, resume.file_type || undefined);
    const parsedData = await parseResumeText(extractedText);

    await supabase
      .from("resumes")
      .update({
        parsing_status: "parsed",
        parsed_content: parsedData,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    await syncParsedResumeToProfile(supabase, user.id, parsedData);

    return NextResponse.json({ success: true, parsedData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
