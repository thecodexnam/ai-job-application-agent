import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromFile } from "@/lib/resume/extractor";
import { parseResumeText } from "@/lib/resume/parser";
import { syncParsedResumeToProfile } from "@/lib/resume/sync-profile";

// Allow max duration for parsing
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No resume file provided." }, { status: 400 });
    }

    const fileName = file.name;
    const fileSize = file.size;
    const fileType = file.type || "application/octet-stream";

    // 3. Validate file type and size
    const lowerName = fileName.toLowerCase();
    const isValidFormat =
      lowerName.endsWith(".pdf") ||
      lowerName.endsWith(".docx") ||
      lowerName.endsWith(".doc") ||
      fileType.includes("pdf") ||
      fileType.includes("word");

    if (!isValidFormat) {
      return NextResponse.json(
        { error: "Unsupported file format. Please upload a PDF or DOCX file." },
        { status: 400 }
      );
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (fileSize > MAX_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 10MB limit. Please upload a smaller resume file." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Generate clean storage path
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueFileName = `${Date.now()}_${sanitizedName}`;
    const storagePath = `${user.id}/${uniqueFileName}`;

    // 5. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(storagePath, buffer, {
        contentType: fileType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 6. Insert initial record in resumes table
    const { data: resumeRecord, error: dbInsertError } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        storage_path: storagePath,
        parsing_status: "processing",
      })
      .select()
      .single();

    if (dbInsertError || !resumeRecord) {
      console.error("Database insert error:", dbInsertError);
      return NextResponse.json(
        { error: `Failed to save resume record: ${dbInsertError?.message}` },
        { status: 500 }
      );
    }

    // 7. Parse Resume Content
    try {
      const extractedText = await extractTextFromFile(buffer, fileName, fileType);
      const parsedData = await parseResumeText(extractedText);

      // 8. Update resume record with parsed JSON
      await supabase
        .from("resumes")
        .update({
          parsing_status: "parsed",
          parsed_content: parsedData,
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", resumeRecord.id);

      // 9. Auto-Fill User's Profile
      await syncParsedResumeToProfile(supabase, user.id, parsedData);

      return NextResponse.json({
        success: true,
        resumeId: resumeRecord.id,
        fileName,
        parsingStatus: "parsed",
        parsedData,
      });
    } catch (parseErr: any) {
      console.error("Parsing failure:", parseErr);

      // Mark resume as failed but keep record so user sees error and can re-try
      await supabase
        .from("resumes")
        .update({
          parsing_status: "failed",
          error_message: parseErr.message || "Failed to parse resume text.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", resumeRecord.id);

      return NextResponse.json({
        success: false,
        resumeId: resumeRecord.id,
        fileName,
        parsingStatus: "failed",
        error: parseErr.message || "Failed to extract data from resume.",
      });
    }
  } catch (err: any) {
    console.error("Resume upload route error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error occurred while processing resume." },
      { status: 500 }
    );
  }
}
