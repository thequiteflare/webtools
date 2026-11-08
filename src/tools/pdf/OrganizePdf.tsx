import { useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import {
  RotateCw,
  Trash2,
  Undo2,
  ArrowLeft,
  ArrowRight,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { FileDropzone } from '../../components/shared/FileDropzone';
import { pdfjsLib, renderPageThumbnail, downloadFile, formatBytes } from '../../lib/pdfUtils';

interface PageItem {
  id: number;
  originalIndex: number;
  thumbnailUrl: string;
  rotation: number; // 0, 90, 180, 270
  isDeleted: boolean;
}

export default function OrganizePdf() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelected = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setSourceFile(file);

    try {
      const arrayBuffer = await file.arrayBuffer();
      // Load with pdfjs for rendering thumbnails
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      setLoadingProgress({ current: 0, total: numPages });

      const loadedPages: PageItem[] = [];
      for (let i = 1; i <= numPages; i++) {
        setLoadingProgress({ current: i, total: numPages });
        const thumb = await renderPageThumbnail(pdfDoc, i, 0.35);
        loadedPages.push({
          id: i,
          originalIndex: i - 1,
          thumbnailUrl: thumb,
          rotation: 0,
          isDeleted: false,
        });
      }

      setPages(loadedPages);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Could not parse or render this PDF document.');
      setSourceFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDelete = (id: number) => {
    setPages(prev =>
      prev.map(p => (p.id === id ? { ...p, isDeleted: !p.isDeleted } : p))
    );
  };

  const rotatePage = (id: number) => {
    setPages(prev =>
      prev.map(p =>
        p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )
    );
  };

  const movePage = (currentIndex: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    const newPages = [...pages];
    const temp = newPages[currentIndex];
    newPages[currentIndex] = newPages[targetIndex];
    newPages[targetIndex] = temp;
    setPages(newPages);
  };

  const resetAll = () => {
    setPages(prev =>
      prev.map(p => ({ ...p, isDeleted: false, rotation: 0 }))
    );
  };

  const remainingPages = pages.filter(p => !p.isDeleted);

  const handleExport = async () => {
    if (!sourceFile) return;
    if (remainingPages.length === 0) {
      setError('You must keep at least 1 page in the document.');
      return;
    }

    setIsExporting(true);
    setError(null);
    setSuccess(false);

    try {
      const buffer = await sourceFile.arrayBuffer();
      const originalPdf = await PDFDocument.load(buffer);
      const newPdf = await PDFDocument.create();

      for (const pageItem of remainingPages) {
        const [copiedPage] = await newPdf.copyPages(originalPdf, [pageItem.originalIndex]);
        if (pageItem.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees((currentRotation + pageItem.rotation) % 360));
        }
        newPdf.addPage(copiedPage);
      }

      const pdfBytes = await newPdf.save();
      const baseName = sourceFile.name.replace(/\.[^/.]+$/, '');
      downloadFile(pdfBytes, `${baseName}-organized.pdf`);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to export modified PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>Successfully exported organized PDF!</span>
        </div>
      )}

      {!sourceFile ? (
        <FileDropzone
          onFilesSelected={handleFileSelected}
          accept=".pdf,application/pdf"
          multiple={false}
          title="Upload PDF to organize, rotate & delete pages"
          subtitle="All pages rendered visually in-browser. Zero data uploaded."
        />
      ) : (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border/80 bg-card">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-foreground truncate max-w-sm">
                  {sourceFile.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {remainingPages.length} of {pages.length} pages kept • {formatBytes(sourceFile.size)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetAll}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-muted-foreground transition-colors"
              >
                <Undo2 className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>

              <button
                onClick={() => {
                  setSourceFile(null);
                  setPages([]);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-destructive/10 hover:text-destructive text-xs font-semibold text-muted-foreground transition-colors"
              >
                <span>Change File</span>
              </button>

              <button
                onClick={handleExport}
                disabled={isExporting || remainingPages.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-sm shadow-primary/25 hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Save PDF ({remainingPages.length} pgs)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Loading indicator during thumbnail rendering */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-border/80 bg-card space-y-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm font-medium text-foreground">
                Rendering page {loadingProgress.current} of {loadingProgress.total}...
              </p>
              <div className="w-48 bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-150"
                  style={{
                    width: `${(loadingProgress.current / (loadingProgress.total || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Interactive Page Thumbnails Grid */}
          {!isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {pages.map((page, index) => (
                <div
                  key={page.id}
                  className={`group relative flex flex-col justify-between rounded-xl border p-2 transition-all duration-200 ${
                    page.isDeleted
                      ? 'border-destructive/40 bg-destructive/5 opacity-50'
                      : 'border-border/80 bg-card hover:border-primary/50 hover:shadow-md'
                  }`}
                >
                  {/* Page Preview Image */}
                  <div className="relative aspect-[3/4] w-full rounded-lg bg-muted/40 overflow-hidden flex items-center justify-center border border-border/40">
                    <img
                      src={page.thumbnailUrl}
                      alt={`Page ${page.id}`}
                      className="max-h-full max-w-full object-contain transition-transform duration-200 shadow-sm"
                      style={{
                        transform: `rotate(${page.rotation}deg)`,
                      }}
                    />

                    {/* Page Number Badge */}
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-background/90 backdrop-blur-sm border border-border/50 text-[11px] font-bold text-foreground shadow-sm">
                      #{index + 1}
                    </span>

                    {/* Status Overlay if deleted */}
                    {page.isDeleted && (
                      <div className="absolute inset-0 bg-destructive/20 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="px-2.5 py-1 rounded-md bg-destructive text-destructive-foreground text-xs font-bold shadow">
                          Deleted
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Page Controls Toolbar */}
                  <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => movePage(index, 'left')}
                        disabled={index === 0 || page.isDeleted}
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20"
                        title="Move left"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => movePage(index, 'right')}
                        disabled={index === pages.length - 1 || page.isDeleted}
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20"
                        title="Move right"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => rotatePage(page.id)}
                        disabled={page.isDeleted}
                        className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-20"
                        title="Rotate 90°"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => toggleDelete(page.id)}
                        className={`p-1 rounded transition-colors ${
                          page.isDeleted
                            ? 'text-primary hover:bg-primary/10'
                            : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                        }`}
                        title={page.isDeleted ? 'Restore page' : 'Delete page'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
