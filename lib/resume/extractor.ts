/**
 * Extracts raw text from PDF and DOCX files.
 */

// Polyfill DOMMatrix for Node.js server environments if missing
if (typeof globalThis.DOMMatrix === "undefined") {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    is2D = true;
    isIdentity = true;
    constructor(init?: any) {
      if (typeof init === "string") return;
      if (Array.isArray(init)) {
        this.a = init[0] ?? 1;
        this.b = init[1] ?? 0;
        this.c = init[2] ?? 0;
        this.d = init[3] ?? 1;
        this.e = init[4] ?? 0;
        this.f = init[5] ?? 0;
      }
    }
    multiply() { return this; }
    translate() { return this; }
    scale() { return this; }
    rotate() { return this; }
    transformPoint(p: any) { return p || { x: 0, y: 0, z: 0, w: 1 }; }
    inverse() { return this; }
  };
}

export async function extractTextFromFile(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<string> {
  const lowerName = fileName.toLowerCase();
  const isPdf = lowerName.endsWith(".pdf") || mimeType === "application/pdf";
  const isDocx =
    lowerName.endsWith(".docx") ||
    lowerName.endsWith(".doc") ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword";

  if (isPdf) {
    return extractTextFromPdf(buffer);
  } else if (isDocx) {
    return extractTextFromDocx(buffer);
  } else {
    // Fallback attempt: UTF-8 plain text string
    const asText = buffer.toString("utf-8");
    if (asText && !asText.includes("\x00")) {
      return asText;
    }
    throw new Error(`Unsupported file type for "${fileName}". Please upload a PDF or DOCX file.`);
  }
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const { extractText } = await import("unpdf");
    const result = await extractText(new Uint8Array(buffer), { mergePages: true });
    if (typeof result.text === "string") {
      return result.text;
    } else if (Array.isArray(result.text)) {
      return (result.text as string[]).join("\n");
    }
    return "";
  } catch (err: any) {
    console.error("Error extracting text from PDF with unpdf:", err);
    throw new Error(`Failed to extract text from PDF: ${err.message || "Unknown error"}`);
  }
}

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (err: any) {
    console.error("Error extracting text from DOCX:", err);
    throw new Error(`Failed to extract text from DOCX: ${err.message || "Unknown error"}`);
  }
}
