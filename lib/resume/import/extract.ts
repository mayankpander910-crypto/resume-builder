"use client";

/**
 * Client-side document text extraction.
 *
 * Privacy decision: PDFs and DOCX files are parsed in the browser and never
 * uploaded. Only the extracted text is used locally, and only the fields the
 * user confirms are sent anywhere (and only if they opt into an AI action).
 */

export interface ExtractionResult {
  text: string;
  kind: "pdf" | "docx" | "txt";
  warnings: string[];
  pages?: number;
}

export const MAX_IMPORT_BYTES = 8 * 1024 * 1024;

export const ACCEPTED_IMPORT_TYPES = ".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

export class ImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportError";
  }
}

const extensionOf = (name: string): string => name.toLowerCase().split(".").pop() ?? "";

export const extractTextFromFile = async (file: File): Promise<ExtractionResult> => {
  if (file.size > MAX_IMPORT_BYTES) {
    throw new ImportError("That file is larger than 8 MB. Resume files are usually under 1 MB — check you picked the right file.");
  }
  const ext = extensionOf(file.name);
  if (ext === "pdf" || file.type === "application/pdf") return extractPdf(file);
  if (ext === "docx") return extractDocx(file);
  if (["txt", "md", "text", "rtf"].includes(ext) || file.type.startsWith("text/")) {
    const text = await file.text();
    return { text: sanitizeText(text), kind: "txt", warnings: ext === "rtf" ? ["RTF is read as plain text; formatting is lost."] : [] };
  }
  if (ext === "doc") {
    throw new ImportError("Legacy .doc files cannot be read in the browser. Save it as .docx or PDF and try again.");
  }
  throw new ImportError("Unsupported file type. Upload a PDF, DOCX or plain text file.");
};

/** Strips control characters and normalises whitespace while keeping line breaks. */
export const sanitizeText = (input: string): string =>
  input
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/* ---------------------------------------------------------------------- pdf */

const extractPdf = async (file: File): Promise<ExtractionResult> => {
  const warnings: string[] = [];
  try {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const buffer = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false, useSystemFonts: true }).promise;
    const chunks: string[] = [];
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();
      let lastY: number | null = null;
      let line = "";
      const lines: string[] = [];
      for (const item of content.items) {
        if (!("str" in item)) continue;
        const y = Math.round(item.transform[5]);
        if (lastY !== null && Math.abs(y - lastY) > 2) {
          lines.push(line.trim());
          line = "";
        }
        line += item.str + (item.hasEOL ? "\n" : " ");
        lastY = y;
      }
      if (line.trim()) lines.push(line.trim());
      chunks.push(lines.join("\n"));
    }
    const text = sanitizeText(chunks.join("\n\n"));
    if (text.replace(/\s/g, "").length < 40) {
      throw new ImportError(
        "This PDF appears to be a scan or image export, so there is no text layer to read. Try exporting the original document as PDF, or paste the text instead.",
      );
    }
    warnings.push("PDF text order can shift for multi-column layouts. Check each section before saving.");
    return { text, kind: "pdf", warnings, pages: doc.numPages };
  } catch (error) {
    if (error instanceof ImportError) throw error;
    throw new ImportError(
      `We could not read that PDF (${(error as Error).message?.slice(0, 120) ?? "unknown error"}). Try a different export, or paste the text.`,
    );
  }
};

/* --------------------------------------------------------------------- docx */

/**
 * Minimal ZIP reader for DOCX. Uses the browser's native `DecompressionStream`,
 * so no heavyweight archive library ships to the client.
 */
const readZipEntry = async (buffer: ArrayBuffer, entryName: string): Promise<string | null> => {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder("utf-8");

  // Locate the end-of-central-directory record (max 64KB back-scan).
  let eocd = -1;
  const minOffset = Math.max(0, bytes.length - 65_557);
  for (let i = bytes.length - 22; i >= minOffset; i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;

  const entryCount = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);

  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) break;
    const compression = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));

    if (name === entryName) {
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const data = bytes.subarray(dataStart, dataStart + compressedSize);
      if (compression === 0) return decoder.decode(data);
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      const inflated = await new Response(stream).arrayBuffer();
      return decoder.decode(inflated);
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return null;
};

const xmlToText = (xml: string): string => {
  const withBreaks = xml
    .replace(/<w:p[^>]*>/g, "\n")
    .replace(/<w:br[^>]*\/>/g, "\n")
    .replace(/<w:tab[^>]*\/>/g, "\t")
    .replace(/<w:numPr>[\s\S]*?<\/w:numPr>/g, "\n• ");
  const stripped = withBreaks.replace(/<[^>]+>/g, "");
  return stripped
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
};

const extractDocx = async (file: File): Promise<ExtractionResult> => {
  try {
    const buffer = await file.arrayBuffer();
    const xml = await readZipEntry(buffer, "word/document.xml");
    if (!xml) throw new ImportError("That file does not look like a valid DOCX (no document body found).");
    const text = sanitizeText(xmlToText(xml));
    if (text.replace(/\s/g, "").length < 20) throw new ImportError("The DOCX had almost no text — it may be image-based.");
    return {
      text,
      kind: "docx",
      warnings: [
        "DOCX is read as plain text: bold, columns and text boxes are not preserved.",
        "Numbered list markers may be lost. Bullet lines are reconstructed from the paste.",
      ],
    };
  } catch (error) {
    if (error instanceof ImportError) throw error;
    throw new ImportError(
      `We could not read that DOCX (${(error as Error).message?.slice(0, 120) ?? "unknown error"}). Re-export it or paste the text.`,
    );
  }
};
