"use client";

import { useRef, useState, useTransition } from "react";
import { uploadDocumentsAction } from "@/lib/actions";

export default function UploadDropzone() {
  const [dragOver, setDragOver] = useState(false);
  const [pending, startTransition] = useTransition();
  const [count, setCount] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function submitFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    setCount(arr.length);
    const formData = new FormData();
    arr.forEach((f) => formData.append("files", f));
    startTransition(async () => {
      await uploadDocumentsAction(formData);
      setCount(null);
    });
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        submitFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className="panel flex flex-col items-center justify-center gap-2 py-10 cursor-pointer text-center transition-colors"
      style={{ borderStyle: "dashed", borderColor: dragOver ? "var(--text)" : "var(--line)", background: dragOver ? "var(--panel-2)" : "var(--panel)" }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="application/pdf,image/png,image/jpeg"
        className="hidden"
        onChange={(e) => e.target.files && submitFiles(e.target.files)}
      />
      {pending ? (
        <p className="mono text-sm" style={{ color: "var(--muted)" }}>
          Extracting {count} document{count === 1 ? "" : "s"}…
        </p>
      ) : (
        <>
          <p className="text-sm font-medium">Drop invoices here, or click to browse</p>
          <p className="mono text-xs" style={{ color: "var(--muted-2)" }}>
            PDF, PNG, or JPG — multiple files at once
          </p>
        </>
      )}
    </div>
  );
}
