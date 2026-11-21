"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Upload04Icon,
  File02Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  Loading03Icon,
  Delete02Icon,
  ViewIcon,
  Download04Icon,
  RefreshIcon,
  SparklesIcon,
  ArrowRight01Icon,
  Folder01Icon,
  Calendar03Icon,
  TickDouble01Icon,
  CloudUploadIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ResumeRecord } from "@/types/resume";

interface ResumeManagerProps {
  initialResumes: ResumeRecord[];
}

export function ResumeManager({ initialResumes }: ResumeManagerProps) {
  const [resumes, setResumes] = useState<ResumeRecord[]>(initialResumes);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ResumeRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reparsingId, setReparsingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
      e.target.value = "";
    }
  };

  const handleFileSelected = async (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    const name = file.name.toLowerCase();
    const isAllowed = name.endsWith(".pdf") || name.endsWith(".docx") || name.endsWith(".doc");

    if (!isAllowed) {
      setErrorMessage("Only PDF and DOCX files are supported. Please select a valid resume document.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File exceeds 10MB limit. Please upload a smaller document.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadStep("Uploading file to secure cloud storage...");

      const formData = new FormData();
      formData.append("file", file);

      // Add temporary placeholder in list
      const tempId = `temp-${Date.now()}`;
      const tempRecord: ResumeRecord = {
        id: tempId,
        user_id: "",
        file_name: file.name,
        file_size: file.size,
        file_type: file.type || "application/pdf",
        storage_path: null,
        parsing_status: "uploading",
        is_primary: resumes.length === 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setResumes((prev) => [tempRecord, ...prev]);

      // Progress animation update
      setTimeout(() => {
        setUploadStep("AI parsing resume content & skills...");
        setResumes((prev) =>
          prev.map((r) => (r.id === tempId ? { ...r, parsing_status: "processing" } : r))
        );
      }, 1000);

      const res = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload and parse resume.");
      }

      setUploadStep("Auto-filling candidate profile...");

      // Update the record with server response
      if (data.resume) {
        setResumes((prev) =>
          prev.map((r) => (r.id === tempId ? (data.resume as ResumeRecord) : r))
        );
      }

      setSuccessMessage(
        `Resume "${file.name}" uploaded successfully! Skills and profile data have been extracted.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload resume";
      setErrorMessage(msg);
      // Remove temp placeholder on failure
      setResumes((prev) => prev.filter((r) => !r.id.startsWith("temp-")));
    } finally {
      setIsUploading(false);
      setUploadStep("");
    }
  };

  // Re-parse resume
  const handleReParse = async (resumeId: string) => {
    try {
      setReparsingId(resumeId);
      setErrorMessage(null);

      const res = await fetch("/api/resumes/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to re-parse resume.");
      }

      setResumes((prev) =>
        prev.map((r) => (r.id === resumeId ? { ...r, parsing_status: "parsed" } : r))
      );
      setSuccessMessage("Resume re-parsed successfully! Candidate Profile updated.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to re-parse";
      setErrorMessage(msg);
    } finally {
      setReparsingId(null);
    }
  };

  // View resume URL in new tab
  const handleView = async (resumeId: string) => {
    try {
      const res = await fetch(`/api/resumes/url?id=${resumeId}`);
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Cannot view resume");
      window.open(data.url, "_blank");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to open resume";
      setErrorMessage(msg);
    }
  };

  // Download resume file
  const handleDownload = async (resumeId: string, fileName: string) => {
    try {
      const res = await fetch(`/api/resumes/url?id=${resumeId}`);
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Cannot download resume");

      const link = document.createElement("a");
      link.href = data.url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to download";
      setErrorMessage(msg);
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/resumes/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete resume");
      }

      setResumes((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      setSuccessMessage(`Resume "${deleteTarget.file_name}" deleted.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete resume";
      setErrorMessage(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recent";
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {successMessage && (
        <div className="flex items-center justify-between p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 transition-all animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 text-emerald-700 shrink-0" />
            <span className="text-xs font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-semibold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center justify-between p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-900 transition-all animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <HugeiconsIcon icon={AlertCircleIcon} className="size-4 text-rose-600 shrink-0" />
            <span className="text-xs font-semibold">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-950 text-xs font-semibold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload Dropzone */}
      <Card
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative overflow-hidden border border-dashed rounded-lg transition-colors duration-200 ${
          isDragging
            ? "border-[#7B9E32] bg-[#F3F8E2]"
            : "border-[#1A1A1A]/20 bg-white hover:bg-[#F7F6F0]"
        }`}
      >
        <CardContent className="p-8 sm:p-10 flex flex-col items-center text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={handleFileInputChange}
          />

          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className="flex size-12 items-center justify-center rounded-lg bg-[#E9F2D1] text-[#304019] border border-[#1A1A1A]/10 mb-4 cursor-pointer hover:bg-[#DDF19B] transition-colors"
          >
            <HugeiconsIcon icon={CloudUploadIcon} className="size-6" />
          </div>

          <h3 className="text-base sm:text-lg font-bold text-[#171914] mb-1">
            {isDragging ? "Drop to upload" : "Upload master resume"}
          </h3>

          <p className="text-xs sm:text-sm text-[#5A5D55] max-w-md mb-5 leading-relaxed">
            {isUploading
              ? uploadStep
              : "Drag and drop your resume file here, or browse from your computer. JobBuddy AI extracts skills, work history, and education automatically."}
          </p>

          {isUploading ? (
            <div className="w-full max-w-xs space-y-2">
              <div className="h-2 w-full bg-[#E7E5DC] rounded-full overflow-hidden">
                <div className="h-full bg-[#7B9E32] transition-all duration-300 w-3/4 rounded-full" />
              </div>
              <span className="text-xs text-[#171914] font-medium">{uploadStep}</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#172013] hover:bg-[#26321E] text-white font-semibold gap-2 px-5 h-9 rounded-md text-xs cursor-pointer"
              >
                <HugeiconsIcon icon={Upload04Icon} className="size-3.5" />
                Select File
              </Button>
              <span className="text-xs text-[#687064]">PDF or DOCX, max 10MB</span>
            </div>
          )}

          <div className="flex items-center gap-6 mt-6 pt-5 border-t border-[#1A1A1A]/10 text-xs font-medium text-[#5A5D55] flex-wrap justify-center">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7B9E32]" />
              Secure Storage
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7B9E32]" />
              AI Structured Extraction
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7B9E32]" />
              100% User-Editable
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Resumes List */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h3 className="text-base font-bold text-[#171914] flex items-center gap-2">
              <HugeiconsIcon icon={Folder01Icon} className="size-4 text-[#687064]" />
              Your Resumes
            </h3>
            <p className="text-xs text-[#5A5D55] mt-0.5">
              Manage your uploaded master documents
            </p>
          </div>
          <Badge variant="outline" className="text-[#171914] border border-[#1A1A1A]/15 bg-white font-semibold text-xs py-0.5 px-2.5 rounded-md">
            {resumes.length} {resumes.length === 1 ? 'file' : 'files'}
          </Badge>
        </div>

        {resumes.length === 0 ? (
          <Card className="border border-dashed border-[#1A1A1A]/20 bg-[#F7F6F0] rounded-lg">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-10 h-10 rounded-lg bg-[#E9F2D1] text-[#304019] flex items-center justify-center mb-3">
                <HugeiconsIcon icon={File02Icon} className="size-5" />
              </div>
              <h4 className="text-sm font-bold text-[#171914] mb-1">No resumes yet</h4>
              <p className="text-xs text-[#5A5D55] max-w-sm mb-4">
                Upload your first master resume to start building your AI-powered career profile.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 border border-[#1A1A1A]/20 bg-white hover:bg-[#F2F0E8] font-semibold text-xs rounded-md"
              >
                <HugeiconsIcon icon={Upload04Icon} className="size-3.5" />
                Upload First Resume
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {resumes.map((resume) => {
              const isPdf = resume.file_name.toLowerCase().endsWith(".pdf");
              const isReparsing = reparsingId === resume.id || resume.parsing_status === "processing";

              return (
                <Card
                  key={resume.id}
                  className="bg-white border border-[#1A1A1A]/15 hover:border-[#1A1A1A]/35 transition-colors rounded-lg"
                >
                  <CardContent className="p-4 sm:p-4.5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                    {/* File info */}
                    <div className="flex items-start gap-3.5">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#F2F0E8] border border-[#1A1A1A]/10 text-[#171914]">
                        <HugeiconsIcon icon={File02Icon} className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-[#171914] tracking-tight">
                            {resume.file_name}
                          </h4>
                          {resume.is_primary && (
                            <Badge className="bg-[#DDF19B] text-[#1B2710] border border-[#9FB944] text-[10px] font-semibold py-0 px-2 rounded-sm">
                              Master
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5 text-[11px] font-medium text-[#687064] mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1">
                            <HugeiconsIcon icon={Calendar03Icon} className="size-3" />
                            {formatDate(resume.created_at)}
                          </span>
                          <span>•</span>
                          <span>{formatFileSize(resume.file_size)}</span>
                          <span>•</span>
                          <span className="uppercase text-[9px] bg-[#F7F6F0] px-1.5 py-0.2 rounded border border-[#1A1A1A]/10 font-semibold text-[#171914]">
                            {isPdf ? "PDF" : "DOCX"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0 flex-wrap">
                      {/* Status Badge */}
                      {resume.parsing_status === "parsed" && (
                        <Badge variant="outline" className="gap-1 bg-emerald-50 border border-emerald-300 text-emerald-800 font-semibold text-[10px] py-0.5 rounded-md">
                          <HugeiconsIcon icon={TickDouble01Icon} className="size-3 text-emerald-700" />
                          Parsed
                        </Badge>
                      )}

                      {resume.parsing_status === "processing" && (
                        <Badge className="bg-[#DDF19B] text-[#1B2710] border border-[#9FB944] gap-1.5 py-0.5 px-2.5 font-semibold text-[10px] rounded-md animate-pulse">
                          <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin text-[#1B2710]" />
                          Processing...
                        </Badge>
                      )}

                      {resume.parsing_status === "failed" && (
                        <Badge variant="destructive" className="gap-1 border border-rose-300 bg-rose-50 text-rose-800 font-semibold text-[10px] py-0.5 rounded-md">
                          <HugeiconsIcon icon={AlertCircleIcon} className="size-3.5 text-rose-700" />
                          Parsing Failed
                        </Badge>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 border-l border-[#1A1A1A]/10 pl-2.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(resume.id)}
                          title="View Resume"
                          className="h-8 w-8 p-0 text-[#687064] hover:text-[#171914] hover:bg-[#F2F0E8] rounded-md"
                        >
                          <HugeiconsIcon icon={ViewIcon} className="size-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(resume.id, resume.file_name)}
                          title="Download Document"
                          className="h-8 w-8 p-0 text-[#687064] hover:text-[#171914] hover:bg-[#F2F0E8] rounded-md"
                        >
                          <HugeiconsIcon icon={Download04Icon} className="size-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isReparsing}
                          onClick={() => handleReParse(resume.id)}
                          title="Re-Parse with AI"
                          className="h-8 w-8 p-0 text-[#687064] hover:text-[#171914] hover:bg-[#F2F0E8] rounded-md"
                        >
                          <HugeiconsIcon
                            icon={isReparsing ? Loading03Icon : RefreshIcon}
                            className={`size-4 ${isReparsing ? "animate-spin text-[#171914]" : ""}`}
                          />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(resume)}
                          title="Delete Resume"
                          className="h-8 w-8 p-0 text-[#687064] hover:text-rose-700 hover:bg-rose-50 rounded-md"
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ATS Pro Tip Banner */}
        <div className="rounded-lg border border-[#9FB944]/40 bg-[#F3F8E2] p-4 text-[#26320E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-[#1B2710] flex items-center gap-1.5">
              <HugeiconsIcon icon={SparklesIcon} className="size-3.5 text-[#7B9E32]" />
              AI Extraction & Profile Sync
            </h4>
            <p className="text-[11px] text-[#304019] max-w-xl leading-relaxed">
              When you upload a master resume, JobBuddy extracts your work history, skills, and contact details into your Candidate Profile. You can customize, reorder, or add more details anytime.
            </p>
          </div>
          <Link
            href="/dashboard/profile"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-[#F2F0E8] border border-[#1A1A1A]/15 text-xs font-semibold text-[#171914] transition-colors"
          >
            <span>Candidate Profile</span>
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md bg-white border border-[#1A1A1A]/20 text-[#171914] rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold tracking-tight">
              Delete Resume
            </DialogTitle>
            <DialogDescription className="text-[#5A5D55] text-xs leading-relaxed mt-1">
              Are you sure you want to delete <span className="font-semibold text-[#171914]">"{deleteTarget?.file_name}"</span>?
              This will remove the file from storage and delete the database record. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="border border-[#1A1A1A]/20 bg-white text-[#171914] hover:bg-[#F2F0E8] text-xs font-semibold rounded-md"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-md"
            >
              {isDeleting && <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin" />}
              {isDeleting ? "Deleting..." : "Delete Resume"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
