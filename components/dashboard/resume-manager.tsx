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
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
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
      e.target.value = ""; // Reset input so same file can be uploaded again
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

      // Refresh list from server
      await fetchResumesList();

      setSuccessMessage(
        `"${file.name}" uploaded and parsed successfully! Your profile has been automatically updated.`
      );
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMessage(err.message || "An error occurred during resume upload.");
      await fetchResumesList();
    } finally {
      setIsUploading(false);
      setUploadStep("");
    }
  };

  const fetchResumesList = async () => {
    try {
      const res = await fetch("/api/resumes");
      if (res.ok) {
        const data = await res.json();
        setResumes(data.resumes || []);
      }
    } catch (err) {
      console.error("Failed to refresh resumes:", err);
    }
  };

  const handleView = async (resumeId: string) => {
    try {
      const res = await fetch(`/api/resumes/${resumeId}`);
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        alert(data.error || "Failed to generate view link.");
      }
    } catch (err) {
      alert("Failed to open resume document.");
    }
  };

  const handleDownload = async (resumeId: string, fileName: string) => {
    try {
      const res = await fetch(`/api/resumes/${resumeId}`);
      const data = await res.json();
      if (data.url) {
        const a = document.createElement("a");
        a.href = data.url;
        a.download = fileName;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert(data.error || "Failed to download document.");
      }
    } catch (err) {
      alert("Failed to download document.");
    }
  };

  const handleReParse = async (resumeId: string) => {
    try {
      setReparsingId(resumeId);
      setErrorMessage(null);
      setSuccessMessage(null);

      setResumes((prev) =>
        prev.map((r) => (r.id === resumeId ? { ...r, parsing_status: "processing" } : r))
      );

      const res = await fetch(`/api/resumes/${resumeId}`, { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to re-parse resume.");
      }

      await fetchResumesList();
      setSuccessMessage("Resume re-parsed and profile auto-fill updated successfully!");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to re-parse resume.");
      await fetchResumesList();
    } finally {
      setReparsingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/resumes/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete resume.");
      }

      setResumes((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setSuccessMessage(`Resume "${deleteTarget.file_name}" was deleted.`);
      setDeleteTarget(null);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete resume.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "0 KB";
    const k = 1024;
    if (bytes < k) return `${bytes} B`;
    if (bytes < k * k) return `${(bytes / k).toFixed(1)} KB`;
    return `${(bytes / (k * k)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8">
      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 shadow-sm transition-all animate-in fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-medium truncate">{successMessage}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 px-3 py-1.5 rounded-lg transition-colors border border-emerald-500/30"
            >
              Review Profile
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
            </Link>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-emerald-200 text-xs font-medium px-2 py-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 shadow-sm transition-all animate-in fade-in">
          <div className="flex items-center gap-3">
            <HugeiconsIcon icon={AlertCircleIcon} className="size-5 text-rose-400 shrink-0" />
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-200 text-xs font-medium px-2 py-1"
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
        className={`relative overflow-hidden border-2 border-dashed rounded-3xl transition-all duration-300 ${
          isDragging
            ? "border-indigo-500 bg-indigo-500/10 shadow-xl shadow-indigo-500/10 scale-[1.005]"
            : "border-zinc-800 bg-gradient-to-br from-[#18181B] via-[#151518] to-[#121215] hover:border-zinc-700 shadow-md"
        }`}
      >
        <CardContent className="p-8 sm:p-12 flex flex-col items-center text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={handleFileInputChange}
          />

          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all cursor-pointer ${
              isUploading
                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 animate-pulse"
                : "bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 hover:scale-105 hover:bg-indigo-500/25 shadow-lg shadow-indigo-500/10"
            }`}
          >
            {isUploading ? (
              <HugeiconsIcon icon={Loading03Icon} className="size-8 animate-spin" />
            ) : (
              <HugeiconsIcon icon={Upload04Icon} className="size-8" />
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-[#FAFAFA] mb-1.5">
            {isUploading ? "Processing Resume..." : "Upload your Master Resume"}
          </h3>

          <p className="text-sm text-zinc-400 max-w-md mb-5 leading-relaxed">
            {isUploading
              ? uploadStep
              : "Drag and drop your resume file here, or browse from your computer. JobBuddy AI extracts skills, work history, education, and automatically populates your profile."}
          </p>

          {isUploading ? (
            <div className="w-full max-w-xs space-y-2.5">
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                <div className="h-full bg-indigo-500 rounded-full animate-pulse transition-all w-3/4" />
              </div>
              <span className="text-xs text-indigo-400 font-medium">{uploadStep}</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 font-medium gap-2 px-6 h-10 rounded-xl"
              >
                <HugeiconsIcon icon={Upload04Icon} className="size-4" />
                Select File
              </Button>
              <span className="text-xs text-zinc-500">PDF or DOCX, max 10MB</span>
            </div>
          )}

          <div className="flex items-center gap-6 mt-8 pt-6 border-t border-zinc-800/80 text-xs text-zinc-400 flex-wrap justify-center">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              End-to-End Encryption
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              AI Structured Extraction
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              100% User-Editable
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Resumes List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#FAFAFA]">Your Uploaded Resumes</h3>
            <p className="text-xs text-zinc-400">
              Manage your active master resumes, view extracted data, or download copies.
            </p>
          </div>
          <Badge variant="outline" className="text-zinc-300 border-zinc-800 bg-zinc-800/50 font-medium text-xs py-1 px-3">
            {resumes.length} {resumes.length === 1 ? "document" : "documents"}
          </Badge>
        </div>

        {resumes.length === 0 ? (
          <Card className="border-dashed border-zinc-800 bg-[#141417]/80 rounded-2xl">
            <CardContent className="p-10 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400 mb-3">
                <HugeiconsIcon icon={File02Icon} className="size-6" />
              </div>
              <p className="text-sm font-medium text-[#FAFAFA] mb-1">No resumes uploaded yet</p>
              <p className="text-xs text-zinc-400 max-w-sm mb-4">
                Upload your resume above to automatically index your skills, experiences, and project portfolio.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 text-indigo-400 border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20"
              >
                <HugeiconsIcon icon={Upload04Icon} className="size-3.5" />
                Upload First Resume
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {resumes.map((resume) => {
              const isPdf = resume.file_name.toLowerCase().endsWith(".pdf");
              const isReparsing = reparsingId === resume.id || resume.parsing_status === "processing";

              return (
                <Card
                  key={resume.id}
                  className="bg-[#18181B] border border-zinc-800 hover:border-zinc-700 transition-all rounded-2xl shadow-sm"
                >
                  <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* File info */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                          isPdf
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                        }`}
                      >
                        {isPdf ? "PDF" : "DOC"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-semibold text-[#FAFAFA] truncate">
                            {resume.file_name}
                          </h4>
                          {resume.is_primary && (
                            <Badge className="bg-indigo-500/15 text-indigo-300 border-indigo-500/30 text-[10px] font-semibold py-0 px-2">
                              Master Resume
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
                          <span>{formatFileSize(resume.file_size)}</span>
                          <span>•</span>
                          <span>Uploaded {formatDate(resume.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0 flex-wrap">
                      {/* Status Badge */}
                      {resume.parsing_status === "parsed" && (
                        <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 gap-1.5 py-1 px-2.5 font-medium text-xs">
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5 text-emerald-400" />
                          Parsed Successfully
                        </Badge>
                      )}

                      {resume.parsing_status === "processing" && (
                        <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 gap-1.5 py-1 px-2.5 font-medium text-xs animate-pulse">
                          <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin text-purple-400" />
                          AI Parsing...
                        </Badge>
                      )}

                      {resume.parsing_status === "uploading" && (
                        <Badge className="bg-indigo-500/15 text-indigo-300 border-indigo-500/30 gap-1.5 py-1 px-2.5 font-medium text-xs animate-pulse">
                          <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin text-indigo-400" />
                          Uploading...
                        </Badge>
                      )}

                      {resume.parsing_status === "failed" && (
                        <Badge className="bg-rose-500/15 text-rose-300 border-rose-500/30 gap-1.5 py-1 px-2.5 font-medium text-xs">
                          <HugeiconsIcon icon={AlertCircleIcon} className="size-3.5 text-rose-400" />
                          Parsing Failed
                        </Badge>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 border-l border-zinc-800 pl-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(resume.id)}
                          title="View Resume"
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-[#FAFAFA] hover:bg-zinc-800 rounded-lg"
                        >
                          <HugeiconsIcon icon={ViewIcon} className="size-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(resume.id, resume.file_name)}
                          title="Download Document"
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 rounded-lg"
                        >
                          <HugeiconsIcon icon={Download04Icon} className="size-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isReparsing}
                          onClick={() => handleReParse(resume.id)}
                          title="Re-Parse with AI"
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-purple-400 hover:bg-zinc-800 rounded-lg"
                        >
                          <HugeiconsIcon
                            icon={isReparsing ? Loading03Icon : RefreshIcon}
                            className={`size-4 ${isReparsing ? "animate-spin text-purple-400" : ""}`}
                          />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(resume)}
                          title="Delete Resume"
                          className="h-8 w-8 p-0 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
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
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md bg-[#18181B] border border-zinc-800 text-[#FAFAFA]">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-2">
              <HugeiconsIcon icon={Delete02Icon} className="size-5" />
            </div>
            <DialogTitle className="text-[#FAFAFA]">Delete Resume?</DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              Are you sure you want to delete <span className="font-semibold text-zinc-200">"{deleteTarget?.file_name}"</span>?
              This will permanently remove the file from secure cloud storage. Existing profile entries will be kept intact.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-500 text-white gap-2"
            >
              {isDeleting && <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />}
              {isDeleting ? "Deleting..." : "Delete Resume"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
