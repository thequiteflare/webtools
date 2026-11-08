import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
  FileText,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Download,
  Loader2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { FileDropzone } from '../../components/shared/FileDropzone';
import { downloadFile, formatBytes } from '../../lib/pdfUtils';

interface PdfFileItem {
  id: string;
  file: File;
  pageCount: number;
  size: number;
}

export default function MergePdf() {
  const [files, setFiles] = useState<PdfFileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [outputName, setOutputName] = useState('merged-document.pdf');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFilesSelected = async (newFiles: File[]) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const parsedItems: PdfFileItem[] = [];

      for (const file of newFiles) {
        if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
          continue;
        }

        try {
          const buffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
          parsedItems.push({
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            file,
            pageCount: pdfDoc.getPageCount(),
            size: file.size,
          });
        } catch {
          console.warn(`Failed to inspect ${file.name}`);
        }
      }

      if (parsedItems.length === 0) {
        setError('No valid, unencrypted PDF files were detected.');
      } else {
        setFiles(prev => [...prev, ...parsedItems]);
      }
    } catch {
      setError('An error occurred while loading the PDF files.');
    } finally {
      setIsLoading(false);
    }
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;

    const newFiles = [...files];
    const temp = newFiles[index];
    newFiles[index] = newFiles[targetIndex];
    newFiles[targetIndex] = temp;
    setFiles(newFiles);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
    setError(null);
    setSuccess(false);
  };

  const totalPages = files.reduce((acc, f) => acc + f.pageCount, 0);
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please add at least 2 PDF files to merge.');
      return;
    }

    setIsMerging(true);
    setError(null);
    setSuccess(false);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of files) {
        const fileBuffer = await item.file.arrayBuffer();
        const sourcePdf = await PDFDocument.load(fileBuffer);
        const copiedPages = await mergedPdf.copyPages(
          sourcePdf,
          sourcePdf.getPageIndices()
        );
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();
      const finalName = outputName.trim().endsWith('.pdf')
        ? outputName.trim()
        : `${outputName.trim()}.pdf`;

      downloadFile(mergedBytes, finalName);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to merge PDF files.');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Alert Notices */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>Successfully merged and downloaded your PDF!</span>
        </div>
      )}

      {files.length === 0 ? (
        <FileDropzone
          onFilesSelected={handleFilesSelected}
          accept=".pdf,application/pdf"
          multiple={true}
          title="Drag & drop PDF files to merge"
          subtitle="Select 2 or more PDF files. 100% private in-browser processing."
        />
      ) : (
        <div className="space-y-6">
          {/* Action Header & Summary Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border/80 bg-card">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  {files.length} {files.length === 1 ? 'Document' : 'Documents'}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground font-medium">
                  {totalPages} total pages
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {formatBytes(totalSize)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Drag or use arrows to change the order in the final document.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors">
                <Plus className="h-3.5 w-3.5" />
                <span>Add More</span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  onChange={e => {
                    if (e.target.files) {
                      handleFilesSelected(Array.from(e.target.files));
                    }
                  }}
                  className="hidden"
                />
              </label>

              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-destructive/10 hover:text-destructive text-xs font-semibold text-muted-foreground transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Reorderable File List */}
          <div className="space-y-2">
            {files.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card hover:border-border transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {index + 1}
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate max-w-xs sm:max-w-md">
                      {item.file.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
                      <span>{item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'}</span>
                      <span>•</span>
                      <span>{formatBytes(item.size)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveFile(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moveFile(index, 'down')}
                    disabled={index === files.length - 1}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeFile(item.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1"
                    title="Remove file"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Output Name and Merge Button */}
          <div className="p-6 rounded-2xl border border-border/80 bg-card space-y-4">
            <div className="grid sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Output Filename
                </label>
                <input
                  type="text"
                  value={outputName}
                  onChange={e => setOutputName(e.target.value)}
                  placeholder="merged-document.pdf"
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="sm:text-right pt-2 sm:pt-6">
                <button
                  onClick={handleMerge}
                  disabled={isMerging || files.length < 2}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95"
                >
                  {isMerging ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Merging Documents...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Merge & Download PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-6 gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Analyzing PDF structure...</span>
        </div>
      )}
    </div>
  );
}
