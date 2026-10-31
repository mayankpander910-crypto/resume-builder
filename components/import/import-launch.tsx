"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Upload } from "lucide-react";
import { ACCEPTED_IMPORT_TYPES, extractTextFromFile, ImportError, MAX_IMPORT_BYTES } from "@/lib/resume/import/extract";
import { parseResumeText } from "@/lib/resume/import/parse";
import { cn } from "@/lib/utils/cn";

export function ImportLaunch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = async (file: File) => {
    setError(null);
    if (file.size > MAX_IMPORT_BYTES) {
      setError("That file is larger than 8 MB. Most resumes are under 1 MB — check you exported the right document.");
      return;
    }
    setBusy(true);
    try {
      const extracted = await extractTextFromFile(file);
      const parsed = parseResumeText(extracted.text);
      if (extracted.text.trim().length < 60) {
        setError("No selectable text was found. If this is a scan or a photo, export a text-based PDF or paste the text instead.");
        setBusy(false);
        return;
      }
      try {
        sessionStorage.setItem("rf:import-text", extracted.text);
      } catch {
        /* ignore — the editor's dialog still accepts a paste */
      }
      void parsed;
      router.push("/builder?import=1");
    } catch (err) {
      setError(err instanceof ImportError ? err.message : "That file could not be read.");
      setBusy(false);
    }
  };

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) void handle(file);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-[9px] border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-accent bg-accent-soft/50" : "border-line-strong bg-surface",
        )}
      >
        <div className="grid size-11 place-items-center rounded-[8px] border border-line bg-surface-2">
          {busy ? <Loader2 className="size-5 animate-spin text-accent" /> : <Upload className="size-5 text-accent" />}
        </div>
        <p className="mt-3 text-[14px] font-semibold text-ink">{busy ? "Reading the file…" : "Drop your resume here"}</p>
        <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-subtle">
          PDF, DOCX, TXT or MD up to 8 MB. The text is extracted in your browser — the file itself never leaves this device.
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-[5px] bg-accent px-3.5 py-2 text-[13px] font-medium text-white hover:bg-accent-hover disabled:opacity-60"
          >
            Choose a file
          </button>
          <button
            type="button"
            onClick={() => router.push("/builder?import=1")}
            className="rounded-[5px] border border-line-strong px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-surface-2"
          >
            Paste text instead
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMPORT_TYPES}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handle(file);
          }}
        />
      </div>

      {error ? (
        <p className="mt-2 flex items-start gap-1.5 rounded-[6px] border border-danger/25 bg-danger-soft px-2.5 py-2 text-[12px] leading-relaxed text-danger">
          <FileText className="mt-0.5 size-3.5 shrink-0" /> {error}
        </p>
      ) : null}
    </div>
  );
}
