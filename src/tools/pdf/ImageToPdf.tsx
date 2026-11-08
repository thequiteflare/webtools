import { useState } from 'react';
import { PDFDocument, PageSizes } from 'pdf-lib';
import {
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

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  size: number;
}

type PageSizeOption = 'A4' | 'Letter' | 'Fit';
type OrientationOption = 'portrait' | 'landscape' | 'auto';
type MarginOption = 0 | 20 | 40;

export default function ImageToPdf() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSizeOption>('A4');
  const [orientation, setOrientation] = useState<OrientationOption>('auto');
  const [margin, setMargin] = useState<MarginOption>(20);
  const [outputName, setOutputName] = useState('images-document.pdf');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFilesSelected = (files: File[]) => {
    setError(null);
    setSuccess(false);

    const validImages = files.filter(f => f.type.startsWith('image/'));
    if (validImages.length === 0) {
      setError('Please select valid image files (PNG, JPEG, WebP, etc.).');
      return;
    }

    validImages.forEach(file => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setImages(prev => [
          ...prev,
          {
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            file,
            previewUrl: url,
            width: img.naturalWidth,
            height: img.naturalHeight,
            size: file.size,
          },
        ]);
      };
      img.src = url;
    });
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    setImages(newImages);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const item = prev.find(i => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(i => i.id !== id);
    });
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setError(null);
    setSuccess(false);
  };

  /**
   * Converts any image (including WebP/AVIF) to PNG buffer for pdf-lib embedding
   */
  const getImageBuffer = async (file: File): Promise<{ buffer: ArrayBuffer; isJpg: boolean }> => {
    const isJpg = file.type === 'image/jpeg' || file.type === 'image/jpg';
    const isPng = file.type === 'image/png';

    if (isJpg || isPng) {
      return { buffer: await file.arrayBuffer(), isJpg };
    }

    // Fallback for WebP/SVG: draw onto canvas and export to PNG bytes
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(async blob => {
          URL.revokeObjectURL(url);
          if (blob) {
            resolve({ buffer: await blob.arrayBuffer(), isJpg: false });
          } else {
            reject(new Error('Failed to convert image to blob'));
          }
        }, 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });
  };

  const handleConvert = async () => {
    if (images.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const item of images) {
        const { buffer, isJpg } = await getImageBuffer(item.file);
        const embeddedImage = isJpg
          ? await pdfDoc.embedJpg(buffer)
          : await pdfDoc.embedPng(buffer);

        let pageWidth: number;
        let pageHeight: number;

        if (pageSize === 'Fit') {
          pageWidth = embeddedImage.width + margin * 2;
          pageHeight = embeddedImage.height + margin * 2;
        } else {
          const standardSize = pageSize === 'Letter' ? PageSizes.Letter : PageSizes.A4;
          const isImgLandscape = embeddedImage.width > embeddedImage.height;

          if (orientation === 'landscape' || (orientation === 'auto' && isImgLandscape)) {
            pageWidth = standardSize[1];
            pageHeight = standardSize[0];
          } else {
            pageWidth = standardSize[0];
            pageHeight = standardSize[1];
          }
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Calculate fitted image dimensions maintaining aspect ratio
        const availableWidth = pageWidth - margin * 2;
        const availableHeight = pageHeight - margin * 2;
        const scaleFactor = Math.min(
          availableWidth / embeddedImage.width,
          availableHeight / embeddedImage.height
        );

        const drawWidth = embeddedImage.width * scaleFactor;
        const drawHeight = embeddedImage.height * scaleFactor;

        // Center on the page
        const drawX = margin + (availableWidth - drawWidth) / 2;
        const drawY = margin + (availableHeight - drawHeight) / 2;

        page.drawImage(embeddedImage, {
          x: drawX,
          y: drawY,
          width: drawWidth,
          height: drawHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const finalName = outputName.trim().endsWith('.pdf')
        ? outputName.trim()
        : `${outputName.trim()}.pdf`;

      downloadFile(pdfBytes, finalName);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to create PDF from images.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>Successfully generated and downloaded your PDF!</span>
        </div>
      )}

      {images.length === 0 ? (
        <FileDropzone
          onFilesSelected={handleFilesSelected}
          accept="image/*"
          multiple={true}
          title="Drag & drop images to convert to PDF"
          subtitle="Supports PNG, JPG, JPEG, and WebP. 100% client-side."
        />
      ) : (
        <div className="space-y-6">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border/80 bg-card">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  {images.length} {images.length === 1 ? 'Image' : 'Images'} Selected
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Each image will become a page in the generated PDF document.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors">
                <Plus className="h-3.5 w-3.5" />
                <span>Add More</span>
                <input
                  type="file"
                  accept="image/*"
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
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Configuration Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl border border-border/80 bg-card">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Page Size
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['A4', 'Letter', 'Fit'] as PageSizeOption[]).map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPageSize(size)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-colors ${
                      pageSize === size
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {size === 'Fit' ? 'Fit Image' : size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Orientation
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['auto', 'portrait', 'landscape'] as OrientationOption[]).map(ori => (
                  <button
                    key={ori}
                    type="button"
                    disabled={pageSize === 'Fit'}
                    onClick={() => setOrientation(ori)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold capitalize transition-colors disabled:opacity-40 ${
                      orientation === ori && pageSize !== 'Fit'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {ori}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Margin
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  { label: 'None', val: 0 },
                  { label: 'Small', val: 20 },
                  { label: 'Normal', val: 40 },
                ] as const).map(m => (
                  <button
                    key={m.val}
                    type="button"
                    onClick={() => setMargin(m.val as MarginOption)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-colors ${
                      margin === m.val
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Image List */}
          <div className="space-y-2">
            {images.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-card hover:border-border transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-6 w-6 rounded-md bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs shrink-0">
                    {index + 1}
                  </span>
                  <div className="h-12 w-12 rounded-lg border border-border/60 bg-muted/40 overflow-hidden flex items-center justify-center shrink-0">
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate max-w-xs sm:max-w-md">
                      {item.file.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
                      <span>{item.width} × {item.height}px</span>
                      <span>•</span>
                      <span>{formatBytes(item.size)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveImage(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30"
                    title="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moveImage(index, 'down')}
                    disabled={index === images.length - 1}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30"
                    title="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeImage(item.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1"
                    title="Remove image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Output and Convert Action */}
          <div className="p-6 rounded-2xl border border-border/80 bg-card">
            <div className="grid sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Output Filename
                </label>
                <input
                  type="text"
                  value={outputName}
                  onChange={e => setOutputName(e.target.value)}
                  placeholder="images-document.pdf"
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="sm:text-right pt-2 sm:pt-6">
                <button
                  onClick={handleConvert}
                  disabled={isProcessing || images.length === 0}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Generate & Download PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
