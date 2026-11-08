import React, { useRef, useState } from 'react';
import { UploadCloud, FileUp } from 'lucide-react';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  title?: string;
  subtitle?: string;
  maxSizeMB?: number;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFilesSelected,
  accept = '.pdf',
  multiple = false,
  title = 'Drag & drop files here, or browse',
  subtitle = 'Supports PDF documents up to 100MB',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(multiple ? filesArray : [filesArray[0]]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(multiple ? filesArray : [filesArray[0]]);
    }
    // Reset value so same file can be re-selected if needed
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative group cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 ${
        isDragOver
          ? 'border-primary bg-primary/5 scale-[1.01]'
          : 'border-border/80 bg-card/60 hover:bg-card hover:border-primary/50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center space-y-4">
        <div
          className={`p-4 rounded-2xl transition-transform duration-200 group-hover:scale-110 ${
            isDragOver
              ? 'bg-primary text-primary-foreground'
              : 'bg-primary/10 text-primary'
          }`}
        >
          {isDragOver ? (
            <FileUp className="h-8 w-8 animate-bounce" />
          ) : (
            <UploadCloud className="h-8 w-8" />
          )}
        </div>

        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
            {title}
          </p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-sm shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95"
        >
          Browse Files
        </button>
      </div>
    </div>
  );
};
