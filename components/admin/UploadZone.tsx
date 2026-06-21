"use client";

import { cn } from "@/lib/utils";
import { CloudUpload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import Button from "@/components/ui/Button";

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  label?: string;
  sublabel?: string;
  buttonText?: string;
  icon?: React.ReactNode;
}

export default function UploadZone({
  onFilesSelected,
  accept = "video/mp4,video/webm,.mp4,.webm",
  multiple = false,
  maxSize,
  label = "Drag & drop video files here",
  sublabel = "Supports MP4, WebM",
  buttonText = "Browse Files",
  icon,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      let fileArray = Array.from(files);
      if (maxSize) {
        fileArray = fileArray.filter((f) => f.size <= maxSize);
      }
      onFilesSelected(fileArray);
    },
    [onFilesSelected, maxSize]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={cn(
        "border-2 border-dashed rounded-xl p-10 text-center transition-colors",
        isDragging ? "border-blue-500 bg-blue-50" : "border-blue-200 bg-white hover:border-blue-300"
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
          {icon || <CloudUpload className="w-7 h-7 text-blue-600" />}
        </div>
        <div>
          <p className="text-base font-medium text-slate-900">{label}</p>
          <p className="text-sm text-slate-500 mt-1">{sublabel}</p>
        </div>
        <Button onClick={() => inputRef.current?.click()} size="md">
          {buttonText}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}
