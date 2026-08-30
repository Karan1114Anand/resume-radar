"use client";

import { useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { FileText, Paperclip, UploadCloud, X } from "lucide-react";
import { Button } from "./Button";

interface Props {
  file: File | null;
  onFile: (file: File | null) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

const MAX_BYTES = 5 * 1024 * 1024;

export function UploadZone({ file, onFile, onError, disabled }: Props) {
  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      if (rejections.length > 0) {
        const code = rejections[0].errors[0]?.code;
        onError(
          code === "file-too-large"
            ? "That file is larger than 5 MB. Please upload a smaller PDF."
            : "Please upload a single PDF file.",
        );
        return;
      }
      if (accepted[0]) {
        onError("");
        onFile(accepted[0]);
      }
    },
    [onFile, onError],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: MAX_BYTES,
    multiple: false,
    disabled,
    noClick: !!file,
    noKeyboard: !!file,
  });

  if (file) {
    return (
      <div className="relative flex items-center justify-between gap-4 rounded-sm border border-ink/50 bg-parchment p-4 shadow-paper">
        <Paperclip className="absolute -left-2 -top-3 h-7 w-7 -rotate-12 text-faded" aria-hidden />
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-ink/40 bg-cream text-corp">
            <FileText className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate font-typewriter text-sm text-ink">{file.name}</p>
            <p className="text-xs italic text-faded">{(file.size / 1024).toFixed(0)} KB · filed as PDF</p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onFile(null)}
          disabled={disabled}
          aria-label="Remove file"
        >
          <X className="h-4 w-4" aria-hidden />
          Replace
        </Button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      role="button"
      tabIndex={0}
      aria-label="Upload your resume as a PDF"
      className={`flex cursor-pointer flex-col items-center justify-center rounded-sm border-2 border-dashed border-ink/50 px-6 py-14 text-center shadow-inset-rule transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-corp ${
        isDragActive ? "bg-highlight/30" : "bg-parchment/60 hover:bg-parchment"
      }`}
    >
      <input {...getInputProps()} />
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-ink/40 bg-cream text-corp">
        <UploadCloud className="h-7 w-7" aria-hidden />
      </span>
      <p className="font-typewriter text-base text-ink">
        {isDragActive ? "Drop it in the tray" : "Drop your résumé here"}
      </p>
      {!isDragActive && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="mt-1.5 font-typewriter text-sm uppercase tracking-wider text-corp underline decoration-dotted underline-offset-4 hover:text-stamp focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-corp"
        >
          or browse the filing cabinet
        </button>
      )}
      <p className="mt-4 text-xs italic text-faded">
        PDF only · up to 5 MB · shredded after your session
      </p>
    </div>
  );
}
